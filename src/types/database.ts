// Hand-written for Phase 1. Replace with generated types later:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type AppRole = "admin" | "editor";

export type Profile = {
  id: string;
  display_name: string | null;
  role: AppRole | null;
  created_at: string;
};

export type WebsiteSettings = {
  id: string;
  site_name: string;
  /** Trailing part of site_name shown in the accent color ("Era" in "MomentEra"). */
  brand_accent: string;
  tagline: string;
  logo_url: string | null;
  header_cta_label: string;
  header_cta_href: string;
  /** "{year}" is replaced with the current year. */
  footer_copyright: string;
  /** Small interface labels (menu, close, play, logo link). See uiLabelsSchema. */
  ui_labels: Record<string, unknown>;
  primary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  theme: "light" | "dark";
  updated_at: string;
};

export type NavigationItem = {
  id: string;
  location: "header" | "footer";
  label: string;
  href: string;
  position: number;
  is_visible: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
  created_at: string;
};

export type MediaType = "image" | "video" | "audio";

export type MediaItem = {
  id: string;
  title: string;
  media_type: MediaType;
  /** "youtube", "vimeo" or "link". */
  provider: string;
  /** The photo or video link (https). */
  original_url: string;
  embed_url: string | null;
  /** Card image. Photos fall back to original_url; YouTube films to the YouTube thumbnail. */
  thumbnail_url: string | null;
  alt_text: string;
  category_id: string | null;
  /** Line under a photo card title. */
  subtitle: string;
  /** Label on a film thumbnail, e.g. "04:32". */
  duration: string;
  position: number;
  is_published: boolean;
  validation_status: "valid" | "needs_permission" | "unsupported" | "pending";
  created_at: string;
  updated_at: string;
};

export type PageSection = {
  id: string;
  page_id: string;
  section_type: string;
  title: string;
  position: number;
  is_visible: boolean;
  settings: Record<string, unknown>;
  responsive_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
