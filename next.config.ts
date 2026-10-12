import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Files in /public are not fingerprinted, so give them a week plus a day of stale-while-revalidate instead of
// the default "revalidate on every request". Rename a file when replacing it to bypass the cache sooner.
const staticAssetCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  devIndicators: false, // hides the Next.js "N" badge shown in development
  images: {
    // Serve AVIF/WebP at the size the layout needs. Source files are already WebP, so cache the results for a month.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 640, 828, 1080, 1280, 1600],
    imageSizes: [96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: staticAssetCache },
      { source: "/videos/:path*", headers: staticAssetCache },
    ];
  },
};

export default nextConfig;
