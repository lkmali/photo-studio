import { FieldsForm } from "@/components/admin/FieldsForm";
import defaults from "@/lib/site/defaults.json";
import { SITE_SETTINGS_FIELDS } from "@/lib/site/editor-fields";
import { uiLabelsSchema } from "@/lib/site/schemas";
import { createClient } from "@/lib/supabase/server";
import type { WebsiteSettings } from "@/types/database";
import { saveSettings, type SettingsFormValue } from "./actions";

export const metadata = { title: "Settings" };

const d = defaults.site;

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: s }, { data: home }] = await Promise.all([
    supabase.from("website_settings").select("*").maybeSingle<WebsiteSettings>(),
    supabase
      .from("website_pages")
      .select("seo_title, seo_description")
      .eq("slug", "home")
      .maybeSingle<{ seo_title: string | null; seo_description: string | null }>(),
  ]);

  // Show what the site currently displays: saved values, else the defaults.
  const initial: SettingsFormValue = {
    brand: {
      site_name: s?.site_name ?? d.site_name,
      brand_accent: s?.brand_accent ?? d.brand_accent,
      tagline: s?.tagline ?? d.tagline,
      logo_url: s?.logo_url ?? "",
    },
    header: {
      header_cta_label: s?.header_cta_label ?? d.header_cta_label,
      header_cta_href: s?.header_cta_href ?? d.header_cta_href,
      footer_copyright: s?.footer_copyright ?? d.footer_copyright,
    },
    seo: {
      seo_title: home?.seo_title ?? d.seo_title,
      seo_description: home?.seo_description ?? d.seo_description,
    },
    ui_labels: uiLabelsSchema.parse(s?.ui_labels ?? {}),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">Site name, header, footer, SEO and small interface labels.</p>
      </div>
      {s && !("ui_labels" in s) && (
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Some settings columns are missing. Run the latest migrations in <code>supabase/migrations</code> before saving.
        </p>
      )}
      <div className="rounded-xl bg-white p-6 ring-1 ring-neutral-200">
        <FieldsForm fields={SITE_SETTINGS_FIELDS} initial={initial} action={saveSettings} />
      </div>
    </div>
  );
}
