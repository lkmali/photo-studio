import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Camera,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Palette,
  Search,
  Settings,
  Images,
} from "lucide-react";
import { getStaffSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// Admin pages depend on the signed-in user; never prerender or cache them.
export const dynamic = "force-dynamic";

// Modules are listed now; each becomes a link when its phase is built.
const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ready: true },
  { label: "Website Builder", href: "/admin/builder", icon: LayoutTemplate, ready: true },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon, ready: true },
  { label: "Albums", href: "/admin/albums", icon: Images, phase: 2 },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, ready: true },
  { label: "Pages", href: "/admin/pages", icon: FileText, phase: 3 },
  { label: "Appearance", href: "/admin/appearance", icon: Palette, phase: 6 },
  { label: "Navigation", href: "/admin/navigation", icon: Menu, ready: true },
  { label: "Enquiries", href: "/admin/enquiries", icon: Inbox, phase: 6 },
  { label: "SEO", href: "/admin/seo", icon: Search, phase: 6 },
  { label: "Settings", href: "/admin/settings", icon: Settings, ready: true },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/admin/login");
  const session = await getStaffSession();
  if (session.status === "signed_out") redirect("/admin/login");

  if (session.status === "no_role") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="max-w-sm space-y-4 rounded-xl bg-white p-8 text-sm shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-lg font-semibold text-neutral-900">No admin access</h1>
          <p className="text-neutral-600">
            You are signed in as {session.email}, but this account has not been given an admin or
            editor role.
          </p>
          <form action={signOut}>
            <button className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5 font-semibold">
          <Camera className="h-5 w-5" aria-hidden /> Studio Admin
        </div>
        <nav className="flex-1 space-y-0.5 px-3 text-sm">
          {NAV.map((item) => {
            const Icon = item.icon;
            if ("ready" in item) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-neutral-100"
                >
                  <Icon className="h-4 w-4" aria-hidden /> {item.label}
                </Link>
              );
            }
            return (
              <span
                key={item.href}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-neutral-400"
                title={`Coming in phase ${item.phase}`}
              >
                <Icon className="h-4 w-4" aria-hidden /> {item.label}
                <span className="ml-auto text-[10px] uppercase">P{item.phase}</span>
              </span>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-4 text-xs text-neutral-500">
          <p className="truncate">{session.email}</p>
          <p className="mb-3 capitalize">{session.profile.role}</p>
          <form action={signOut}>
            <button className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900">
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
