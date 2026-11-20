-- Row Level Security and role helpers.
-- Roles: editor and admin can both edit content; only admins manage users.
-- Edits update rows directly; there is no revision history or audit log.

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
alter table public.profiles         enable row level security;
alter table public.website_settings enable row level security;
alter table public.categories       enable row level security;
alter table public.media_items      enable row level security;
alter table public.albums           enable row level security;
alter table public.album_media      enable row level security;
alter table public.website_pages    enable row level security;
alter table public.page_sections    enable row level security;
alter table public.navigation_items enable row level security;
alter table public.enquiries        enable row level security;

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
  for select to anon, authenticated using (is_published or public.is_staff());
create policy media_staff_write on public.media_items
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- albums
create policy albums_public_read on public.albums
  for select to anon, authenticated using (is_published or public.is_staff());
create policy albums_staff_write on public.albums
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- album_media: visible when both album and media are public.
create policy album_media_public_read on public.album_media
  for select to anon, authenticated
  using (
    public.is_staff()
    or (
      exists (select 1 from public.albums a where a.id = album_id and a.is_published)
      and exists (select 1 from public.media_items m where m.id = media_item_id and m.is_published)
    )
  );
create policy album_media_staff_write on public.album_media
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- website_pages: public sees published pages; staff edit directly.
create policy pages_public_read on public.website_pages
  for select to anon, authenticated using (is_published or public.is_staff());
create policy pages_staff_write on public.website_pages
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- page_sections: public sees visible sections of published pages.
create policy sections_public_read on public.page_sections
  for select to anon, authenticated
  using (
    public.is_staff()
    or (
      is_visible
      and exists (select 1 from public.website_pages p where p.id = page_id and p.is_published)
    )
  );
create policy sections_staff_write on public.page_sections
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

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
create policy enquiries_staff_delete on public.enquiries
  for delete to authenticated using (public.is_staff());

revoke execute on function public.handle_new_user() from public, anon, authenticated;
