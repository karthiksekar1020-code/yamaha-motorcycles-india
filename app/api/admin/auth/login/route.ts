import { NextResponse } from "next/server";
import { audit, readJson } from "@/lib/admin/api";
import { HttpError, errorResponse } from "@/lib/admin/errors";
import { loginSchema } from "@/lib/admin/schemas";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/security/origin";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const WINDOW = 15 * 60_000;
const BAD = () => new HttpError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
const tooMany = (retryAfterSec: number) => new HttpError(429, "RATE_LIMITED", `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`);

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
    if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "Admin sign-in is not set up on this server.");

    // Brute-force protection: limit by address AND by account, so spreading attempts over many addresses still stops.
    const byIp = rateLimit(`admin-login:ip:${clientIp(req)}`, 10, WINDOW);
    if (!byIp.ok) throw tooMany(byIp.retryAfterSec);

    const { email, password } = await readJson(req, loginSchema, 2_000);
    const byAccount = rateLimit(`admin-login:acct:${email}`, 5, WINDOW);
    if (!byAccount.ok) throw tooMany(byAccount.retryAfterSec);

    const supabase = await createUserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // A network or server fault is not "wrong password": say the service is unavailable instead of blaming the user.
    if (error && (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500)) throw new HttpError(503, "AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable. Please try again shortly.");
    if (error || !data.user) throw BAD();

    // Valid password but not the owner: end the session and answer exactly like a wrong password.
    const { data: row, error: roleError } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
    if (roleError || !row) {
      await supabase.auth.signOut();
      console.warn("[admin] sign-in refused: account is not an administrator");
      throw BAD();
    }

    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaRequired = Boolean(aal.data && aal.data.nextLevel === "aal2" && aal.data.currentLevel !== "aal2");
    if (!mfaRequired) await audit({ supabase, user: data.user }, "auth.login", "admin", data.user.id);
    return NextResponse.json({ ok: true, mfaRequired }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
