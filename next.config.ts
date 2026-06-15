import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Hide the Next.js dev indicator (the "N" badge in the bottom-left in dev).
  devIndicators: false,
  // Standalone for self-hosting/Docker; Netlify's runtime manages output itself,
  // so skip it there (NETLIFY=true during Netlify builds) to avoid conflicts.
  // Also skip in dev — Turbopack panics with standalone output mode.
  ...(process.env.NETLIFY || process.env.NODE_ENV === "development" ? {} : { output: "standalone" as const }),
  // Netlify: use static distDir for serverless functions
  ...(process.env.NETLIFY ? { distDir: ".next" } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.enuygun.com" },
      { protocol: "https", hostname: "cdn2.enuygun.com" },
      { protocol: "https", hostname: "cdn3.enuygun.com" },
    ],
    // Netlify deploys with unoptimized images by default
    unoptimized: !!process.env.NETLIFY,
  },
  async rewrites() {
    return [
      // Analytics & tracking aliases — next-intl / segment-like paths
      { source: "/api/gtm/init", destination: "/api/tracking/pageview" },
      { source: "/api/gtm/verify", destination: "/api/tracking/convert" },
      { source: "/api/v1/collect", destination: "/api/tracking/pageview" },
      { source: "/api/v1/event", destination: "/api/tracking/convert" },
      // CDN / asset aliases
      { source: "/api/cdn/report", destination: "/api/tracking/pageview" },
      { source: "/api/cdn/confirm", destination: "/api/tracking/convert" },
    ];
  },
};

// Cookie-based locale (no [locale] URL segment) — request config in src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
