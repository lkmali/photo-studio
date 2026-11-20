// Plain (non-client) module so server pages can build initial form values.

export type MediaFormValue = {
  media_type: "image" | "video";
  original_url: string;
  thumbnail_url: string;
  title: string;
  category_id: string;
  subtitle: string;
  duration: string;
  alt_text: string;
  is_published: boolean;
};

export const emptyMedia = (type: "image" | "video" = "image"): MediaFormValue => ({
  media_type: type,
  original_url: "",
  thumbnail_url: "",
  title: "",
  category_id: "",
  subtitle: "",
  duration: "",
  alt_text: "",
  is_published: true,
});
