import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Content-Security-Policy. The browser only ever talks to this site (all Supabase calls are made by the server), so
// connect-src is 'self'; nothing can be framed, no plugins, no <base> hijacking, forms only post back here.
// script-src keeps 'unsafe-inline' because Next.js bootstrap scripts and two tiny inline scripts of ours (intro and
// reload handling) need it; moving to per-request nonces is the next hardening step. Production only: the dev server
// needs eval for hot reload.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
].join("; ");
if (process.env.NODE_ENV === "production") securityHeaders.push({ key: "Content-Security-Policy", value: csp });

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
