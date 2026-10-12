import type { ZodType, ZodTypeDef } from "zod";
import { adminRoute, audit, readJson } from "@/lib/admin/api";
import { HttpError, notFound } from "@/lib/admin/errors";
import { CONTENT_KEYS, CONTENT_SCHEMAS, type ContentKey, type ContentValue } from "@/lib/content/schema";

export const dynamic = "force-dynamic";
type P = { key: string };

const keyOf = (p: P): ContentKey => {
  if (!(CONTENT_KEYS as readonly string[]).includes(p.key)) throw notFound("Content block");
  return p.key as ContentKey;
};

export const GET = adminRoute<P>(async ({ supabase, params }) => {
  const key = keyOf(params);
  const { data, error } = await supabase.from("site_content").select("status, value, updated_at").eq("key", key);
  if (error) throw new HttpError(500, "QUERY_FAILED", "Could not load the content.");
  const find = (s: string) => data?.find((r) => r.status === s) ?? null;
  return { key, draft: find("draft"), published: find("published") };
});

/** Saves the draft copy. Nothing changes on the public site until it is published. */
export const PUT = adminRoute<P>(async (ctx) => {
  const key = keyOf(ctx.params);
  const value = await readJson<ContentValue>(ctx.req, CONTENT_SCHEMAS[key] as ZodType<ContentValue, ZodTypeDef, unknown>);
  const { error } = await ctx.supabase.from("site_content").upsert({ key, status: "draft", value, updated_by: ctx.user.id }, { onConflict: "key,status" });
  if (error) throw new HttpError(500, "SAVE_FAILED", "Could not save the draft.");
  await audit(ctx, "content.save_draft", "content", key);
  return { ok: true };
});

/** Throws the draft away; the published version (if any) is untouched. */
export const DELETE = adminRoute<P>(async (ctx) => {
  const key = keyOf(ctx.params);
  const { error } = await ctx.supabase.from("site_content").delete().eq("key", key).eq("status", "draft");
  if (error) throw new HttpError(500, "DELETE_FAILED", "Could not discard the draft.");
  await audit(ctx, "content.discard_draft", "content", key);
  return { ok: true };
});
