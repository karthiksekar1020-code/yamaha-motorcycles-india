import { NextResponse } from "next/server";
import { audit } from "@/lib/admin/api";
import { HttpError, errorResponse } from "@/lib/admin/errors";
import { adminBackendConfigured } from "@/lib/supabase/config";
import { createUserClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

/** Ends the session on the server: the refresh token is revoked everywhere ("global"), not just the cookie removed. */
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
    if (!adminBackendConfigured()) throw new HttpError(503, "BACKEND_NOT_CONFIGURED", "The admin backend is not configured on this server.");
    const supabase = await createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new HttpError(401, "UNAUTHENTICATED", "You are not signed in.");
    await audit({ supabase, user: data.user }, "auth.logout", "admin", data.user.id); // for a non-admin the insert is refused by RLS and only logged
    await supabase.auth.signOut({ scope: "global" });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
