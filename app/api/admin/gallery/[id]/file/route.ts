import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { notFound } from "@/lib/admin/errors";
import { uuidSchema } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";

/** Admin-only preview of a photo, including ones that are still unpublished (the public /media route cannot show those). */
export const GET = adminRoute<{ id: string }>(async ({ supabase, params }) => {
  const id = uuidSchema.safeParse(params.id);
  if (!id.success) throw notFound("Photo");
  const { data: row } = await supabase.from("gallery_images").select("storage_path").eq("id", id.data).maybeSingle();
  if (!row) throw notFound("Photo");
  const { data: file, error } = await supabase.storage.from("gallery").download(row.storage_path as string);
  if (error || !file) throw notFound("Photo");
  return new NextResponse(await file.arrayBuffer(), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
});
