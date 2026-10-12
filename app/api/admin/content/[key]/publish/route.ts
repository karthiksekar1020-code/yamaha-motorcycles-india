import { adminRoute, audit, revalidatePublic } from "@/lib/admin/api";
import { HttpError, notFound } from "@/lib/admin/errors";
import { CONTENT_KEYS, CONTENT_SCHEMAS, type ContentKey } from "@/lib/content/schema";

export const dynamic = "force-dynamic";

/** Copies the saved draft to the published row, after validating it again. The public site updates immediately. */
export const POST = adminRoute<{ key: string }>(async (ctx) => {
  if (!(CONTENT_KEYS as readonly string[]).includes(ctx.params.key)) throw notFound("Content block");
  const key = ctx.params.key as ContentKey;
  const { data: draft, error } = await ctx.supabase.from("site_content").select("value").eq("key", key).eq("status", "draft").maybeSingle();
  if (error) throw new HttpError(500, "QUERY_FAILED", "Could not load the draft.");
  if (!draft) throw new HttpError(409, "NO_DRAFT", "Save a draft first, then publish it.");

  const parsed = CONTENT_SCHEMAS[key].safeParse(draft.value);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_FAILED", "The draft is not valid. Fix it and save again.");

  const { error: pubError } = await ctx.supabase.from("site_content").upsert({ key, status: "published", value: parsed.data, updated_by: ctx.user.id }, { onConflict: "key,status" });
  if (pubError) throw new HttpError(500, "SAVE_FAILED", "Could not publish.");
  await audit(ctx, "content.publish", "content", key);
  revalidatePublic("content");
  return { ok: true };
});

/** Takes the block off the public site: the published row is removed and the built-in wording returns. */
export const DELETE = adminRoute<{ key: string }>(async (ctx) => {
  if (!(CONTENT_KEYS as readonly string[]).includes(ctx.params.key)) throw notFound("Content block");
  const { error } = await ctx.supabase.from("site_content").delete().eq("key", ctx.params.key).eq("status", "published");
  if (error) throw new HttpError(500, "DELETE_FAILED", "Could not unpublish.");
  await audit(ctx, "content.unpublish", "content", ctx.params.key);
  revalidatePublic("content");
  return { ok: true };
});
