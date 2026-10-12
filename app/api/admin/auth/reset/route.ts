import { NextResponse } from "next/server";
import { audit, readJson } from "@/lib/admin/api";
import { HttpError, errorResponse, forbidden } from "@/lib/admin/errors";
import { resetSchema } from "@/lib/admin/schemas";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/security/origin";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Sets a new password. Needs the short-lived recovery session created by the emailed link (or a normal admin session). */
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
    if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "Password recovery is not set up on this server.");
    const rl = rateLimit(`admin-reset:${clientIp(req)}`, 10, 60 * 60_000);
    if (!rl.ok) throw new HttpError(429, "RATE_LIMITED", "Too many attempts. Please try again later.");

    const supabase = await createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new HttpError(401, "UNAUTHENTICATED", "This reset link has expired. Request a new one.");
    const { data: row } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
    if (!row) throw forbidden();

    const { password } = await readJson(req, resetSchema, 2_000);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new HttpError(422, "PASSWORD_REJECTED", "That password was not accepted. Choose a different one.");
    await audit({ supabase, user: data.user }, "auth.password_changed", "admin", data.user.id);
    await supabase.auth.signOut({ scope: "others" }); // every other signed-in device must sign in again
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
