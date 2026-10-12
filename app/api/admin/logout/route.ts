import { NextResponse } from "next/server";
import { ADMIN_COOKIE, sameOrigin, sessionCookieOptions } from "@/lib/admin/session";
import { apiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "FORBIDDEN", "Request blocked.");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
