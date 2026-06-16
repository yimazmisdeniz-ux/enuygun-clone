/**
 * Canonical production origin used for absolute URLs (sitemap, robots, OG,
 * canonical tags). Override per-environment with NEXT_PUBLIC_SITE_URL — e.g.
 * a Netlify deploy-preview URL — falling back to the live domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookeratour.com"
).replace(/\/+$/, "");
