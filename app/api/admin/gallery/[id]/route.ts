import { adminRoute, audit, readJson, revalidatePublic } from "@/lib/admin/api";
import { HttpError, notFound } from "@/lib/admin/errors";
import { ImageError, MAX_UPLOAD_BYTES, imageErrorStatus, processUpload } from "@/lib/admin/images";
import { galleryPatchSchema, uuidSchema } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";
type P = { id: string };

const idOf = (p: P) => {
  const parsed = uuidSchema.safeParse(p.id);
  if (!parsed.success) throw notFound("Photo");
  return parsed.data;
};

/** Edit caption, alt text, linked model, order, or publish/unpublish. */
export const PATCH = adminRoute<P>(async (ctx) => {
  const id = idOf(ctx.params);
  const patch = await readJson(ctx.req, galleryPatchSchema, 4_000);
  const update: Record<string, unknown> = {};
  if (patch.caption !== undefined) update.caption = patch.caption;
  if (patch.altText !== undefined) update.alt_text = patch.altText;
  if (patch.isPublished !== undefined) update.is_published = patch.isPublished;
  if (patch.motorcycleId !== undefined) update.motorcycle_id = patch.motorcycleId;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  const { data, error } = await ctx.supabase.from("gallery_images").update(update).eq("id", id).select("id");
  if (error) throw new HttpError(error.code === "23503" ? 422 : 500, "SAVE_FAILED", error.code === "23503" ? "That motorcycle no longer exists." : "Could not save the photo.");
  if (!data?.length) throw notFound("Photo");
  await audit(ctx, patch.isPublished === undefined ? "gallery.update" : patch.isPublished ? "gallery.publish" : "gallery.unpublish", "gallery_image", id, Object.fromEntries(Object.keys(update).map((k) => [k, true])));
  revalidatePublic("gallery", "catalogue");
  return { ok: true };
});

/** Replace the picture itself (multipart field "file"). The id, caption, order and publish state are kept. */
export const PUT = adminRoute<P>(async (ctx) => {
  const id = idOf(ctx.params);
  let form: FormData;
  try { form = await ctx.req.formData(); } catch { throw new HttpError(400, "INVALID_FORM", "Send the photo as a multipart form."); }
  const file = form.get("file");
  if (!file || typeof file === "string") throw new HttpError(422, "NO_FILE", "Choose a photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "TOO_LARGE", `The file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);

  const { data: current } = await ctx.supabase.from("gallery_images").select("storage_path").eq("id", id).maybeSingle();
  if (!current) throw notFound("Photo");

  let img;
  try { img = await processUpload(new Uint8Array(await file.arrayBuffer())); } catch (e) {
    if (e instanceof ImageError) throw new HttpError(imageErrorStatus(e), "INVALID_IMAGE", e.message);
    throw e;
  }
  const up = await ctx.supabase.storage.from("gallery").upload(img.storagePath, img.data, { contentType: img.mimeType, cacheControl: "3600", upsert: false });
  if (up.error) throw new HttpError(500, "UPLOAD_FAILED", "The photo could not be stored.");

  const { data, error } = await ctx.supabase.from("gallery_images").update({ storage_path: img.storagePath, width: img.width, height: img.height, mime_type: img.mimeType, size_bytes: img.size }).eq("id", id).select("id");
  if (error || !data?.length) {
    await ctx.supabase.storage.from("gallery").remove([img.storagePath]);
    throw new HttpError(500, "SAVE_FAILED", "Could not save the replacement.");
  }
  await ctx.supabase.storage.from("gallery").remove([current.storage_path as string]); // the old file is no longer referenced
  await audit(ctx, "gallery.replace", "gallery_image", id, { size: img.size });
  revalidatePublic("gallery", "catalogue");
  return { ok: true };
});

export const DELETE = adminRoute<P>(async (ctx) => {
  const id = idOf(ctx.params);
  const { data: row } = await ctx.supabase.from("gallery_images").select("storage_path").eq("id", id).maybeSingle();
  if (!row) throw notFound("Photo");
  const { data, error } = await ctx.supabase.from("gallery_images").delete().eq("id", id).select("id");
  if (error) throw new HttpError(500, "DELETE_FAILED", "Could not delete the photo.");
  if (!data?.length) throw new HttpError(403, "FORBIDDEN", "You do not have permission to do this.");
  const removed = await ctx.supabase.storage.from("gallery").remove([row.storage_path as string]);
  if (removed.error) console.error("[admin] file removal failed after row delete:", removed.error.name);
  await audit(ctx, "gallery.delete", "gallery_image", id);
  revalidatePublic("gallery", "catalogue");
  return { ok: true };
});
