import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Bootstrap admin from ADMIN_EMAIL / ADMIN_PASSWORD (server-only env vars).
 * Lets the owner sign in for the first time without touching SQL.
 */

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function isBootstrapCredentials(email: string, password: string) {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envEmail || !envPassword || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  // Compare both so timing does not reveal which one matched.
  const emailOk = safeEqual(email.trim().toLowerCase(), envEmail);
  const passwordOk = safeEqual(password, envPassword);
  return emailOk && passwordOk;
}

/** Creates the bootstrap user in Supabase Auth if it does not exist yet. */
export async function createBootstrapUser(email: string, password: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { display_name: "Admin" },
  });
  // "already registered" is fine; anything else is a real failure.
  if (error && !/already/i.test(error.message)) throw error;
}

/** Grants the admin role to the bootstrap user's profile. */
export async function grantAdminRole(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert({ id: userId, role: "admin" }, { onConflict: "id" });
  if (error) throw error;
}
