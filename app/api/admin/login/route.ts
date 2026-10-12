import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, SESSION_SECONDS, adminConfigured, checkCredentials, createSessionToken, sameOrigin, sessionCookieOptions } from "@/lib/admin/session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { apiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().min(1, "Enter your email").max(120), password: z.string().min(1, "Enter your password").max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "FORBIDDEN", "Request blocked.");
  const rl = rateLimit(`admin-login:${clientIp(req)}`, 8, 15 * 60_000);
  if (!rl.ok) return apiError(429, "RATE_LIMITED", "Too many attempts. Please try again later.", undefined, { "Retry-After": String(rl.retryAfterSec) });
  if (!adminConfigured()) return apiError(503, "ADMIN_NOT_CONFIGURED", "Admin sign-in is not set up on this server.");

  const raw = await req.text();
  if (raw.length > 2_000) return apiError(413, "PAYLOAD_TOO_LARGE", "Request is too large.");
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return apiError(400, "INVALID_JSON", "Request body must be valid JSON."); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
    return apiError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", fields);
  }

  // One generic message for any wrong credential, so the response never says which field was wrong.
  if (!checkCredentials(parsed.data.email, parsed.data.password)) return apiError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), { ...sessionCookieOptions, maxAge: SESSION_SECONDS });
  return res;
}
