-- Initial content. Safe to re-run.

insert into public.website_settings (site_name)
values ('My Photography')
on conflict (singleton) do nothing;

insert into public.categories (name, slug, position) values
  ('Wedding', 'wedding', 1),
  ('Pre-wedding', 'pre-wedding', 2),
  ('Birthday', 'birthday', 3),
  ('Events', 'events', 4),
  ('Portraits', 'portraits', 5),
  ('Family', 'family', 6),
  ('Commercial', 'commercial', 7),
  ('Other', 'other', 8)
on conflict (slug) do nothing;

insert into public.website_pages (slug, title) values
  ('home', 'Home'),
  ('portfolio', 'Portfolio'),
  ('services', 'Services'),
  ('about', 'About'),
  ('contact', 'Contact')
on conflict (slug) do nothing;

insert into public.navigation_items (location, label, href, position)
select * from (values
  ('header'::public.nav_location, 'Home', '/', 1),
  ('header'::public.nav_location, 'Portfolio', '/portfolio', 2),
  ('header'::public.nav_location, 'Services', '/services', 3),
  ('header'::public.nav_location, 'About', '/about', 4),
  ('header'::public.nav_location, 'Contact', '/contact', 5)
) as v(location, label, href, position)
where not exists (select 1 from public.navigation_items);

-- To make your first admin, sign up once, then run (replace the email):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
