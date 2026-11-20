-- Table privileges for the Supabase API roles. Newer projects do not grant
-- these automatically. RLS policies still decide which rows each role sees.

grant usage on schema public to anon, authenticated, service_role;

-- Server-side trusted code (service role key): full access, bypasses RLS.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Signed-in users: RLS limits them to what their role allows.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Visitors: read-only, and only the tables the public site needs.
grant select on
  public.website_settings,
  public.categories,
  public.media_items,
  public.albums,
  public.album_media,
  public.website_pages,
  public.page_sections,
  public.navigation_items
to anon;

-- RLS policies call these helpers, so the calling roles must be able to run them.
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Tables added by later migrations get the same server and signed-in access.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
