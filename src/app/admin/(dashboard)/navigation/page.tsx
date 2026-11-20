import { FieldsForm } from "@/components/admin/FieldsForm";
import defaults from "@/lib/site/defaults.json";
import { NAVIGATION_FIELDS } from "@/lib/site/editor-fields";
import { createClient } from "@/lib/supabase/server";
import type { NavigationItem } from "@/types/database";
import { saveNavigation, type NavFormValue } from "./actions";

export const metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("navigation_items")
    .select("id, location, label, href, position, is_visible")
    .order("position")
    .returns<NavigationItem[]>();
  const rows = data ?? [];

  // An empty menu shows the default links on the site, so start from those.
  const pick = (location: "header" | "footer", fallback: { label: string; href: string }[]) => {
    const saved = rows.filter((r) => r.location === location);
    return saved.length
      ? saved.map(({ label, href, is_visible }) => ({ label, href, is_visible }))
      : fallback.map((l) => ({ ...l, is_visible: true }));
  };

  const initial: NavFormValue = {
    header: pick("header", defaults.site.header_nav),
    footer: pick("footer", defaults.site.footer_nav),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Navigation</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Header menu and footer links. Use <code>/#anchor</code> to jump to a home page section (each section&apos;s
          anchor ID is set in the Website Builder).
        </p>
      </div>
      <div className="rounded-xl bg-white p-6 ring-1 ring-neutral-200">
        <FieldsForm fields={NAVIGATION_FIELDS} initial={initial} action={saveNavigation} />
      </div>
    </div>
  );
}
