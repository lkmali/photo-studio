-- DANGER: deletes every app table and all their data (pages, media, albums,
-- enquiries, settings, roles). Run the migrations and seed.sql afterwards to
-- recreate an empty database.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.album_media,
  public.page_sections,
  public.website_pages,
  public.albums,
  public.media_items,
  public.categories,
  public.navigation_items,
  public.enquiries,
  public.website_settings,
  public.profiles
cascade;

-- Leftovers from the older schema, in case they were ever created.
drop table if exists public.audit_log, public.website_publications, public.page_revisions cascade;
drop function if exists public.publish_page(uuid, text);
drop function if exists public.rollback_page(uuid, uuid);
drop function if exists public.permanently_delete(text, uuid);
drop function if exists public.guard_page_publish_columns();

drop function if exists public.set_user_role(text, public.app_role);
drop function if exists public.create_staff_user(text, text, public.app_role);
drop function if exists public.is_admin();
drop function if exists public.is_staff();
drop function if exists public.current_app_role();
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

drop type if exists
  public.app_role,
  public.media_type,
  public.validation_status,
  public.page_status,
  public.enquiry_status,
  public.nav_location
cascade;

-- Logins (Supabase Auth users) are kept. To delete every login as well,
-- uncomment the next line. The ADMIN_EMAIL account is recreated on next sign-in.
-- delete from auth.users;
