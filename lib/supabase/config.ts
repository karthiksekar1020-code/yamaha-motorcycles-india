/**
 * Supabase settings. All three values are SERVER-ONLY environment variables (never NEXT_PUBLIC_):
 *   SUPABASE_URL                project URL
 *   SUPABASE_ANON_KEY           public "anon" key; every request made with it is limited by Row Level Security
 *   SUPABASE_SERVICE_ROLE_KEY   bypasses RLS; used only by command-line setup scripts and the test-ride/dealer
 *                               features that existed before the admin system. Never used for admin actions.
 */
export function supabaseUrl(): string | null {
  return process.env.SUPABASE_URL?.trim() || null;
}

export function supabaseAnonKey(): string | null {
  return process.env.SUPABASE_ANON_KEY?.trim() || null;
}

/** True when the admin system can work: it needs the URL and the anon key. */
export function adminBackendConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export const isProduction = () => process.env.NODE_ENV === "production";

/** Admin sessions stay signed in while active; the cookie expires after this much inactivity. */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/** Cookie attributes for the Supabase session cookies: not readable by scripts, HTTPS-only in production. */
export function sessionCookieOptions() {
  return { httpOnly: true, secure: isProduction(), sameSite: "lax" as const, path: "/", maxAge: SESSION_MAX_AGE_SECONDS };
}

export interface ConfigDiagnostics {
  /** Names of required variables that are empty or absent. */
  missing: string[];
  /** Plain-English problems with variables that are present. Never contains a value. */
  problems: string[];
}

/** What is wrong with the Supabase settings, safe to show on a page: names and hints only, never the values themselves. */
export function configDiagnostics(): ConfigDiagnostics {
  const missing: string[] = [];
  const problems: string[] = [];
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url) missing.push("SUPABASE_URL");
  else {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") problems.push("SUPABASE_URL should start with https://");
      if (u.pathname.replace(/\/$/, "") !== "") problems.push("SUPABASE_URL should be just the project address (like https://abcd1234.supabase.co), with nothing after it");
    } catch {
      problems.push("SUPABASE_URL is not a valid web address (copy the Project URL from Project Settings, API)");
    }
  }
  if (!anon) missing.push("SUPABASE_ANON_KEY");
  else if (anon.length < 20 || /\s/.test(anon)) problems.push("SUPABASE_ANON_KEY looks incomplete (copy the whole anon / publishable key)");
  if (anon && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() === anon) problems.push("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are identical: the anon key goes in SUPABASE_ANON_KEY, the service_role key in SUPABASE_SERVICE_ROLE_KEY");
  return { missing, problems };
}
