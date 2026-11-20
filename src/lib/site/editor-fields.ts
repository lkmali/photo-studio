/**
 * Admin form definitions. Each section type lists the settings fields the
 * admin can edit; keys match the schemas in ./schemas.ts.
 */

export type Field =
  | {
      key: string;
      label: string;
      type: "text" | "textarea" | "icon" | "link" | "image";
      help?: string;
      /** Overrides the default link rule (used by navigation). */
      pattern?: string;
    }
  | { key: string; label: string; type: "boolean"; help?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "group"; fields: Field[]; help?: string }
  | { key: string; label: string; type: "list"; itemLabel: string; fields: Field[]; help?: string };

export const LINK_PATTERN = "(/|#|https://|mailto:|tel:).*";
export const NAV_LINK_PATTERN = "(/|https://).*";
export const IMAGE_PATTERN = "https://.*";

const anchor: Field = {
  key: "anchor_id",
  label: "Anchor ID",
  type: "text",
  help: "Used by menu links, e.g. \"about\" for /#about. Leave empty for none.",
};
const multiline = "Press Enter for a line break.";

const buttonFields: Field[] = [
    { key: "label", label: "Label", type: "text" },
    { key: "href", label: "Link", type: "link" },
    {
      key: "variant",
      label: "Style",
      type: "select",
      options: [
        { value: "primary", label: "Filled" },
        { value: "ghost", label: "Outline" },
      ],
    },
];

const button = (label: string): Field => ({
  key: "button",
  label,
  type: "group",
  help: "Leave the label empty to hide the button.",
  fields: buttonFields,
});

export const SECTION_TYPES: Record<string, { label: string; fields: Field[] }> = {
  hero: {
    label: "Hero banner",
    fields: [
      anchor,
      { key: "eyebrow", label: "Small text above heading", type: "text" },
      { key: "heading", label: "Heading", type: "textarea", help: multiline },
      { key: "heading_highlight", label: "Highlighted heading line", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "background_image_url", label: "Background image", type: "image" },
      { key: "mobile_background_image_url", label: "Mobile background image", type: "image" },
      {
        key: "buttons",
        label: "Buttons",
        type: "list",
        itemLabel: "button",
        fields: buttonFields,
      },
      {
        key: "social_links",
        label: "Side icons",
        type: "list",
        itemLabel: "icon",
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "href", label: "Link", type: "link" },
          { key: "label", label: "Screen-reader label", type: "text" },
        ],
      },
      { key: "show_dots", label: "Show slider dots", type: "boolean" },
    ],
  },
  feature_strip: {
    label: "Feature strip",
    fields: [
      anchor,
      {
        key: "items",
        label: "Features",
        type: "list",
        itemLabel: "feature",
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Text", type: "text" },
        ],
      },
    ],
  },
  image_gallery: {
    label: "Photo gallery",
    fields: [
      anchor,
      { key: "heading", label: "Heading", type: "text" },
      { key: "all_label", label: "\"All\" filter label", type: "text" },
      { key: "library_icon", label: "Corner icon on Media Library photos", type: "icon" },
      {
        key: "filters",
        label: "Filters",
        type: "list",
        itemLabel: "filter",
        help: "Demo filters. Once the Media Library has photos, the filters come from Categories instead. Remove every filter to hide the filter bar.",
        fields: [
          { key: "label", label: "Label", type: "text" },
          { key: "value", label: "Category key", type: "text", help: "Cards with this category show under the filter." },
        ],
      },
      {
        key: "items",
        label: "Cards",
        type: "list",
        itemLabel: "card",
        help: "Demo cards. Once you add photos in the Media Library, those are shown instead.",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "category", label: "Category key", type: "text" },
          { key: "glyph", label: "Corner icon", type: "icon" },
          { key: "image_url", label: "Image", type: "image" },
          { key: "alt", label: "Image description (alt)", type: "text" },
        ],
      },
    ],
  },
  video_gallery: {
    label: "Film gallery",
    fields: [
      anchor,
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      {
        key: "placeholder_message",
        label: "Message for films without a video link",
        type: "text",
      },
      {
        key: "items",
        label: "Films",
        type: "list",
        itemLabel: "film",
        help: "Demo films. Once you add videos in the Media Library, those are shown instead.",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "duration", label: "Duration", type: "text" },
          {
            key: "video_url",
            label: "Video link",
            type: "image",
            help: "YouTube, Vimeo or a direct .mp4/.webm link (https).",
          },
          { key: "thumbnail_url", label: "Thumbnail", type: "image" },
          { key: "alt", label: "Thumbnail description (alt)", type: "text" },
        ],
      },
      button("Button below films"),
    ],
  },
  about: {
    label: "About",
    fields: [
      anchor,
      { key: "eyebrow", label: "Small text above heading", type: "text" },
      { key: "heading", label: "Heading", type: "textarea", help: multiline },
      { key: "text", label: "Text", type: "textarea" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "image_alt", label: "Image description (alt)", type: "text" },
      {
        key: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "stat",
        fields: [
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
      button("Button"),
    ],
  },
  services: {
    label: "Services",
    fields: [
      anchor,
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      {
        key: "items",
        label: "Services",
        type: "list",
        itemLabel: "service",
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Text", type: "text" },
          { key: "image_url", label: "Image", type: "image" },
          { key: "alt", label: "Image description (alt)", type: "text" },
        ],
      },
    ],
  },
  cta: {
    label: "Call to action",
    fields: [
      anchor,
      { key: "eyebrow", label: "Small text above heading", type: "text" },
      { key: "heading", label: "Heading", type: "textarea", help: multiline },
      { key: "text", label: "Text", type: "textarea" },
      { key: "background_image_url", label: "Background image", type: "image" },
      button("Button"),
    ],
  },
};

export const SITE_SETTINGS_FIELDS: Field[] = [
  {
    key: "brand",
    label: "Brand",
    type: "group",
    fields: [
      { key: "site_name", label: "Site name", type: "text" },
      {
        key: "brand_accent",
        label: "Highlighted end of the name",
        type: "text",
        help: "Shown in pink, e.g. \"Era\" in MomentEra. Must match the end of the site name.",
      },
      { key: "tagline", label: "Tagline under the name", type: "text" },
      { key: "logo_url", label: "Logo image", type: "image", help: "Leave empty to show the camera icon." },
    ],
  },
  {
    key: "header",
    label: "Header and footer",
    type: "group",
    fields: [
      { key: "header_cta_label", label: "Header button label", type: "text", help: "Leave empty to hide it." },
      { key: "header_cta_href", label: "Header button link", type: "link" },
      {
        key: "footer_copyright",
        label: "Footer copyright",
        type: "text",
        help: "{year} is replaced with the current year.",
      },
    ],
  },
  {
    key: "seo",
    label: "Home page SEO",
    type: "group",
    fields: [
      { key: "seo_title", label: "Browser tab / search title", type: "text" },
      { key: "seo_description", label: "Search description", type: "textarea" },
    ],
  },
  {
    key: "ui_labels",
    label: "Interface labels",
    type: "group",
    fields: [
      { key: "brand_href", label: "Logo link", type: "link" },
      { key: "logo_alt", label: "Logo description (alt)", type: "text", help: "Empty uses the site name." },
      { key: "menu_icon", label: "Mobile menu icon", type: "icon" },
      { key: "menu_label", label: "Mobile menu screen-reader label", type: "text" },
      { key: "close_icon", label: "Close icon", type: "icon" },
      { key: "close_label", label: "Close screen-reader label", type: "text" },
      { key: "play_icon", label: "Play icon", type: "icon" },
      { key: "play_label", label: "Play screen-reader label", type: "text", help: "{title} is replaced with the film title." },
    ],
  },
];

const navItem: Field[] = [
  { key: "label", label: "Label", type: "text" },
  { key: "href", label: "Link", type: "link", pattern: NAV_LINK_PATTERN },
  { key: "is_visible", label: "Visible", type: "boolean" },
];

export const NAVIGATION_FIELDS: Field[] = [
  {
    key: "header",
    label: "Header menu",
    type: "list",
    itemLabel: "link",
    help: "Links start with / (e.g. /#about) or https://. An empty menu falls back to the default links.",
    fields: navItem,
  },
  { key: "footer", label: "Footer links", type: "list", itemLabel: "link", fields: navItem },
];
