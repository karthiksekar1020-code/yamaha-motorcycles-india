import type { MetadataRoute } from "next";
import { SITE_URL as base } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${base}/sitemap.xml` };
}
