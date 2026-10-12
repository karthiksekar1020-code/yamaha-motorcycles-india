import "server-only";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/server";
import { GALLERY, type GalleryItem } from "./gallery";

interface Row { id: string; caption: string; alt_text: string; width: number; height: number; motorcycle_id: string | null; models: { name: string } | null }

const fetchUploads = unstable_cache(async (): Promise<GalleryItem[]> => {
  const db = createAnonClient();
  if (!db) return [];
  const { data, error } = await db.from("gallery_images").select("id, caption, alt_text, width, height, motorcycle_id, models:motorcycles(name)")
    .eq("is_published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as Row[]).map((r) => ({
    id: `upload-${r.id}`,
    title: r.caption || r.models?.name || "Photo",
    caption: r.caption || r.alt_text || "Photo from the Yamaha Motorcycles India gallery.",
    kind: "Photo" as const,
    src: `/media/${r.id}`,
    width: r.width,
    height: r.height,
    alt: r.alt_text || r.caption || r.models?.name || "Motorcycle photo",
  }));
}, ["gallery-uploads"], { revalidate: 60, tags: ["gallery"] });

/** Ids of built-in photos the owner removed. Public by design (it is only a list of photo ids); empty if the table is missing. */
const fetchHidden = unstable_cache(async (): Promise<string[]> => {
  const db = createAnonClient();
  if (!db) return [];
  const { data, error } = await db.from("gallery_hidden").select("item_id");
  if (error || !data) return [];
  return (data as { item_id: string }[]).map((r) => r.item_id);
}, ["gallery-hidden"], { revalidate: 60, tags: ["gallery"] });

/** The built-in official photos (minus any the owner removed) plus any photos the owner has published from the admin. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const hidden = new Set(await fetchHidden());
  return [...GALLERY.filter((g) => !hidden.has(g.id)), ...(await fetchUploads())];
}

/** Built-in photos the owner removed, for the dashboard's "Restore" list. */
export async function getHiddenBuiltins(): Promise<GalleryItem[]> {
  const hidden = new Set(await fetchHidden());
  return GALLERY.filter((g) => hidden.has(g.id));
}
