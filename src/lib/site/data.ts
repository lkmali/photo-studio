import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Category, MediaItem, NavigationItem, PageSection, WebsiteSettings } from "@/types/database";
import defaults from "./defaults.json";
import { autoThumbnail } from "./media";
import { navLinkSchema, uiLabelsSchema, type NavLink, type UiLabels } from "./schemas";

const SAFE_HREF = /^(\/|#|https:\/\/|mailto:|tel:)/i;
const d = defaults.site;

export type SiteChrome = {
  siteName: string;
  brandAccent: string;
  tagline: string;
  logoUrl: string | null;
  headerNav: NavLink[];
  headerCta: NavLink | null;
  footerNav: NavLink[];
  footerCopyright: string;
  ui: UiLabels;
};

export type SectionRow = Pick<PageSection, "id" | "section_type" | "settings">;

export type HomePage = {
  seoTitle: string;
  seoDescription: string;
  sections: SectionRow[];
};

const nonEmpty = (v: string | null | undefined, fallback: string) =>
  typeof v === "string" && v.trim() !== "" ? v : fallback;

const defaultLinks = (links: typeof d.header_nav) => z.array(navLinkSchema).parse(links);

function toLinks(rows: NavigationItem[] | null, fallback: NavLink[]) {
  const links = (rows ?? [])
    .filter((r) => SAFE_HREF.test(r.href))
    .map((r) => ({ label: r.label, href: r.href }));
  return links.length > 0 ? links : fallback;
}

/** Header/footer content. Any missing value falls back to the default design. */
export const getSiteChrome = cache(async (): Promise<SiteChrome> => {
  const fallback: SiteChrome = {
    siteName: d.site_name,
    brandAccent: d.brand_accent,
    tagline: d.tagline,
    logoUrl: null,
    headerNav: defaultLinks(d.header_nav),
    headerCta: { label: d.header_cta_label, href: d.header_cta_href },
    footerNav: defaultLinks(d.footer_nav),
    footerCopyright: d.footer_copyright,
    ui: uiLabelsSchema.parse(d.ui_labels),
  };
  if (!hasSupabaseEnv()) return fallback;

  const supabase = createPublicClient();
  const [settings, nav] = await Promise.all([
    supabase.from("website_settings").select("*").maybeSingle<WebsiteSettings>(),
    supabase
      .from("navigation_items")
      .select("id, location, label, href, position, is_visible")
      .eq("is_visible", true)
      .order("position")
      .returns<NavigationItem[]>(),
  ]);

  const s = settings.data;
  const rows = nav.data ?? [];
  const ctaLabel = s?.header_cta_label ?? d.header_cta_label;
  const ctaHref = s && s.header_cta_href && SAFE_HREF.test(s.header_cta_href) ? s.header_cta_href : d.header_cta_href;

  return {
    siteName: nonEmpty(s?.site_name, fallback.siteName),
    // An empty accent is allowed: it means "no highlighted part".
    brandAccent: s?.brand_accent ?? fallback.brandAccent,
    tagline: s?.tagline ?? fallback.tagline,
    logoUrl: s?.logo_url ?? null,
    headerNav: toLinks(rows.filter((r) => r.location === "header"), fallback.headerNav),
    // Clearing the label in the admin hides the header button.
    headerCta: ctaLabel.trim() ? { label: ctaLabel, href: ctaHref } : null,
    footerNav: toLinks(rows.filter((r) => r.location === "footer"), fallback.footerNav),
    footerCopyright: nonEmpty(s?.footer_copyright, fallback.footerCopyright),
    // Each missing or invalid label falls back on its own.
    ui: uiLabelsSchema.parse(s?.ui_labels ?? {}),
  };
});

const defaultSections: SectionRow[] = defaults.home_sections.map((s, i) => ({
  id: `default-${i}`,
  section_type: s.section_type,
  settings: s.settings,
}));

/**
 * The home page's visible sections, in order. Falls back to the default design
 * when Supabase isn't configured, the page isn't published, or it has no sections.
 */
export const getHomePage = cache(async (): Promise<HomePage> => {
  const fallback = {
    seoTitle: d.seo_title,
    seoDescription: d.seo_description,
    sections: defaultSections,
  };
  if (!hasSupabaseEnv()) return fallback;

  const supabase = createPublicClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("id, title, seo_title, seo_description")
    .eq("slug", "home")
    .maybeSingle<{ id: string; title: string; seo_title: string | null; seo_description: string | null }>();
  if (!page) return fallback;

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, section_type, settings")
    .eq("page_id", page.id)
    .eq("is_visible", true)
    .order("position")
    .returns<SectionRow[]>();

  return {
    seoTitle: nonEmpty(page.seo_title, fallback.seoTitle),
    seoDescription: nonEmpty(page.seo_description, fallback.seoDescription),
    sections: sections && sections.length > 0 ? sections : fallback.sections,
  };
});

export type LibraryPhoto = {
  title: string;
  subtitle: string;
  category: string;
  alt: string;
  image_url: string;
  full_image_url: string;
};

export type LibraryFilm = {
  title: string;
  duration: string;
  video_url: string;
  alt: string;
  thumbnail_url: string;
};

export type MediaLibrary = {
  /** Active categories that have at least one published photo, in order. */
  photoCategories: { label: string; value: string }[];
  photos: LibraryPhoto[];
  films: LibraryFilm[];
};

const HTTPS = /^https:\/\//i;

/**
 * Published photos and films from the admin Media Library. Empty lists mean
 * the home page keeps the cards written in the section settings.
 */
export const getMediaLibrary = cache(async (): Promise<MediaLibrary> => {
  const empty: MediaLibrary = { photoCategories: [], photos: [], films: [] };
  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicClient();
  const [media, cats] = await Promise.all([
    supabase
      .from("media_items")
      .select("id, title, media_type, original_url, thumbnail_url, alt_text, category_id, subtitle, duration, position")
      .eq("is_published", true)
      .in("media_type", ["image", "video"])
      .order("position")
      .order("created_at")
      .returns<MediaItem[]>(),
    supabase
      .from("categories")
      .select("id, name, slug, position, is_active")
      .eq("is_active", true)
      .order("position")
      .returns<Category[]>(),
  ]);
  if (media.error || !media.data) return empty;

  const categories = cats.data ?? [];
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  const rows = media.data.filter((m) => HTTPS.test(m.original_url));

  const photos = rows
    .filter((m) => m.media_type === "image")
    .map((m) => ({
      title: m.title,
      subtitle: m.subtitle ?? "",
      // Photos in a hidden or deleted category show only under "All".
      category: (m.category_id && slugById.get(m.category_id)) || "",
      alt: m.alt_text || m.title,
      image_url: m.thumbnail_url && HTTPS.test(m.thumbnail_url) ? m.thumbnail_url : m.original_url,
      full_image_url: m.original_url,
    }));

  const films = rows
    .filter((m) => m.media_type === "video")
    .map((m) => ({
      title: m.title,
      duration: m.duration ?? "",
      video_url: m.original_url,
      alt: m.alt_text || m.title,
      thumbnail_url:
        (m.thumbnail_url && HTTPS.test(m.thumbnail_url) ? m.thumbnail_url : autoThumbnail(m.original_url)) ?? "",
    }));

  const used = new Set(photos.map((p) => p.category));
  const photoCategories = categories.filter((c) => used.has(c.slug)).map((c) => ({ label: c.name, value: c.slug }));

  return { photoCategories, photos, films };
});
