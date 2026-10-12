import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Optional brand mark shown beside the text logo in the header.
 * Drop a file named yamaha-logo.svg (or .png / .webp) into public/images/ and it appears automatically;
 * with no file, the header shows the text logo only. Use only a logo file you have the right to use.
 */
export function getBrandLogo(): string | null {
  for (const ext of ["svg", "png", "webp"]) {
    if (existsSync(join(process.cwd(), "public", "images", `yamaha-logo.${ext}`))) return `/images/yamaha-logo.${ext}`;
  }
  return null;
}
