import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const revalidate = 60;
import type { NavigationItem, WebsiteSettings } from "@/types/database";

async function getSiteChrome() {
  const fallback = { siteName: "My Photography", nav: [] as NavigationItem[] };
  if (!hasSupabaseEnv()) return fallback;

  const supabase = createPublicClient();
  const [settings, nav] = await Promise.all([
    supabase.from("website_settings").select("site_name").maybeSingle<Pick<WebsiteSettings, "site_name">>(),
    supabase
      .from("navigation_items")
      .select("id, location, label, href, position, is_visible")
      .eq("location", "header")
      .eq("is_visible", true)
      .order("position")
      .returns<NavigationItem[]>(),
  ]);

  return {
    siteName: settings.data?.site_name ?? fallback.siteName,
    nav: nav.data ?? [],
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { siteName, nav } = await getSiteChrome();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {siteName}
          </Link>
          <nav className="flex flex-wrap gap-5 text-sm">
            {nav.map((item) => (
              <Link key={item.id} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {siteName}
      </footer>
    </div>
  );
}
