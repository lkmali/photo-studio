"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createBootstrapUser, grantAdminRole, isBootstrapCredentials } from "@/lib/bootstrap-admin";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/login?error=invalid");

  const { email, password } = parsed.data;
  const isBootstrap = isBootstrapCredentials(email, password);
  const supabase = await createClient();

  let result = await supabase.auth.signInWithPassword({ email, password });

  // First sign-in with ADMIN_EMAIL / ADMIN_PASSWORD: create the user, then retry.
  if (result.error && isBootstrap) {
    try {
      await createBootstrapUser(email, password);
    } catch (e) {
      console.error("Bootstrap admin creation failed", e);
      redirect("/admin/login?error=invalid");
    }
    result = await supabase.auth.signInWithPassword({ email, password });
  }

  // Same message for every failure so the form does not reveal which emails exist.
  if (result.error || !result.data.user) redirect("/admin/login?error=invalid");

  if (isBootstrap) {
    try {
      await grantAdminRole(result.data.user.id);
    } catch (e) {
      console.error("Granting bootstrap admin role failed", e);
    }
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
