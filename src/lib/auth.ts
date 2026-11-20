import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { grantAdminRole, isConfiguredAdmin } from "@/lib/bootstrap-admin";

export type StaffSession =
  | { status: "signed_out" }
  | { status: "no_role"; email: string | undefined }
  | { status: "staff"; email: string | undefined; profile: Profile & { role: NonNullable<Profile["role"]> } };

/** Verifies the session on the server (never trust a client-only flag). */
export async function getStaffSession(): Promise<StaffSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.role) {
    // App-level role: the account in ADMIN_EMAIL is always admin. Sync it to
    // the database so RLS policies (which read profiles.role) allow its writes.
    if (isConfiguredAdmin(user.email)) {
      try {
        await grantAdminRole(user.id);
        return {
          status: "staff",
          email: user.email,
          profile: {
            id: user.id,
            display_name: profile?.display_name ?? user.email ?? null,
            created_at: profile?.created_at ?? new Date().toISOString(),
            role: "admin",
          },
        };
      } catch (e) {
        console.error("Auto-granting admin role from ADMIN_EMAIL failed", e);
      }
    }
    return { status: "no_role", email: user.email };
  }
  return { status: "staff", email: user.email, profile: { ...profile, role: profile.role } };
}

/** For server actions: throws unless the caller is staff (or admin). */
export async function requireStaff(opts: { admin?: boolean } = {}) {
  const session = await getStaffSession();
  if (session.status === "signed_out") redirect("/admin/login");
  if (session.status !== "staff") throw new Error("Not authorized");
  if (opts.admin && session.profile.role !== "admin") throw new Error("Admin role required");
  return session;
}
