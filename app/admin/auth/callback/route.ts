import { NextResponse } from "next/server";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Landing point of the password-recovery email link. It trades the one-time code for a session, then always sends
 * the browser to the fixed reset page: there is no "next" parameter, so it cannot be abused as an open redirect.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!adminBackendConfigured() || !code || code.length > 512) return NextResponse.redirect(new URL("/admin/login?error=link", url));
  const supabase = await createUserClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?error=link", url));
  return NextResponse.redirect(new URL("/admin/reset-password", url));
}
