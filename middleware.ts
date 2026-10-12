import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs on /admin pages and /api/admin routes only (the public site is untouched). It does two jobs:
 *  1. Refreshes the Supabase session cookies (Server Components cannot write cookies, so this is where it happens).
 *  2. Turns anonymous visitors away early: pages redirect to /admin/login, APIs answer 401.
 * This is a convenience layer, NOT the security boundary: every page and handler re-checks the session and role
 * itself (lib/admin/auth.ts), and the database enforces the same rules with Row Level Security.
 */
const PUBLIC_PAGES = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password", "/admin/auth/callback"]);
const PUBLIC_API = new Set(["/api/admin/auth/login", "/api/admin/auth/forgot"]);
const SESSION_SECONDS = 8 * 60 * 60;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPublic = isApi ? PUBLIC_API.has(pathname) : PUBLIC_PAGES.has(pathname);

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    if (isApi) return NextResponse.json({ error: { code: "BACKEND_NOT_CONFIGURED", message: "The admin backend is not configured on this server." } }, { status: 503 });
    return isPublic ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", req.url));
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) {
          res.cookies.set(name, value, {
            ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
            maxAge: options?.maxAge === 0 ? 0 : SESSION_SECONDS,
          });
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser(); // verifies the token with Supabase Auth and refreshes it if needed
  if (!data.user && !isPublic) {
    if (isApi) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const login = new URL("/admin/login", req.url);
    if (pathname !== "/admin") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  res.headers.set("Cache-Control", "no-store"); // admin responses must never be cached by browsers or proxies
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
