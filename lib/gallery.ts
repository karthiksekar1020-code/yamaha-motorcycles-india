import { DEMO_MOTORCYCLES } from "./motorcycles/data";
import { attachImages } from "./motorcycles/images";

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  kind: "Colour" | "Model" | "Photo" | "Your photo";
  src: string;
  width: number;
  height: number;
  alt: string;
}

/** Every official image (two per model where available), built from the same data as the catalogue. */
export const GALLERY: GalleryItem[] = attachImages(DEMO_MOTORCYCLES).flatMap((m): GalleryItem[] => {
  const img = m.image;
  if (!img) return [];
  if (img.photos.length === 0) {
    return [{ id: `${m.slug}-thumb`, title: m.name, kind: "Model", src: img.thumb, width: 321, height: 313, alt: img.alt, caption: `${m.name}. ${img.credit}` }];
  }
  return img.photos.map((p, i) => ({
    id: `${m.slug}-${i + 1}`, title: `${m.name}, ${p.label}`, kind: "Colour" as const, src: p.src, width: p.width, height: p.height, alt: p.alt, caption: `${m.name}, ${p.label}. ${img.credit}`,
  }));
});
