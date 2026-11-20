"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/FieldsForm";
import { requireStaff } from "@/lib/auth";
import defaults from "@/lib/site/defaults.json";
import { uiLabelsSchema } from "@/lib/site/schemas";
import { createClient } from "@/lib/supabase/server";

const d = defaults.site;
const str = z.string().trim();

const settingsForm = z.object({
  brand: z.object({
    site_name: str.min(1, "Site name is required."),
    brand_accent: str,
    tagline: str,
    logo_url: str.refine((v) => v === "" || v.startsWith("https://"), "Logo image must start with https://"),
  }),
  header: z.object({
    header_cta_label: str,
    header_cta_href: str.regex(/^(\/|#|https:\/\/|mailto:|tel:)/, "Header button link must start with /, #, https://, mailto: or tel:"),
    footer_copyright: str,
  }),
  seo: z.object({ seo_title: str, seo_description: str }),
  ui_labels: z.record(z.string(), z.unknown()),
});

export type SettingsFormValue = z.input<typeof settingsForm>;

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("json") ?? "{}"));
  } catch {
    return { ok: false, message: "Could not read the form." };
  }
  const parsed = settingsForm.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid values." };
  const { brand, header, seo, ui_labels } = parsed.data;

  const supabase = await createClient();
  const settings = await supabase.from("website_settings").upsert(
    {
      singleton: true,
      ...brand,
      logo_url: brand.logo_url || null,
      ...header,
      footer_copyright: header.footer_copyright || d.footer_copyright,
      // Invalid labels fall back to their defaults.
      ui_labels: uiLabelsSchema.parse(ui_labels),
    },
    { onConflict: "singleton" },
  );
  if (settings.error) return { ok: false, message: settings.error.message };

  const page = await supabase
    .from("website_pages")
    .update({ seo_title: seo.seo_title || null, seo_description: seo.seo_description || null })
    .eq("slug", "home");
  if (page.error) return { ok: false, message: page.error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The live site updates within a minute." };
}
