import Image from "next/image";
import { BikeArt, variantFor } from "./BikeArt";
import { CATEGORY_ACCENT } from "@/lib/utils/accent";
import type { Motorcycle } from "@/types/motorcycle";

/**
 * Official product photo when available, otherwise the illustrative placeholder.
 * `size="auto"` prefers the larger photo; `"thumb"` always uses the small thumbnail.
 */
export function ModelPicture({ m, size = "auto", className = "", priority = false, sizes = "(min-width:1024px) 33vw, 100vw" }: {
  m: Motorcycle; size?: "thumb" | "auto"; className?: string; priority?: boolean; sizes?: string;
}) {
  const img = m.image;
  if (!img) return <BikeArt accent={CATEGORY_ACCENT[m.category]} variant={variantFor(m.category)} className={className} title={`${m.name} illustrative placeholder artwork`} />;
  const big = size === "auto" ? img.photos[0] : undefined;
  const [src, w, h] = big ? [big.src, big.width, big.height] : [img.thumb, 321, 313];
  return <Image src={src} alt={img.alt} width={w} height={h} sizes={sizes} priority={priority} className={`object-contain ${className}`} />;
}
