-- Small interface labels used across the public site: menu, close and play
-- icons and their screen-reader labels, the logo link and the logo alt text.
-- Keys (all optional, missing ones fall back to the default design):
--   brand_href, logo_alt, menu_icon, menu_label, close_icon, close_label,
--   play_icon, play_label ("{title}" is replaced with the film title)

alter table public.website_settings
  add column if not exists ui_labels jsonb not null default '{}'::jsonb
    check (jsonb_typeof(ui_labels) = 'object');
