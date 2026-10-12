import type { Dict } from "./langs";

/** Page titles reuse the nav labels so they can never drift apart. */
export function withTitles(d: Dict): Dict {
  return {
    ...d,
    "page.motorcycles.title": d["nav.motorcycles"]!,
    "page.studio.title": d["nav.studio"]!,
    "page.compare.title": d["nav.compare"]!,
    "page.gallery.title": d["nav.gallery"]!,
    "page.dealers.title": d["nav.dealers"]!,
    "page.testride.title": d["nav.testRide"]!,
  };
}
