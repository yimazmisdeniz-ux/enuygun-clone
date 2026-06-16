import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Hotel destination landing pages served by /otel/[location].
 * Clean city/region slugs only — funnel pages (ödeme/rezervasyon/sürücü) and
 * per-hotel detail pages are intentionally excluded from the sitemap.
 */
const HOTEL_LOCATIONS = [
  "turkiye",
  "istanbul",
  "ankara",
  "izmir",
  "antalya",
  "mugla",
  "bursa",
  "samsun",
  "balikesir",
  "bodrum",
  "marmaris",
  "cesme",
  "alanya",
  "alacati",
  "fethiye",
  "lara",
  "ayvalik",
  "sapanca",
  "oludeniz",
  "sile",
  "kemer",
  "kusadasi",
  "muratpasa",
  "kibris",
  "batum",
  "dubai",
  "paris",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/otel`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/arac-kiralama`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/kullanim-sartlari`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/gizlilik-politikasi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cerez-politikasi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/guvenlik`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const locationRoutes: MetadataRoute.Sitemap = HOTEL_LOCATIONS.map((slug) => ({
    url: `${SITE_URL}/otel/${slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...locationRoutes].map((entry) => ({
    lastModified: now,
    ...entry,
  }));
}
