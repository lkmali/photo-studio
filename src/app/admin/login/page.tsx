import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { getStaffSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signIn } from "../actions";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = hasSupabaseEnv();
  if (configured) {
    const session = await getStaffSession();
    if (session.status === "staff") redirect("/admin");
  }
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-sm ring-1 ring-neutral-200"
      >
        <div className="flex items-center gap-2 text-neutral-900">
          <Camera className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Admin sign in</h1>
        </div>

        {!configured && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code>.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            Incorrect email or password.
          </p>
        )}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-neutral-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-neutral-900"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-neutral-700">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={!configured}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
