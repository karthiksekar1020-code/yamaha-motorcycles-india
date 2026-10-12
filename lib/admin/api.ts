import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import type { ZodType, ZodTypeDef } from "zod";
import { sameOrigin } from "@/lib/security/origin";
import { requireAdmin, type AdminContext } from "./auth";
import { HttpError, errorResponse } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type AdminHandlerContext<P> = AdminContext & { req: Request; params: P };

/**
 * Wraps a route handler so it cannot run unless requireAdmin() passes (401/403 otherwise), and so that
 * state-changing requests must come from this site's own pages (CSRF defence on top of SameSite cookies).
 * Authentication is checked first: an anonymous caller always gets 401, whatever else is wrong with the request.
 */
export function adminRoute<P = Record<string, never>>(fn: (ctx: AdminHandlerContext<P>) => Promise<unknown>) {
  return async (req: Request, route: { params: Promise<P> }): Promise<Response> => {
    try {
      const ctx = await requireAdmin();
      if (!SAFE_METHODS.has(req.method) && !sameOrigin(req)) throw new HttpError(403, "FORBIDDEN", "Request blocked.");
      const out = await fn({ ...ctx, req, params: (await route?.params) as P });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Parses a small JSON body with a Zod schema; failures become 422 with per-field messages. */
export async function readJson<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>, maxBytes = 64_000): Promise<T> {
  const raw = await req.text();
  if (raw.length > maxBytes) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request is too large.");
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON."); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] ??= i.message;
    throw new HttpError(422, "VALIDATION_FAILED", "Please correct the highlighted fields.", fields);
  }
  return parsed.data;
}

const SECRETISH = /pass|token|secret|key|cookie|authorization/i;

/** Appends an entry to the audit log (as the signed-in admin; RLS requires actor_id to be the caller). */
export async function audit(ctx: Pick<AdminContext, "supabase" | "user">, action: string, entity: string | null = null, entityId: string | null = null, details: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (SECRETISH.test(k)) continue; // never record credentials or tokens
    safe[k] = typeof v === "string" ? v.slice(0, 200) : v;
  }
  const { error } = await ctx.supabase.from("audit_logs").insert({ actor_id: ctx.user.id, action, entity, entity_id: entityId, details: safe });
  if (error) console.error("[admin] audit write failed:", error.code);
}

/** Makes saved changes show up on the public site straight away. */
export function revalidatePublic(...tags: Array<"catalogue" | "gallery" | "content">) {
  for (const t of tags) revalidateTag(t);
  revalidatePath("/", "layout");
}
