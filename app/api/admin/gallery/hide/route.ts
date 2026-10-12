import { z } from "zod";
import { adminRoute, audit, readJson, revalidatePublic } from "@/lib/admin/api";
import { HttpError, notFound } from "@/lib/admin/errors";
import { GALLERY } from "@/lib/gallery";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ itemId: z.string().min(1).max(80) }).strict();
const BUILTIN_IDS = new Set(GALLERY.map((g) => g.id));

/** Only ids that really are built-in gallery photos are accepted; anything else is "not found", never stored. */
async function itemIdOf(req: Request): Promise<string> {
  const { itemId } = await readJson(req, bodySchema, 1_000);
  if (!BUILTIN_IDS.has(itemId)) throw notFound("Photo");
  return itemId;
}

/** Removes a built-in photo from the public gallery (reversible: see DELETE). */
export const POST = adminRoute(async (ctx) => {
  const itemId = await itemIdOf(ctx.req);
  const { error } = await ctx.supabase.from("gallery_hidden").upsert({ item_id: itemId, hidden_by: ctx.user.id }, { onConflict: "item_id", ignoreDuplicates: true });
  if (error) {
    // 42P01 / PGRST205: the 0003 migration has not been applied to this database yet.
    if (error.code === "42P01" || error.code === "PGRST205") throw new HttpError(503, "MIGRATION_PENDING", "Run supabase/migrations/0003_gallery_hidden.sql in your Supabase SQL editor first, then try again.");
    throw new HttpError(500, "SAVE_FAILED", "Could not remove the photo.");
  }
  await audit(ctx, "gallery.hide_builtin", "gallery_item", itemId);
  revalidatePublic("gallery");
  return { ok: true };
});

/** Puts a removed built-in photo back. */
export const DELETE = adminRoute(async (ctx) => {
  const itemId = await itemIdOf(ctx.req);
  const { error } = await ctx.supabase.from("gallery_hidden").delete().eq("item_id", itemId);
  if (error) throw new HttpError(500, "SAVE_FAILED", "Could not restore the photo.");
  await audit(ctx, "gallery.restore_builtin", "gallery_item", itemId);
  revalidatePublic("gallery");
  return { ok: true };
});
