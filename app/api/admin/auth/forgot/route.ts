import { NextResponse } from "next/server";
import { readJson } from "@/lib/admin/api";
import { HttpError, errorResponse } from "@/lib/admin/errors";
import { forgotSchema } from "@/lib/admin/schemas";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/security/origin";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const GENERIC = { ok: true, message: "If that email belongs to the site owner, a reset link is on its way. Open it in this same browser." };

/** Always answers the same way, so the form cannot be used to discover which emails have accounts. */
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
    if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "Password recovery is not set up on this server.");
    const ip = rateLimit(`admin-forgot:ip:${clientIp(req)}`, 5, 60 * 60_000);
    if (!ip.ok) throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    const { email } = await readJson(req, forgotSchema, 2_000);
    const acct = rateLimit(`admin-forgot:acct:${email}`, 3, 60 * 60_000);
    if (acct.ok) {
      const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
      const supabase = await createUserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/admin/auth/callback` });
      if (error) console.warn("[admin] reset email not sent:", error.status ?? "error"); // never revealed to the caller
    }
    return NextResponse.json(GENERIC, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
