import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDb } from "../db/supabase";
import { createAnonClient } from "../supabase/server";
import { DEMO_MOTORCYCLES } from "./data";
import { filterMotorcycles } from "./query";
import { attachImages } from "./images";
import { fromRow, type Row } from "./mapping";
import type { CatalogueQuery } from "../validation/catalogue";
import type { ModelImage, Motorcycle } from "../../types/motorcycle";

// The demo dataset never changes, so build it once per server process instead of on every request.
const DEMO_WITH_IMAGES = attachImages(DEMO_MOTORCYCLES);

/**
 * Public reads use the anonymous key, so the database itself hides drafts (Row Level Security). If only the older
 * service-role key is configured, drafts are still excluded by an explicit filter below.
 */
function publicClient(): SupabaseClient | null {
  return createAnonClient() ?? getDb();
}

interface GalleryRow { id: string; caption: string; alt_text: string; motorcycle_id: string | null; width: number; height: number }

/** Photos the admin uploaded and linked to a model replace the built-in official photos for that model. */
function uploadedImage(m: Motorcycle, photos: GalleryRow[]): ModelImage {
  return {
    thumb: `/media/${photos[0]!.id}`,
    photos: photos.map((p, i) => ({ src: `/media/${p.id}`, width: p.width, height: p.height, label: p.caption || `Photo ${i + 1}`, alt: p.alt_text || `${m.name}${p.caption ? `, ${p.caption}` : ""}` })),
    alt: `${m.name} motorcycle`,
    credit: "Photo supplied by the site owner",
    sourceUrl: "",
  };
}

// Catalogue rows change rarely: share one database read across requests for a minute (and clear it when the admin saves).
const fetchCatalogue = unstable_cache(async (): Promise<{ rows: Row[]; photos: GalleryRow[] }> => {
  const db = publicClient()!;
  const { data, error } = await db.from("motorcycles").select("*").eq("is_published", true).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (error) {
    console.error("[motorcycles] database read failed:", error.code);
    throw new Error("CATALOGUE_UNAVAILABLE");
  }
  const { data: photos } = await db.from("gallery_images").select("id, caption, alt_text, motorcycle_id, width, height").eq("is_published", true).not("motorcycle_id", "is", null).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  return { rows: data as Row[], photos: (photos ?? []) as GalleryRow[] };
}, ["catalogue"], { revalidate: 60, tags: ["catalogue"] });

/**
 * Reads published models from Supabase when configured, otherwise from the labelled demo dataset.
 * Wrapped in React's `cache` so a page and its generateMetadata (or several components) share one result per request.
 */
export const getAllMotorcycles = cache(async (): Promise<Motorcycle[]> => {
  if (!publicClient()) return DEMO_WITH_IMAGES;
  const { rows, photos } = await fetchCatalogue();
  const byModel = new Map<string, GalleryRow[]>();
  for (const p of photos) if (p.motorcycle_id) byModel.set(p.motorcycle_id, [...(byModel.get(p.motorcycle_id) ?? []), p]);
  return attachImages(rows.map(fromRow)).map((m) => {
    const own = m.id ? byModel.get(m.id) : undefined;
    return own?.length ? { ...m, image: uploadedImage(m, own) } : m;
  });
});

export async function listMotorcycles(q: CatalogueQuery) {
  return filterMotorcycles(await getAllMotorcycles(), q);
}

export async function getMotorcycle(slug: string): Promise<Motorcycle | null> {
  return (await getAllMotorcycles()).find((m) => m.slug === slug) ?? null;
}
