import type { ReactNode } from "react";
import type { z } from "zod";
import type { MediaLibrary, SectionRow } from "@/lib/site/data";
import {
  aboutSchema,
  ctaSchema,
  featureStripSchema,
  heroSchema,
  imageGallerySchema,
  servicesSchema,
  videoGallerySchema,
  type ImageGallerySettings,
  type UiLabels,
  type VideoGallerySettings,
} from "@/lib/site/schemas";
import { AboutSection } from "./AboutSection";
import { CtaSection } from "./CtaSection";
import { FeatureStripSection } from "./FeatureStripSection";
import { HeroSection } from "./HeroSection";
import { ImageGallerySection } from "./ImageGallerySection";
import { ServicesSection } from "./ServicesSection";
import { VideoGallerySection } from "./VideoGallerySection";

type Entry<S extends z.ZodTypeAny> = {
  schema: S;
  // Sections that need shared labels (close, play) read `ui`; others ignore it.
  Component: (props: { settings: z.infer<S>; ui: UiLabels }) => ReactNode;
};
const entry = <S extends z.ZodTypeAny>(e: Entry<S>) => e;

/**
 * Maps each section_type to its schema and renderer. Unknown types are
 * skipped; they are never executed dynamically.
 */
export const sectionRegistry = {
  hero: entry({ schema: heroSchema, Component: HeroSection }),
  feature_strip: entry({ schema: featureStripSchema, Component: FeatureStripSection }),
  image_gallery: entry({ schema: imageGallerySchema, Component: ImageGallerySection }),
  video_gallery: entry({ schema: videoGallerySchema, Component: VideoGallerySection }),
  about: entry({ schema: aboutSchema, Component: AboutSection }),
  services: entry({ schema: servicesSchema, Component: ServicesSection }),
  cta: entry({ schema: ctaSchema, Component: CtaSection }),
} as const;

/**
 * Photos and films from the Media Library replace the cards written in the
 * section settings. With an empty library the settings cards still show.
 */
function withLibrary(type: string, settings: unknown, media: MediaLibrary | undefined) {
  if (!media) return settings;
  if (type === "image_gallery" && media.photos.length > 0) {
    const s = settings as ImageGallerySettings;
    return {
      ...s,
      filters: media.photoCategories,
      items: media.photos.map((p) => ({ ...p, glyph: s.library_icon })),
    } satisfies ImageGallerySettings;
  }
  if (type === "video_gallery" && media.films.length > 0) {
    return { ...(settings as VideoGallerySettings), items: media.films } satisfies VideoGallerySettings;
  }
  return settings;
}

export function RenderSection({ section, ui, media }: { section: SectionRow; ui: UiLabels; media?: MediaLibrary }) {
  if (!Object.hasOwn(sectionRegistry, section.section_type)) return null;
  const { schema, Component } = sectionRegistry[section.section_type as keyof typeof sectionRegistry] as Entry<z.ZodTypeAny>;
  const settings = withLibrary(section.section_type, schema.parse(section.settings ?? {}), media);
  return <Component settings={settings} ui={ui} />;
}
