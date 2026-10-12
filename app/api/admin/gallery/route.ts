import { NextResponse } from "next/server";
import { adminRoute, audit, revalidatePublic } from "@/lib/admin/api";
import { HttpError } from "@/lib/admin/errors";
import { ImageError, MAX_UPLOAD_BYTES, imageErrorStatus, processUpload } from "@/lib/admin/images";
import { uuidSchema } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";

const MAX_FILES = 10;

export const GET = adminRoute(async ({ supabase }) => {
  const { data, error } = await supabase.from("gallery_images").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw new HttpError(500, "QUERY_FAILED", "Could not load the gallery.");
  return { items: data ?? [] };
});

interface FileResult { name: string; ok: boolean; id?: string; error?: string }

/**
 * Upload one or more photos (multipart form field "files"). Every file is checked on the server: real format from its
 * bytes, size, dimensions, decodability. It is then re-encoded to a clean WebP and saved under a generated name by
 * the signed-in admin's own session, so storage Row Level Security independently refuses anyone else.
 */
export const POST = adminRoute(async (ctx) => {
  const declared = Number(ctx.req.headers.get("content-length") ?? 0);
  if (declared > (MAX_FILES * MAX_UPLOAD_BYTES) + 1_000_000) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "The upload is too large.");

  let form: FormData;
  try { form = await ctx.req.formData(); } catch { throw new HttpError(400, "INVALID_FORM", "Send the photos as a multipart form."); }
  const files = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (files.length === 0) throw new HttpError(422, "NO_FILES", "Choose at least one photo.");
  if (files.length > MAX_FILES) throw new HttpError(422, "TOO_MANY_FILES", `Upload at most ${MAX_FILES} photos at a time.`);

  const motorcycleRaw = form.get("motorcycleId");
  const motorcycleId = typeof motorcycleRaw === "string" && motorcycleRaw ? uuidSchema.safeParse(motorcycleRaw).data ?? null : null;
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200);
  const altText = String(form.get("altText") ?? "").trim().slice(0, 300);

  const { data: last } = await ctx.supabase.from("gallery_images").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  let nextOrder = ((last?.sort_order as number | undefined) ?? 0) + 10;

  const results: FileResult[] = [];
  for (const file of files) {
    const name = file.name.slice(0, 120);
    try {
      if (file.size > MAX_UPLOAD_BYTES) throw new ImageError("TOO_LARGE", `The file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      const img = await processUpload(new Uint8Array(await file.arrayBuffer()));

      const up = await ctx.supabase.storage.from("gallery").upload(img.storagePath, img.data, { contentType: img.mimeType, cacheControl: "3600", upsert: false });
      if (up.error) throw new HttpError(500, "UPLOAD_FAILED", "The photo could not be stored.");

      const { data: row, error } = await ctx.supabase.from("gallery_images").insert({
        storage_path: img.storagePath, caption, alt_text: altText, motorcycle_id: motorcycleId, sort_order: nextOrder,
        is_published: false, width: img.width, height: img.height, mime_type: img.mimeType, size_bytes: img.size, created_by: ctx.user.id,
      }).select("id").single();
      if (error || !row) {
        await ctx.supabase.storage.from("gallery").remove([img.storagePath]); // do not leave an orphaned file behind
        throw new HttpError(500, "SAVE_FAILED", "The photo could not be saved.");
      }
      nextOrder += 10;
      await audit(ctx, "gallery.upload", "gallery_image", row.id as string, { name, size: img.size });
      results.push({ name, ok: true, id: row.id as string });
    } catch (e) {
      results.push({ name, ok: false, error: e instanceof ImageError || e instanceof HttpError ? e.message : "The photo could not be processed." });
      if (e instanceof ImageError) console.warn("[admin] upload rejected:", e.code, imageErrorStatus(e));
    }
  }
  revalidatePublic("gallery");
  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ results }, { status: okCount === 0 ? 422 : 201, headers: { "Cache-Control": "no-store" } });
});
