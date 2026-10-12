/** Browser-side helper for calling the admin API. Cookies are sent automatically; the server checks every call itself. */
export interface ApiFailure { code: string; message: string; fields?: Record<string, string> }
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiFailure };

export async function api<T = unknown>(url: string, init: { method?: string; json?: unknown; form?: FormData } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? (init.json !== undefined || init.form ? "POST" : "GET"),
      headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, status: res.status, data: data as T };
    // A multi-file upload that partly failed still carries per-file results.
    if (data?.results) return { ok: false, status: res.status, error: { code: "UPLOAD_FAILED", message: "No photo could be added.", fields: undefined }, ...(data as object) } as ApiResult<T>;
    return { ok: false, status: res.status, error: data?.error ?? { code: "ERROR", message: "Something went wrong. Please try again." } };
  } catch {
    return { ok: false, status: 0, error: { code: "NETWORK", message: "Couldn't reach the server. Check your connection and try again." } };
  }
}

/** After sign-in, only ever return to a page inside the admin area (never to another site). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !/^\/admin\/[A-Za-z0-9/_-]*$/.test(next) || next.startsWith("/admin/login") || next.includes("//")) return "/admin/dashboard";
  return next;
}
