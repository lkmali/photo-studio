"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/FieldsForm";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function done() {
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/media");
}

/** Creates (id = null) or updates a category. An empty slug is made from the name. */
export async function saveCategory(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  if (id !== null && !uuid.safeParse(id).success) return { ok: false, message: "Invalid category." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Enter a name." };
  if (name.length > 80) return { ok: false, message: "Name is too long." };
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  if (!SLUG.test(slug)) return { ok: false, message: "The key may use only letters, numbers and dashes." };
  const is_active = formData.get("is_active") === "on";

  const supabase = await createClient();
  let error;
  if (id === null) {
    const { data: last } = await supabase
      .from("categories")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle<{ position: number }>();
    ({ error } = await supabase.from("categories").insert({ name, slug, is_active, position: (last?.position ?? 0) + 1 }));
  } else {
    ({ error } = await supabase.from("categories").update({ name, slug, is_active }).eq("id", id));
  }
  if (error) {
    return { ok: false, message: error.code === "23505" ? `Another category already uses the key "${slug}".` : error.message };
  }
  done();
  return { ok: true, message: id === null ? `Added "${name}".` : "Saved." };
}

/** Deletes a category. Its photos and videos stay, with no category. */
export async function deleteCategory(id: string) {
  await requireStaff();
  if (!uuid.safeParse(id).success) throw new Error("Invalid category");
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

/** Moves a category one place up (-1) or down (1). Sets the filter button order. */
export async function moveCategory(id: string, direction: -1 | 1) {
  await requireStaff();
  if (!uuid.safeParse(id).success) throw new Error("Invalid category");
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, position")
    .order("position")
    .order("created_at")
    .returns<{ id: string; position: number }[]>();
  const list = data ?? [];
  const from = list.findIndex((r) => r.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
  for (const [i, row] of list.entries()) {
    if (row.position === i + 1) continue;
    const { error } = await supabase.from("categories").update({ position: i + 1 }).eq("id", row.id);
    if (error) throw new Error(error.message);
  }
  done();
}
