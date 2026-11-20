-- Media Library: photos and films added in the admin (by link) feed the
-- home page "Our Work" grid and "Featured Films" grid.
--   subtitle  small line under a photo card title ("120 Photos · 4 Videos")
--   duration  label on a film thumbnail ("04:32")
--   position  display order (lowest first)

alter table public.media_items
  add column if not exists subtitle text not null default '',
  add column if not exists duration text not null default '',
  add column if not exists position integer not null default 0;

create index if not exists media_items_order_idx
  on public.media_items (media_type, is_published, position);
