/** Enumerate all hotel detail URLs from the hotel sitemap index. */
import { SITEMAPS, paths } from "../config.js";
import { crawlSitemap } from "../lib/sitemap.js";
import { loadCookiesFromStorageState } from "../lib/http.js";
import { writeJson } from "../lib/checkpoint.js";

const DETAIL_RE = /\/otel\/detay\/([a-z0-9-]+?)-(\d+)\/?$/i;

async function main() {
  loadCookiesFromStorageState();
  console.log("Crawling hotel sitemap index…");
  const pages = await crawlSitemap(SITEMAPS.hotelIndex, {
    childFilter: (u) => /sitemap\.hotel|sitemap\.region|hotel_|region_/i.test(u),
    pageFilter: (u) => DETAIL_RE.test(u),
  });

  const seen = new Set<string>();
  const hotels = pages
    .map((url) => {
      const m = url.match(DETAIL_RE);
      if (!m) return null;
      const slug = `${m[1]}-${m[2]}`;
      const id = Number(m[2]);
      return { id, slug, url: url.split("?")[0] };
    })
    .filter((h): h is { id: number; slug: string; url: string } => {
      if (!h) return false;
      if (seen.has(h.slug)) return false;
      seen.add(h.slug);
      return true;
    });

  writeJson(paths.hotelsUrls, hotels);
  console.log(`✓ ${hotels.length} unique hotel URLs → ${paths.hotelsUrls}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
