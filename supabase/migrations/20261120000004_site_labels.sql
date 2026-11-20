-- Editable header/footer labels for the public site design.
-- Page content labels live in page_sections.settings (see supabase/seed.sql).

alter table public.website_settings
  add column if not exists brand_accent text not null default '',
  add column if not exists tagline text not null default '',
  add column if not exists header_cta_label text not null default 'Book a Shoot',
  add column if not exists header_cta_href text not null default '/#contact'
    check (header_cta_href ~ '^(/|#|https://|mailto:|tel:)'),
  add column if not exists footer_copyright text not null default '© {year} All rights reserved.';

comment on column public.website_settings.brand_accent is
  'Trailing part of site_name shown in the accent color, e.g. "Era" in "MomentEra". Empty for none.';
comment on column public.website_settings.footer_copyright is
  '"{year}" is replaced with the current year.';
