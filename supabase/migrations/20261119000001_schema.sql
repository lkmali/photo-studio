-- Photography website builder: core schema
-- Public routes read published revisions only; page_sections is draft data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'editor');
create type public.media_type as enum ('image', 'video', 'audio');
create type public.validation_status as enum ('valid', 'needs_permission', 'unsupported', 'pending');
create type public.page_status as enum ('draft', 'published', 'archived');
create type public.enquiry_status as enum ('new', 'contacted', 'booked', 'closed', 'spam');
create type public.nav_location as enum ('header', 'footer');

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (role is null until an admin grants one)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.app_role,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Website settings (single row)
-- ---------------------------------------------------------------------------
create table public.website_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  site_name text not null default 'My Photography',
  logo_url text check (logo_url is null or logo_url ~* '^https://'),
  primary_color text not null default '#111111' check (primary_color ~* '^#[0-9a-f]{6}$'),
  accent_color text not null default '#c8a96a' check (accent_color ~* '^#[0-9a-f]{6}$'),
  font_heading text not null default 'Playfair Display',
  font_body text not null default 'Inter',
  theme text not null default 'light' check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now()
);

create trigger website_settings_updated_at
  before update on public.website_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index categories_position_idx on public.categories (position);

-- ---------------------------------------------------------------------------
-- Media items (public URLs only, no uploads)
-- ---------------------------------------------------------------------------
create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  media_type public.media_type not null,
  provider text not null,
  original_url text not null check (original_url ~* '^https://'),
  embed_url text check (embed_url is null or embed_url ~* '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~* '^https://'),
  alt_text text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  is_published boolean not null default false,
  validation_status public.validation_status not null default 'pending',
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_items_category_idx on public.media_items (category_id);
create index media_items_public_idx on public.media_items (is_published) where deleted_at is null;

create trigger media_items_updated_at
  before update on public.media_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Albums
-- ---------------------------------------------------------------------------
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  cover_media_id uuid references public.media_items (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  event_date date,
  is_published boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index albums_category_idx on public.albums (category_id);

create trigger albums_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

create table public.album_media (
  album_id uuid not null references public.albums (id) on delete cascade,
  media_item_id uuid not null references public.media_items (id) on delete cascade,
  position integer not null default 0,
  primary key (album_id, media_item_id)
);

create index album_media_media_idx on public.album_media (media_item_id);

-- ---------------------------------------------------------------------------
-- Pages, draft sections, revisions, publications
-- ---------------------------------------------------------------------------
create table public.website_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  status public.page_status not null default 'draft',
  published_revision_id uuid, -- FK added after page_revisions exists
  seo_title text,
  seo_description text,
  og_image_url text check (og_image_url is null or og_image_url ~* '^https://'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger website_pages_updated_at
  before update on public.website_pages
  for each row execute function public.set_updated_at();

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.website_pages (id) on delete cascade,
  section_type text not null check (section_type ~ '^[a-z_]+$'),
  title text not null default '',
  position integer not null default 0,
  is_visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  responsive_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(responsive_settings) = 'object'),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_sections_page_idx on public.page_sections (page_id, position) where deleted_at is null;

create trigger page_sections_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();

create table public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.website_pages (id) on delete cascade,
  version_number integer not null,
  configuration jsonb not null,
  publish_note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version_number)
);

alter table public.website_pages
  add constraint website_pages_published_revision_fk
  foreign key (published_revision_id) references public.page_revisions (id) on delete set null;

create table public.website_publications (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.website_pages (id) on delete cascade,
  revision_id uuid not null references public.page_revisions (id) on delete cascade,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id) on delete set null
);

create index website_publications_page_idx on public.website_publications (page_id, published_at desc);

-- ---------------------------------------------------------------------------
-- Navigation
-- ---------------------------------------------------------------------------
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location public.nav_location not null,
  label text not null,
  href text not null check (href ~ '^/' or href ~* '^https://'),
  position integer not null default 0,
  is_visible boolean not null default true
);

create index navigation_items_location_idx on public.navigation_items (location, position);

-- ---------------------------------------------------------------------------
-- Enquiries (inserted server-side only)
-- ---------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  event_type text,
  event_date date,
  message text not null check (char_length(message) <= 5000),
  status public.enquiry_status not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index enquiries_rate_idx on public.enquiries (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (written by security-definer functions)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);
