import type { MetadataRoute } from "next";
import { DEMO_MOTORCYCLES } from "@/lib/motorcycles/data";

import { SITE_URL as base } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/motorcycles", "/experience", "/compare", "/gallery", "/dealers", "/test-ride", "/about", "/contact", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...DEMO_MOTORCYCLES.map((m) => ({ url: `${base}/motorcycles/${m.slug}` })),
  ];
}
