"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/FieldsForm";
import { requireStaff } from "@/lib/auth";
import { videoProvider } from "@/lib/site/media";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const https = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^https:\/\/\S+$/i, `${label} must be a full https:// link.`);

const mediaForm = z.object({
  media_type: z.enum(["image", "video"]),
  original_url: https("The link"),
  thumbnail_url: z.union([z.literal(""), https("The thumbnail")]),
  title: z.string().trim().max(200),
  category_id: z.union([z.literal(""), uuid]),
  subtitle: z.string().trim().max(200),
  duration: z.string().trim().max(20),
  alt_text: z.string().trim().max(300),
  is_published: z.boolean(),
});

function done() {
  revalidatePath("/");
  revalidatePath("/admin/media");
}

/** Creates (id = null) or updates a photo or film. */
export async function saveMedia(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  if (id !== null && !uuid.safeParse(id).success) return { ok: false, message: "Invalid item." };

  const parsed = mediaForm.safeParse({
    media_type: formData.get("media_type"),
    original_url: String(formData.get("original_url") ?? ""),
    thumbnail_url: String(formData.get("thumbnail_url") ?? ""),
    title: String(formData.get("title") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    duration: String(formData.get("duration") ?? ""),
    alt_text: String(formData.get("alt_text") ?? ""),
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid form." };
  const v = parsed.data;

  const row = {
    media_type: v.media_type,
    provider: v.media_type === "video" ? videoProvider(v.original_url) : "link",
    original_url: v.original_url,
    thumbnail_url: v.thumbnail_url || null,
    title: v.title,
    category_id: v.category_id || null,
    subtitle: v.media_type === "image" ? v.subtitle : "",
    duration: v.media_type === "video" ? v.duration : "",
    alt_text: v.alt_text,
    is_published: v.is_published,
    validation_status: "valid" as const,
  };

  const supabase = await createClient();
  if (id === null) {
    const { data: last } = await supabase
      .from("media_items")
      .select("position")
      .eq("media_type", v.media_type)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle<{ position: number }>();
    const { error } = await supabase.from("media_items").insert({ ...row, position: (last?.position ?? 0) + 1 });
    if (error) return { ok: false, message: error.message };
    done();
    return { ok: true, message: v.media_type === "image" ? "Photo added." : "Film added." };
  }

  const { error } = await supabase.from("media_items").update(row).eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true, message: "Saved. The live site updates within a minute." };
}

export async function deleteMedia(id: string) {
  await requireStaff();
  if (!uuid.safeParse(id).success) throw new Error("Invalid item");
  const supabase = await createClient();
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function setMediaPublished(id: string, published: boolean) {
  await requireStaff();
  if (!uuid.safeParse(id).success) throw new Error("Invalid item");
  const supabase = await createClient();
  const { error } = await supabase.from("media_items").update({ is_published: published }).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

/** Moves an item one place up (-1) or down (1) among items of the same type. */
export async function moveMedia(id: string, direction: -1 | 1) {
  await requireStaff();
  if (!uuid.safeParse(id).success) throw new Error("Invalid item");
  const supabase = await createClient();

  const { data: item } = await supabase.from("media_items").select("media_type").eq("id", id).single<{ media_type: string }>();
  if (!item) return;
  const { data: rows } = await supabase
    .from("media_items")
    .select("id, position")
    .eq("media_type", item.media_type)
    .order("position")
    .order("created_at")
    .returns<{ id: string; position: number }[]>();
  const list = rows ?? [];
  const from = list.findIndex((r) => r.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];

  // Renumber 1..n (so positions stay unique), writing only rows that change.
  for (const [i, row] of list.entries()) {
    if (row.position === i + 1) continue;
    const { error } = await supabase.from("media_items").update({ position: i + 1 }).eq("id", row.id);
    if (error) throw new Error(error.message);
  }
  done();
}
