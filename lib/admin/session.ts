import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-admin sign-in. Credentials live in server environment variables only (never NEXT_PUBLIC_):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET (32+ random characters, signs the session cookie).
 * The session is a stateless signed token ("<expiry>.<hmac>") in an httpOnly, SameSite=Strict cookie.
 */
export const ADMIN_COOKIE = "ymi_admin";
export const SESSION_SECONDS = 8 * 60 * 60;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32);
}

const digest = (s: string) => createHash("sha256").update(s).digest();
/** Constant-time string comparison (hashing first makes the buffers equal length). */
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/** Both fields are always compared, so timing does not reveal which one was wrong. */
export function checkCredentials(email: string, password: string): boolean {
  if (!adminConfigured()) return false;
  const okEmail = safeEqual(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const okPassword = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return okEmail && okPassword;
}

const mac = (payload: string) => createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("hex");

export function createSessionToken(now = Date.now()): string {
  const exp = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${exp}.${mac(exp)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) * 1000 <= now) return false;
  const expected = mac(exp);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Rejects cross-site POSTs: the Origin header must match this server's host. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
