-- Row Level Security, role helpers, and publishing functions.
-- Roles: editor = edit drafts/content; admin = editor + publish, rollback,
-- permanent delete, user management.

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies can read profiles without
-- recursive RLS checks)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'editor'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.website_settings     enable row level security;
alter table public.categories           enable row level security;
alter table public.media_items          enable row level security;
alter table public.albums               enable row level security;
alter table public.album_media          enable row level security;
alter table public.website_pages        enable row level security;
alter table public.page_sections        enable row level security;
alter table public.page_revisions       enable row level security;
alter table public.website_publications enable row level security;
alter table public.navigation_items     enable row level security;
alter table public.enquiries            enable row level security;
alter table public.audit_log            enable row level security;

-- profiles: users see themselves; admins see and manage everyone.
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- website_settings: public read, staff write.
create policy settings_public_read on public.website_settings
  for select to anon, authenticated using (true);
create policy settings_staff_write on public.website_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- categories
create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active or public.is_staff());
create policy categories_staff_write on public.categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- media_items
create policy media_public_read on public.media_items
  for select to anon, authenticated
  using ((is_published and deleted_at is null) or public.is_staff());
create policy media_staff_write on public.media_items
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- albums
create policy albums_public_read on public.albums
  for select to anon, authenticated
  using ((is_published and deleted_at is null) or public.is_staff());
create policy albums_staff_write on public.albums
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- album_media: visible when both album and media are public.
create policy album_media_public_read on public.album_media
  for select to anon, authenticated
  using (
    public.is_staff()
    or (
      exists (select 1 from public.albums a
              where a.id = album_id and a.is_published and a.deleted_at is null)
      and exists (select 1 from public.media_items m
                  where m.id = media_item_id and m.is_published and m.deleted_at is null)
    )
  );
create policy album_media_staff_write on public.album_media
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- website_pages: public sees live pages only. Staff can create/edit, but the
-- publish pointer is changed only by publish_page()/rollback_page().
create policy pages_public_read on public.website_pages
  for select to anon, authenticated
  using ((published_revision_id is not null and deleted_at is null) or public.is_staff());
create policy pages_staff_insert on public.website_pages
  for insert to authenticated
  with check (public.is_staff() and published_revision_id is null);
create policy pages_staff_update on public.website_pages
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Block direct edits of the publish pointer/status from the API.
create or replace function public.guard_page_publish_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') <> 'on'
     and (new.published_revision_id is distinct from old.published_revision_id
          or new.status is distinct from old.status) then
    raise exception 'published_revision_id and status can only be changed by publish_page/rollback_page';
  end if;
  return new;
end;
$$;

create trigger website_pages_guard_publish
  before update on public.website_pages
  for each row execute function public.guard_page_publish_columns();

-- page_sections: draft data, staff only. Hard delete is admin-only via function.
create policy sections_staff_select on public.page_sections
  for select to authenticated using (public.is_staff());
create policy sections_staff_insert on public.page_sections
  for insert to authenticated with check (public.is_staff());
create policy sections_staff_update on public.page_sections
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- page_revisions: public may read only the currently published revision.
-- Inserts happen only inside publish_page() (no insert policy).
create policy revisions_public_read on public.page_revisions
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.website_pages p
               where p.published_revision_id = page_revisions.id and p.deleted_at is null)
  );

-- website_publications: staff read only; written by functions.
create policy publications_staff_read on public.website_publications
  for select to authenticated using (public.is_staff());

-- navigation_items
create policy nav_public_read on public.navigation_items
  for select to anon, authenticated using (is_visible or public.is_staff());
create policy nav_staff_write on public.navigation_items
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- enquiries: no public access. Inserted by the server route (service role).
create policy enquiries_staff_read on public.enquiries
  for select to authenticated using (public.is_staff());
create policy enquiries_staff_update on public.enquiries
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- audit_log: admins read; written by functions only.
create policy audit_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- publish_page: snapshot visible, non-deleted draft sections into an
-- immutable revision and move the live pointer, all in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.publish_page(p_page_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision_id uuid;
  v_version integer;
  v_config jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can publish' using errcode = '42501';
  end if;

  perform 1 from public.website_pages
    where id = p_page_id and deleted_at is null
    for update;
  if not found then
    raise exception 'Page not found';
  end if;

  select jsonb_build_object(
           'sections',
           coalesce(jsonb_agg(
             jsonb_build_object(
               'id', s.id,
               'section_type', s.section_type,
               'title', s.title,
               'settings', s.settings,
               'responsive_settings', s.responsive_settings
             ) order by s.position, s.created_at
           ), '[]'::jsonb)
         )
    into v_config
    from public.page_sections s
   where s.page_id = p_page_id
     and s.deleted_at is null
     and s.is_visible;

  select coalesce(max(version_number), 0) + 1 into v_version
    from public.page_revisions where page_id = p_page_id;

  insert into public.page_revisions (page_id, version_number, configuration, publish_note, created_by)
  values (p_page_id, v_version, v_config, p_note, auth.uid())
  returning id into v_revision_id;

  perform set_config('app.publishing', 'on', true);
  update public.website_pages
     set published_revision_id = v_revision_id, status = 'published'
   where id = p_page_id;
  perform set_config('app.publishing', 'off', true);

  insert into public.website_publications (page_id, revision_id, published_by)
  values (p_page_id, v_revision_id, auth.uid());

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'publish', 'page', p_page_id,
          jsonb_build_object('revision_id', v_revision_id, 'version', v_version, 'note', p_note));

  return v_revision_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- rollback_page: republish an earlier revision of the same page.
-- ---------------------------------------------------------------------------
create or replace function public.rollback_page(p_page_id uuid, p_revision_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can roll back' using errcode = '42501';
  end if;

  perform 1 from public.page_revisions
    where id = p_revision_id and page_id = p_page_id;
  if not found then
    raise exception 'Revision does not belong to this page';
  end if;

  perform set_config('app.publishing', 'on', true);
  update public.website_pages
     set published_revision_id = p_revision_id, status = 'published'
   where id = p_page_id and deleted_at is null;
  perform set_config('app.publishing', 'off', true);

  insert into public.website_publications (page_id, revision_id, published_by)
  values (p_page_id, p_revision_id, auth.uid());

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'rollback', 'page', p_page_id,
          jsonb_build_object('revision_id', p_revision_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- permanently_delete: admin-only hard delete of an item already in Trash.
-- ---------------------------------------------------------------------------
create or replace function public.permanently_delete(p_entity_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can permanently delete' using errcode = '42501';
  end if;

  case p_entity_type
    when 'section' then
      delete from public.page_sections where id = p_id and deleted_at is not null;
    when 'media' then
      delete from public.media_items where id = p_id and deleted_at is not null;
    when 'album' then
      delete from public.albums where id = p_id and deleted_at is not null;
    else
      raise exception 'Unsupported entity type: %', p_entity_type;
  end case;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'Item not found or not in Trash';
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'permanent_delete', p_entity_type, p_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: never callable by anonymous visitors.
-- ---------------------------------------------------------------------------
revoke execute on function public.publish_page(uuid, text) from public, anon;
revoke execute on function public.rollback_page(uuid, uuid) from public, anon;
revoke execute on function public.permanently_delete(text, uuid) from public, anon;
grant execute on function public.publish_page(uuid, text) to authenticated;
grant execute on function public.rollback_page(uuid, uuid) to authenticated;
grant execute on function public.permanently_delete(text, uuid) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
