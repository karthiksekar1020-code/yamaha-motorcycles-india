import type { MetadataRoute } from "next";
import { DEMO_MOTORCYCLES } from "@/lib/motorcycles/data";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/motorcycles", "/experience", "/compare", "/gallery", "/dealers", "/test-ride", "/about", "/contact", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...DEMO_MOTORCYCLES.map((m) => ({ url: `${base}/motorcycles/${m.slug}` })),
  ];
}
