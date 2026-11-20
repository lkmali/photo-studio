"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/FieldsForm";
import { requireStaff } from "@/lib/auth";
import defaults from "@/lib/site/defaults.json";
import { SECTION_TYPES } from "@/lib/site/editor-fields";
import { isSectionType, sectionSchemas } from "@/lib/site/schemas";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

function done() {
  revalidatePath("/");
  revalidatePath("/admin/builder");
}

async function homePageId() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("website_pages").select("id").eq("slug", "home").single<{ id: string }>();
  if (error || !data) throw new Error("Home page not found. Run supabase/seed.sql first.");
  return data.id;
}

/** Saves one section's settings. The JSON is validated by the section's schema. */
export async function saveSection(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  if (!uuid.safeParse(id).success) return { ok: false, message: "Invalid section." };

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(String(formData.get("json") ?? "{}"));
  } catch {
    return { ok: false, message: "Could not read the form." };
  }

  const supabase = await createClient();
  const { data: row } = await supabase.from("page_sections").select("section_type").eq("id", id).single<{ section_type: string }>();
  if (!row || !isSectionType(row.section_type)) return { ok: false, message: "Unknown section type." };

  const { _title, ...settings } = input;
  // Invalid values (e.g. a javascript: link) fall back to the default design.
  const clean = sectionSchemas[row.section_type].parse(settings);
  const title = typeof _title === "string" && _title.trim() ? _title.trim() : SECTION_TYPES[row.section_type].label;

  const { error } = await supabase.from("page_sections").update({ settings: clean, title }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  done();
  return { ok: true, message: "Saved. The live site updates within a minute." };
}

/** Adds a section of the given type at the end, prefilled with the default design. */
export async function addSection(formData: FormData) {
  await requireStaff();
  const type = String(formData.get("section_type") ?? "");
  if (!isSectionType(type)) throw new Error("Unknown section type");

  const pageId = await homePageId();
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("page_sections")
    .select("position")
    .eq("page_id", pageId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const settings = defaults.home_sections.find((s) => s.section_type === type)?.settings ?? {};
  const { error } = await supabase.from("page_sections").insert({
    page_id: pageId,
    section_type: type,
    title: SECTION_TYPES[type].label,
    position: (last?.position ?? 0) + 1,
    settings,
  });
  if (error) throw new Error(error.message);
  done();
}

/** Fills an empty home page with the full default design. */
export async function addDefaultSections() {
  await requireStaff();
  const pageId = await homePageId();
  const supabase = await createClient();
  const { count } = await supabase.from("page_sections").select("*", { count: "exact", head: true }).eq("page_id", pageId);
  if (count) return;

  const { error } = await supabase.from("page_sections").insert(
    defaults.home_sections.map((s, i) => ({
      page_id: pageId,
      section_type: s.section_type,
      title: SECTION_TYPES[s.section_type]?.label ?? s.title,
      position: i + 1,
      settings: s.settings,
    })),
  );
  if (error) throw new Error(error.message);
  done();
}

/** Moves a section up (-1) or down (+1) and renumbers positions 1..n. */
export async function moveSection(id: string, direction: -1 | 1) {
  await requireStaff();
  const pageId = await homePageId();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("page_sections")
    .select("id")
    .eq("page_id", pageId)
    .order("position")
    .order("created_at")
    .returns<{ id: string }[]>();
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];

  const results = await Promise.all(
    ids.map((sid, pos) => supabase.from("page_sections").update({ position: pos + 1 }).eq("id", sid)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  done();
}

export async function setSectionVisible(id: string, visible: boolean) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("page_sections").update({ is_visible: visible }).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function deleteSection(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("page_sections").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

/** Publishing is admin-only; editors can change content but not take the page live or offline. */
export async function setHomePublished(published: boolean) {
  await requireStaff({ admin: true });
  const pageId = await homePageId();
  const supabase = await createClient();
  const { error } = await supabase.from("website_pages").update({ is_published: published }).eq("id", pageId);
  if (error) throw new Error(error.message);
  done();
}
