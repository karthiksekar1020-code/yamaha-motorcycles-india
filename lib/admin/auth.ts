import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { HttpError, forbidden, unauthenticated } from "./errors";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
}

/**
 * THE gate for every protected operation. Fails closed:
 *  - no valid session            -> 401 (the session JWT is verified with Supabase Auth, not just decoded)
 *  - signed in but not the owner -> 403 (membership comes from admin_users, which only the setup script can write)
 *  - owner has 2-step sign-in on but this session has not completed it -> 401 MFA_REQUIRED
 * Roles are never taken from the request body, URL, headers or cookies that the browser could edit.
 */
export async function requireAdmin(): Promise<AdminContext> {
  if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "The admin backend is not configured on this server.");
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw unauthenticated();

  const { data: row, error: roleError } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
  if (roleError) throw new HttpError(503, "ROLE_CHECK_FAILED", "Could not verify permissions. Please try again.");
  if (!row) throw forbidden();

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data && aal.data.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
    throw new HttpError(401, "MFA_REQUIRED", "Enter your authentication code to continue.");
  }
  return { supabase, user: data.user };
}

/** For server-rendered admin pages: send anyone who fails the gate to the right place. */
export async function requireAdminPage(): Promise<AdminContext> {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof HttpError) {
      if (e.code === "MFA_REQUIRED") redirect("/admin/mfa");
      if (e.status === 403) redirect("/admin/login?error=forbidden");
      if (e.status === 503) redirect("/admin/login");
      redirect("/admin/login");
    }
    throw e;
  }
}

/** True only for a signed-in owner (full check, same as requireAdmin). Never throws: any failure simply means "not the owner". */
export async function isAdminSession(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
