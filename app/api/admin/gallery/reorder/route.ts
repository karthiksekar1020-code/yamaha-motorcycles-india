import { adminRoute, audit, readJson, revalidatePublic } from "@/lib/admin/api";
import { HttpError } from "@/lib/admin/errors";
import { galleryReorderSchema } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";

/** Saves a new display order: the ids, first to last, get sort_order 10, 20, 30... */
export const POST = adminRoute(async (ctx) => {
  const { ids } = await readJson(ctx.req, galleryReorderSchema, 40_000);
  if (new Set(ids).size !== ids.length) throw new HttpError(422, "DUPLICATE_IDS", "Each photo can appear only once.");
  const results = await Promise.all(ids.map((id, i) => ctx.supabase.from("gallery_images").update({ sort_order: (i + 1) * 10 }).eq("id", id).select("id")));
  if (results.some((r) => r.error)) throw new HttpError(500, "SAVE_FAILED", "Could not save the new order.");
  if (results.some((r) => !r.data?.length)) throw new HttpError(404, "NOT_FOUND", "One of the photos no longer exists. Refresh and try again.");
  await audit(ctx, "gallery.reorder", "gallery_image", null, { count: ids.length });
  revalidatePublic("gallery");
  return { ok: true };
});
