import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [pages, livePages, media, albums, newEnquiries] = await Promise.all([
    supabase.from("website_pages").select("*", head),
    supabase.from("website_pages").select("*", head).eq("is_published", true),
    supabase.from("media_items").select("*", head),
    supabase.from("albums").select("*", head),
    supabase.from("enquiries").select("*", head).eq("status", "new"),
  ]);

  const stats = [
    { label: "Pages", value: pages.count ?? 0, hint: `${livePages.count ?? 0} published` },
    { label: "Media items", value: media.count ?? 0 },
    { label: "Albums", value: albums.count ?? 0 },
    { label: "New enquiries", value: newEnquiries.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Dashboard</h1>
        <Link href="/admin/builder" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">
          Edit website
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 ring-1 ring-neutral-200">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
            {"hint" in s && <p className="mt-1 text-xs text-neutral-500">{s.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
