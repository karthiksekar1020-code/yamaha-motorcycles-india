import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminBackendConfigured, sessionCookieOptions, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Client that acts AS THE SIGNED-IN USER: it sends the visitor's session JWT, so Postgres Row Level Security
 * decides what is allowed. This is the only client the admin system uses for reads and writes.
 */
export async function createUserClient(): Promise<SupabaseClient> {
  if (!adminBackendConfigured()) throw new Error("BACKEND_NOT_CONFIGURED");
  const store = await cookies();
  return createServerClient(supabaseUrl()!, supabaseAnonKey()!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          // Always httpOnly and expiring: the browser never needs to read the session itself.
          for (const { name, value, options } of list) store.set(name, value, { ...options, ...sessionCookieOptions(), ...(options?.maxAge === 0 ? { maxAge: 0 } : {}) });
        } catch {
          // Called from a Server Component (cookies are read-only there); the middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client for public pages: no session, so it can only see what RLS shows to everyone (published content). */
export function createAnonClient(): SupabaseClient | null {
  if (!adminBackendConfigured()) return null;
  return createClient(supabaseUrl()!, supabaseAnonKey()!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
