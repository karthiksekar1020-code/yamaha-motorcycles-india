import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";

/**
 * Public delivery of gallery photos. The anonymous key is used, so the database (RLS on the table AND on storage)
 * only lets a file through while its gallery row is published. Unpublished, deleted and unknown ids all give 404.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const db = createAnonClient();
  if (!db) return new NextResponse(null, { status: 404 });

  const { data: row } = await db.from("gallery_images").select("storage_path").eq("id", id).eq("is_published", true).maybeSingle();
  if (!row) return new NextResponse(null, { status: 404 });
  const { data: file, error } = await db.storage.from("gallery").download(row.storage_path as string);
  if (error || !file) return new NextResponse(null, { status: 404 });

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      // Short cache so an unpublished photo disappears quickly; browsers revalidate cheaply afterwards.
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
