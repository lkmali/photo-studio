import { z } from "zod";
import defaults from "./defaults.json";

/**
 * Settings schemas for each section type. Every field falls back to the
 * default design (defaults.json, taken from momentera_photography_website.html)
 * when it is missing or invalid, so a partial `settings` object in the
 * database only overrides the labels it sets.
 */

const SAFE_HREF = /^(\/|#|https:\/\/|mailto:|tel:)/i;
const SAFE_IMAGE = /^https:\/\//i;

const text = (fallback = "") => z.string().catch(fallback);
const href = (fallback = "#") =>
  z
    .string()
    .refine((v) => SAFE_HREF.test(v))
    .catch(fallback);
const imageUrl = (fallback = "") =>
  z
    .string()
    .refine((v) => v === "" || SAFE_IMAGE.test(v))
    .catch(fallback);
const list = <T extends z.ZodTypeAny>(item: T, fallback: z.infer<T>[]) =>
  z.array(item).catch(fallback);

export const buttonSchema = z.object({
  label: text(),
  href: href(),
  variant: z.enum(["primary", "ghost"]).catch("primary"),
});
export type ButtonSettings = z.infer<typeof buttonSchema>;

export const navLinkSchema = z.object({ label: text(), href: href() });
export type NavLink = z.infer<typeof navLinkSchema>;

/** Small interface labels shared by the whole site (website_settings.ui_labels). */
const ui = defaults.site.ui_labels;
export const uiLabelsSchema = z.object({
  brand_href: href(ui.brand_href),
  /** Empty means "use the site name". */
  logo_alt: text(ui.logo_alt),
  menu_icon: text(ui.menu_icon),
  menu_label: text(ui.menu_label),
  close_icon: text(ui.close_icon),
  close_label: text(ui.close_label),
  play_icon: text(ui.play_icon),
  /** "{title}" is replaced with the film title. */
  play_label: text(ui.play_label),
});
export type UiLabels = z.infer<typeof uiLabelsSchema>;

// JSON imports type `section_type` as plain string, so the per-type shape
// can't be narrowed; the schemas below are what enforce the shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sectionDefaults(type: string): any {
  const found = defaults.home_sections.find((s) => s.section_type === type);
  if (!found) throw new Error(`No defaults for section ${type}`);
  return found.settings;
}

const hero = sectionDefaults("hero");
export const heroSchema = z.object({
  anchor_id: text(hero.anchor_id),
  eyebrow: text(hero.eyebrow),
  heading: text(hero.heading),
  heading_highlight: text(hero.heading_highlight),
  text: text(hero.text),
  background_image_url: imageUrl(hero.background_image_url),
  mobile_background_image_url: imageUrl(hero.mobile_background_image_url),
  buttons: list(buttonSchema, hero.buttons as ButtonSettings[]),
  social_links: list(z.object({ icon: text(), href: href(), label: text() }), hero.social_links),
  show_dots: z.boolean().catch(hero.show_dots),
});

const strip = sectionDefaults("feature_strip");
export const featureStripSchema = z.object({
  anchor_id: text(strip.anchor_id),
  items: list(z.object({ icon: text(), title: text(), text: text() }), strip.items),
});

const gallery = sectionDefaults("image_gallery");
export const imageGallerySchema = z.object({
  anchor_id: text(gallery.anchor_id),
  heading: text(gallery.heading),
  all_label: text(gallery.all_label),
  /** Corner icon on photo cards that come from the Media Library. */
  library_icon: text("▧"),
  filters: list(z.object({ label: text(), value: text() }), gallery.filters),
  items: list(
    z.object({
      title: text(),
      subtitle: text(),
      category: text(),
      glyph: text(),
      alt: text(),
      image_url: imageUrl(),
      /** Larger image for the lightbox; empty means use image_url. */
      full_image_url: imageUrl(),
    }),
    gallery.items,
  ),
});

const films = sectionDefaults("video_gallery");
export const videoGallerySchema = z.object({
  anchor_id: text(films.anchor_id),
  heading: text(films.heading),
  subtitle: text(films.subtitle),
  placeholder_message: text(films.placeholder_message),
  items: list(
    z.object({
      title: text(),
      duration: text(),
      video_url: imageUrl(), // https only, same rule as images
      alt: text(),
      thumbnail_url: imageUrl(),
    }),
    films.items,
  ),
  button: buttonSchema.nullable().catch(films.button as ButtonSettings),
});

const about = sectionDefaults("about");
export const aboutSchema = z.object({
  anchor_id: text(about.anchor_id),
  eyebrow: text(about.eyebrow),
  heading: text(about.heading),
  text: text(about.text),
  image_url: imageUrl(about.image_url),
  image_alt: text(about.image_alt),
  stats: list(z.object({ value: text(), label: text() }), about.stats),
  button: buttonSchema.nullable().catch(about.button as ButtonSettings),
});

const services = sectionDefaults("services");
export const servicesSchema = z.object({
  anchor_id: text(services.anchor_id),
  heading: text(services.heading),
  subtitle: text(services.subtitle),
  items: list(
    z.object({ icon: text(), title: text(), text: text(), alt: text(), image_url: imageUrl() }),
    services.items,
  ),
});

const cta = sectionDefaults("cta");
export const ctaSchema = z.object({
  anchor_id: text(cta.anchor_id),
  eyebrow: text(cta.eyebrow),
  heading: text(cta.heading),
  text: text(cta.text),
  background_image_url: imageUrl(cta.background_image_url),
  button: buttonSchema.nullable().catch(cta.button as ButtonSettings),
});

export type HeroSettings = z.infer<typeof heroSchema>;
export type FeatureStripSettings = z.infer<typeof featureStripSchema>;
export type ImageGallerySettings = z.infer<typeof imageGallerySchema>;
export type VideoGallerySettings = z.infer<typeof videoGallerySchema>;
export type AboutSettings = z.infer<typeof aboutSchema>;
export type ServicesSettings = z.infer<typeof servicesSchema>;
export type CtaSettings = z.infer<typeof ctaSchema>;

/** Wraps an https URL for use inside a CSS custom property. */
export function cssUrl(url: string) {
  if (!SAFE_IMAGE.test(url)) return undefined;
  return `url("${url.replace(/["\\\n\r]/g, encodeURIComponent)}")`;
}

/** section_type → settings schema. Used by the renderer and by admin saves. */
export const sectionSchemas = {
  hero: heroSchema,
  feature_strip: featureStripSchema,
  image_gallery: imageGallerySchema,
  video_gallery: videoGallerySchema,
  about: aboutSchema,
  services: servicesSchema,
  cta: ctaSchema,
} as const;
export type SectionType = keyof typeof sectionSchemas;

export function isSectionType(t: string): t is SectionType {
  return Object.hasOwn(sectionSchemas, t);
}
