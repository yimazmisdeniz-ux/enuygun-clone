/** Enumerate car-rental landing page URLs (sehir + havalimani) from sitemap. */
import { SITEMAPS, paths } from "../config.js";
import { crawlSitemap } from "../lib/sitemap.js";
import { loadCookiesFromStorageState } from "../lib/http.js";
import { writeJson } from "../lib/checkpoint.js";

async function main() {
  loadCookiesFromStorageState();
  const pages = await crawlSitemap(SITEMAPS.carIndex, {});
  // sehir + havalimani carry the richest rentableCars flight data
  const wanted = pages.filter((u) => /\/arac-kiralama\/(sehir|havalimani)\//.test(u));
  const urls = wanted.map((url) => {
    const m = url.match(/\/arac-kiralama\/(sehir|havalimani)\/([a-z0-9-]+)\/?$/i);
    return {
      type: m?.[1] ?? "sehir",
      location: (m?.[2] ?? "")
        .replace(/-havalimani$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      url: url.split("?")[0],
    };
  });
  writeJson(paths.carsUrls, urls);
  console.log(`✓ ${urls.length} car landing URLs → ${paths.carsUrls}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
