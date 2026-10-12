import type { ModelImage, Motorcycle } from "../../types/motorcycle";

/**
 * Official product images from https://www.yamaha-motor-india.com (model pages), saved locally in /public/images/models.
 * The site owner states they have permission to use them. Keep that permission on record; if it is withdrawn,
 * delete public/images and this file.
 *
 * Each model has a small thumbnail (`<slug>.webp`) plus up to two larger photos (`<slug>-1.webp`, `<slug>-2.webp`).
 * The R2, R2M, Aerox-E and EC-06 pages sit on separate Yamaha sites that block automated access, so they have fewer images.
 */
const ORIGIN = "https://www.yamaha-motor-india.com";
const CREDIT = "Image © Yamaha Motor India Pvt. Ltd. (yamaha-motor-india.com)";

type Photo = [label: string, width: number, height: number];
const P = (label: string, w = 841, h = 561): Photo => [label, w, h];
const L = (label: string): Photo => [label, 1200, 800];

// slug -> [official model page, photos]
const MAP: Record<string, [string, Photo[]]> = {
  "r15-v4": ["/yamaha-r15v4.html", [L("Racing Blue"), L("Metallic Red")]],
  "r15m": ["/yamaha-r15m.html", [P("Metallic Grey"), P("Carbon")]],
  "r15s": ["/yamaha-r15s.html", [P("Matte Black"), P("Alternate colour")]],
  "yzf-r2": ["https://yamaha-r2.yamaha-motor-india.com/", [P("Racing Blue")]],
  "yzf-r2m": ["https://yamaha-r2.yamaha-motor-india.com/", [P("Metallic Grey")]],
  "mt-15-v2": ["/yamaha-mt-15-v2.html", [L("Ice Storm"), L("Silver Cyan")]],
  "xsr-155": ["/yamaha-xsr155.html", [P("Grey"), P("Blue")]],
  "fz-fi": ["/yamaha-fz-fi.html", [P("Cyan"), P("Matt Black")]],
  "fz-s-fi": ["/yamaha-fzs-fi-2025.html", [L("Metallic Black"), L("Vermillion")]],
  "fzs-fi-hybrid": ["/yamaha-fzs-fi-hybrid.html", [L("Ice Storm"), L("Racing Blue")]],
  "fzs-fi-v4-dlx": ["/yamaha-fzs-fi-v4.html", [P("Vermillion"), P("Racing Blue")]],
  "fzs-fi-v4": ["/yamaha-fzs-fi-v4-new.html", [P("Matte Blue"), P("Matte Black")]],
  "fz-rave": ["/yamaha-fz-rave.html", [P("Titan"), P("Black")]],
  "fz-flex": ["/yamaha-fz-flex.html", [P("Black"), P("Yamaha promotional image", 2000, 814)]],
  "fz-x": ["/yamaha-fzx.html", [P("Metallic Black"), P("Matte Blue", 841, 600)]],
  "fzx-hybrid": ["/yamaha-fzxhybrid.html", [P("Titanium"), P("Yamaha promotional image", 2000, 814)]],
  "aerox-155": ["/yamaha-aerox.html", [P("Metallic Black"), P("Yamaha promotional image", 1525, 728)]],
  "rayzr-125-fi-hybrid": ["/yamaha-ray-zr125fihybrid.html", [L("Metallic Black"), L("Vermillion")]],
  "rayzr-street-rally": ["/yamaha-ray-zrstreetrally125fihybrid.html", [L("Matte Black"), L("Vermillion")]],
  "fascino-125-fi-hybrid": ["/yamaha-newfascino125fi.html", [L("Matte Black"), L("Light Blue")]],
  "aerox-e": ["https://ev.yamaha-motor-india.com/aeroxe.html", []],
  "ec-06": ["https://ev.yamaha-motor-india.com/ec06.html", []],
};

export function imageFor(m: Pick<Motorcycle, "slug" | "name">): ModelImage | null {
  const e = MAP[m.slug];
  if (!e) return null;
  const [page, photos] = e;
  return {
    thumb: `/images/models/${m.slug}.webp`,
    photos: photos.map(([label, width, height], i) => ({ src: `/images/models/${m.slug}-${i + 1}.webp`, label, width, height, alt: `${m.name} in ${label}, official product image` })),
    alt: `${m.name} motorcycle, official product image`,
    credit: CREDIT,
    sourceUrl: page.startsWith("http") ? page : ORIGIN + page,
  };
}

export const attachImages = (list: Motorcycle[]): Motorcycle[] => list.map((m) => ({ ...m, image: imageFor(m) }));
