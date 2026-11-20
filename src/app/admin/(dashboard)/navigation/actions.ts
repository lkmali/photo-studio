"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/FieldsForm";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const item = z.object({
  label: z.string().trim().min(1, "Every link needs a label."),
  // Matches the navigation_items.href check constraint.
  href: z
    .string()
    .trim()
    .regex(/^(\/|https:\/\/)/i, "Links must start with / (e.g. /#about) or https://"),
  is_visible: z.boolean(),
});
const navForm = z.object({ header: z.array(item), footer: z.array(item) });

export type NavFormValue = z.input<typeof navForm>;

/** Replaces the header and footer links with the submitted lists. */
export async function saveNavigation(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("json") ?? "{}"));
  } catch {
    return { ok: false, message: "Could not read the form." };
  }
  const parsed = navForm.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid links." };

  const rows = (["header", "footer"] as const).flatMap((location) =>
    parsed.data[location].map((l, i) => ({ location, ...l, position: i + 1 })),
  );

  const supabase = await createClient();
  // Insert the new rows first so a failed insert never leaves the menus empty.
  const { data: inserted, error: insertError } = await supabase.from("navigation_items").insert(rows).select("id");
  if (insertError) return { ok: false, message: insertError.message };

  const keep = (inserted ?? []).map((r) => r.id);
  const del = supabase.from("navigation_items").delete();
  const { error: deleteError } = await (keep.length
    ? del.not("id", "in", `(${keep.join(",")})`)
    : del.in("location", ["header", "footer"]));
  if (deleteError) return { ok: false, message: deleteError.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The live site updates within a minute." };
}
