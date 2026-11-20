-- Initial content. Safe to re-run: nothing here overwrites edits made in the admin.
-- The default site content mirrors momentera_photography_website.html
-- (source of truth for defaults: src/lib/site/defaults.json).

insert into public.website_settings (site_name, brand_accent, tagline, header_cta_label, header_cta_href, footer_copyright)
values ('MomentEra', 'Era', 'Photography Studio', 'Book a Shoot', '/#contact',
        '© {year} MomentEra Photography Studio. All rights reserved.')
on conflict (singleton) do nothing;

-- Databases seeded before the site design existed still have the old placeholder name.
update public.website_settings
set site_name = 'MomentEra',
    brand_accent = 'Era',
    tagline = 'Photography Studio',
    footer_copyright = '© {year} MomentEra Photography Studio. All rights reserved.'
where site_name = 'My Photography' and brand_accent = '' and tagline = '';

-- Interface labels (menu, close, play icons and their screen-reader text).
update public.website_settings
set ui_labels = '{
  "brand_href": "/#home",
  "logo_alt": "",
  "menu_icon": "☰",
  "menu_label": "Open navigation",
  "close_icon": "×",
  "close_label": "Close",
  "play_icon": "▶",
  "play_label": "Play {title}"
}'::jsonb
where ui_labels = '{}'::jsonb;

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

insert into public.website_pages (slug, title, seo_title, seo_description) values
  ('home', 'Home', 'MomentEra — Photography Studio', 'MomentEra Photography Studio'),
  ('portfolio', 'Portfolio', null, null),
  ('services', 'Services', null, null),
  ('about', 'About', null, null),
  ('contact', 'Contact', null, null)
on conflict (slug) do nothing;

-- Header navigation. Replaces the old placeholder links (/, /portfolio, ...) if
-- they are still exactly as first seeded; otherwise only fills an empty header.
delete from public.navigation_items
where location = 'header'
  and (select array_agg(label || ' ' || href order by position)
       from public.navigation_items where location = 'header')
      = array['Home /', 'Portfolio /portfolio', 'Services /services', 'About /about', 'Contact /contact'];

insert into public.navigation_items (location, label, href, position)
select 'header'::public.nav_location, v.label, v.href, v.position
from (values
  ('Home', '/#home', 1),
  ('About', '/#about', 2),
  ('Portfolio⌄', '/#portfolio', 3),
  ('Services', '/#services', 4),
  ('Packages', '/#films', 5),
  ('Contact', '/#contact', 6)
) as v(label, href, position)
where not exists (select 1 from public.navigation_items where location = 'header');

insert into public.navigation_items (location, label, href, position)
select 'footer'::public.nav_location, v.label, v.href, v.position
from (values
  ('Home', '/#home', 1),
  ('Portfolio', '/#portfolio', 2),
  ('Services', '/#services', 3),
  ('Contact', '/#contact', 4)
) as v(label, href, position)
where not exists (select 1 from public.navigation_items where location = 'footer');

-- Home page sections. Every label, image and link is in `settings`; any key
-- left out falls back to the default design. Inserted (and the home page
-- published) only when the home page has no sections yet.
-- The image_gallery / video_gallery `items` below are demo cards: as soon as
-- published photos/videos exist in the Media Library (media_items), the site
-- shows those instead, with one filter per category (categories table).
do $$
declare
  home_id uuid;
begin
  select id into home_id from public.website_pages where slug = 'home';
  if exists (select 1 from public.page_sections where page_id = home_id) then
    return;
  end if;

  insert into public.page_sections (page_id, section_type, title, position, settings)
  values
      (home_id, 'hero', 'Hero', 1, $json${
        "anchor_id": "home",
        "eyebrow": "Photography  •  Videography  •  Films",
        "heading": "Capturing\nLife’s Beautiful",
        "heading_highlight": "Moments ♡",
        "text": "Weddings, Events, Portraits, and more — beautifully captured, creatively told.",
        "background_image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=88",
        "mobile_background_image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
        "buttons": [
          {
            "label": "Explore Gallery →",
            "href": "#portfolio",
            "variant": "primary"
          },
          {
            "label": "▷  Book a Shoot",
            "href": "#contact",
            "variant": "ghost"
          }
        ],
        "social_links": [
          {
            "icon": "▧",
            "href": "#portfolio",
            "label": "Photos"
          },
          {
            "icon": "▣",
            "href": "#films",
            "label": "Films"
          },
          {
            "icon": "♫",
            "href": "#films",
            "label": "Audio"
          }
        ],
        "show_dots": true
      }$json$::jsonb),
      (home_id, 'feature_strip', 'Feature strip', 2, $json${
        "anchor_id": "",
        "items": [
          {
            "icon": "▧",
            "title": "Photography",
            "text": "Timeless moments"
          },
          {
            "icon": "▣",
            "title": "Videography",
            "text": "Cinematic stories"
          },
          {
            "icon": "♫",
            "title": "Audio Stories",
            "text": "Event highlights"
          },
          {
            "icon": "♧",
            "title": "Albums",
            "text": "Beautiful keepsakes"
          }
        ]
      }$json$::jsonb),
      (home_id, 'image_gallery', 'Our Work', 3, $json${
        "anchor_id": "portfolio",
        "heading": "Our Work",
        "all_label": "All",
        "filters": [
          {
            "label": "Wedding",
            "value": "wedding"
          },
          {
            "label": "Pre-Wedding",
            "value": "prewedding"
          },
          {
            "label": "Events",
            "value": "events"
          },
          {
            "label": "Birthdays",
            "value": "birthday"
          },
          {
            "label": "Portraits",
            "value": "portraits"
          },
          {
            "label": "Commercial",
            "value": "commercial"
          }
        ],
        "items": [
          {
            "title": "Wedding Stories",
            "subtitle": "120 Photos · 4 Videos",
            "category": "wedding",
            "glyph": "▧",
            "alt": "Wedding couple",
            "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=850&q=85"
          },
          {
            "title": "Pre-Wedding",
            "subtitle": "80 Photos · 2 Videos",
            "category": "prewedding",
            "glyph": "▣",
            "alt": "Couple outdoors",
            "image_url": "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=850&q=85"
          },
          {
            "title": "Events",
            "subtitle": "45 Photos · 3 Videos",
            "category": "events",
            "glyph": "▧",
            "alt": "Celebration",
            "image_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=850&q=85"
          },
          {
            "title": "Portraits",
            "subtitle": "60 Photos",
            "category": "portraits",
            "glyph": "▧",
            "alt": "Portrait",
            "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=850&q=85"
          },
          {
            "title": "Family & Birthdays",
            "subtitle": "75 Photos · 1 Video",
            "category": "birthday",
            "glyph": "▧",
            "alt": "Birthday",
            "image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=850&q=85"
          },
          {
            "title": "Commercial",
            "subtitle": "35 Photos · 2 Videos",
            "category": "commercial",
            "glyph": "▧",
            "alt": "Product photography",
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=850&q=85"
          }
        ]
      }$json$::jsonb),
      (home_id, 'video_gallery', 'Featured Films', 4, $json${
        "anchor_id": "films",
        "heading": "Featured Films",
        "subtitle": "Watch our cinematic wedding and event films",
        "placeholder_message": "Demo preview: add a YouTube, Vimeo or direct video URL to play this film.",
        "items": [
          {
            "title": "Rohan & Priya – Wedding Film",
            "duration": "04:32",
            "video_url": "",
            "alt": "Wedding film",
            "thumbnail_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85"
          },
          {
            "title": "Pre-Wedding – Goa",
            "duration": "03:18",
            "video_url": "",
            "alt": "Pre wedding",
            "thumbnail_url": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85"
          },
          {
            "title": "Aarohi’s 5th Birthday",
            "duration": "02:45",
            "video_url": "",
            "alt": "Birthday film",
            "thumbnail_url": "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=85"
          }
        ],
        "button": {
          "label": "View All Videos →",
          "href": "#portfolio",
          "variant": "ghost"
        }
      }$json$::jsonb),
      (home_id, 'about', 'About', 5, $json${
        "anchor_id": "about",
        "eyebrow": "A little about us",
        "heading": "Every Picture\nTells a Story",
        "text": "We are a passionate team of photographers and storytellers, specializing in weddings, events, portraits and more. Our goal is to turn your special moments into lasting memories.",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85",
        "image_alt": "Photography camera",
        "stats": [
          {
            "value": "500+",
            "label": "Projects"
          },
          {
            "value": "300+",
            "label": "Happy Clients"
          },
          {
            "value": "8+",
            "label": "Years Experience"
          }
        ],
        "button": {
          "label": "Know More →",
          "href": "#contact",
          "variant": "primary"
        }
      }$json$::jsonb),
      (home_id, 'services', 'Our Services', 6, $json${
        "anchor_id": "services",
        "heading": "Our Services",
        "subtitle": "From intimate portraits to grand celebrations, we capture it all.",
        "items": [
          {
            "icon": "♡",
            "title": "Wedding",
            "text": "Complete wedding coverage",
            "alt": "Wedding",
            "image_url": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=700&q=85"
          },
          {
            "icon": "♧",
            "title": "Pre-Wedding",
            "text": "Beautiful couple shoots",
            "alt": "Pre-wedding",
            "image_url": "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=700&q=85"
          },
          {
            "icon": "✧",
            "title": "Events",
            "text": "Birthdays, anniversaries and more",
            "alt": "Events",
            "image_url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=85"
          },
          {
            "icon": "♙",
            "title": "Portraits",
            "text": "Individual and family portraits",
            "alt": "Portraits",
            "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85"
          },
          {
            "icon": "◇",
            "title": "Commercial",
            "text": "Product and brand photography",
            "alt": "Commercial",
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85"
          },
          {
            "icon": "▷",
            "title": "Cinematic Films",
            "text": "Storytelling through films",
            "alt": "Films",
            "image_url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=700&q=85"
          }
        ]
      }$json$::jsonb),
      (home_id, 'cta', 'Call to action', 7, $json${
        "anchor_id": "contact",
        "eyebrow": "Let's make memories",
        "heading": "Let’s Capture\nYour Next Story",
        "text": "Book your shoot today and let us create memories that last forever.",
        "background_image_url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=85",
        "button": {
          "label": "Book a Shoot →",
          "href": "mailto:hello@momentera.example?subject=Photography%20Enquiry",
          "variant": "primary"
        }
      }$json$::jsonb)
  ;

  update public.website_pages set is_published = true where id = home_id;
end;
$$;
