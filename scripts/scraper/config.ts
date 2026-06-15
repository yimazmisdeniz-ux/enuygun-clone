import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BASE = "https://www.enuygun.com";

/** Realistic desktop Chrome UA + headers to look like a real browser to Cloudflare. */
export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

/** Fixed representative price window — see plan "Live-price limitation". */
export const PRICE_WINDOW = {
  checkin: "2026-07-18", // Saturday
  checkout: "2026-07-20", // Monday
  adults: 2,
  rooms: 1,
};

/** Concurrency per stage. */
export const CONCURRENCY = {
  enumerate: 4,
  detail: 3,
  prices: 2,
  reviews: 2,
  cars: 3,
};

/** Jitter range (ms) between requests. Throttled to avoid HTTP 429. */
export const JITTER = { min: 500, max: 1200 };

/** Paths. */
export const DATA_DIR = path.resolve(__dirname, "data");
export const paths = {
  data: DATA_DIR,
  napiEndpoints: path.join(DATA_DIR, "napi-endpoints.json"),
  napiSummary: path.join(DATA_DIR, "napi-summary.txt"),
  storageState: path.join(DATA_DIR, "storage-state.json"),
  hotelsUrls: path.join(DATA_DIR, "hotels", "urls.json"),
  hotelsRegions: path.join(DATA_DIR, "hotels", "regions.json"),
  hotelsDetail: path.join(DATA_DIR, "hotels", "detail"),
  hotelsPrices: path.join(DATA_DIR, "hotels", "prices"),
  hotelsReviews: path.join(DATA_DIR, "hotels", "reviews"),
  carsUrls: path.join(DATA_DIR, "cars", "urls.json"),
  carsDetail: path.join(DATA_DIR, "cars", "landing"),
  carsQuotes: path.join(DATA_DIR, "cars", "quotes"),
};

/** Sitemap entry points. */
export const SITEMAPS = {
  hotelIndex: `${BASE}/otel/sitemap/sitemap.xml`,
  carIndex: `${BASE}/arac-kiralama/sitemap.xml`,
};

/** Parse a `--limit N` flag from argv (subset runs). */
export function argLimit(): number | undefined {
  const i = process.argv.indexOf("--limit");
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return undefined;
}

export const RETRY_FAILED = process.argv.includes("--retry-failed");

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Deterministic-ish jitter (avoids Math.random ban in workflows; fine here). */
export function jitter() {
  const { min, max } = JITTER;
  return sleep(min + Math.floor(Math.random() * (max - min)));
}
