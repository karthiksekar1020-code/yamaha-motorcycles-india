/**
 * Brand mark shown beside the text logo in the header and the intro.
 * A fixed path, not a file-system lookup: on serverless hosts (Vercel) the public/ folder is served by the CDN and is
 * not on the function's disk, so an existsSync() check there finds nothing and the logo silently disappears.
 * Replace public/images/yamaha-logo.png to change the mark. Use only a logo file you have the right to use.
 */
export function getBrandLogo(): string | null {
  return "/images/yamaha-logo.png";
}
