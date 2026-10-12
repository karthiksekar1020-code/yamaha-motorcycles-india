import { NextResponse } from "next/server";
import { audit, readJson } from "@/lib/admin/api";
import { HttpError, errorResponse, forbidden } from "@/lib/admin/errors";
import { mfaCodeSchema } from "@/lib/admin/schemas";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/security/origin";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Second step of sign-in for an owner who turned on an authenticator app. The password step already produced a
 * session at assurance level 1; this call upgrades it to level 2, which every admin page and API then requires.
 */
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
    if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "The admin backend is not configured on this server.");
    const supabase = await createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new HttpError(401, "UNAUTHENTICATED", "Sign in first.");
    const { data: row } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
    if (!row) throw forbidden();

    const rl = rateLimit(`admin-mfa:${data.user.id}`, 8, 15 * 60_000);
    if (!rl.ok) throw new HttpError(429, "RATE_LIMITED", "Too many attempts. Try again in a few minutes.");

    const { code } = await readJson(req, mfaCodeSchema, 1_000);
    const factors = await supabase.auth.mfa.listFactors();
    const totp = factors.data?.totp?.[0]; // only verified factors are listed here
    if (!totp) throw new HttpError(409, "NO_FACTOR", "Two-step sign-in is not set up for this account.");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
    if (error) throw new HttpError(401, "INVALID_CODE", "That code is not correct or has expired.");
    await audit({ supabase, user: data.user }, "auth.login", "admin", data.user.id, { mfa: true });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
