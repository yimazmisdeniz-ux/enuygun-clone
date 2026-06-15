/** Probe car-rental sitemap + a landing page for embedded car data. */
import { SITEMAPS, BASE, paths } from "../config.js";
import { fetchText } from "../lib/http.js";
import { crawlSitemap } from "../lib/sitemap.js";
import { extractNextData } from "../lib/nextdata.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

async function main() {
  const pages = await crawlSitemap(SITEMAPS.carIndex, {});
  const byType: Record<string, number> = {};
  for (const u of pages) {
    const m = u.match(/\/arac-kiralama\/([a-z-]+)\//i);
    const t = m ? m[1] : "(other)";
    byType[t] = (byType[t] ?? 0) + 1;
  }

  // probe a city landing + a search results page
  const sample = pages.find((u) => /\/sehir\//.test(u)) || pages[0];
  const html = await fetchText(sample);
  const nd = extractNextData(html);

  // flight chunks
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(html))) chunks.push(mm[1]);
  const decoded = chunks.join("").replace(/\\"/g, '"').replace(/\\n/g, "\n");

  const has = (s: string) => (nd ? JSON.stringify(nd).includes(s) : false) || decoded.includes(s);

  writeJson(path.join(paths.data, "probe-cars.json"), {
    totalCarPages: pages.length,
    byType,
    samplePages: pages.slice(0, 5),
    probed: sample,
    hasNextData: !!nd,
    ndPagePropsKeys: nd ? Object.keys(nd?.props?.pageProps ?? {}) : null,
    flightChunks: chunks.length,
    markers: {
      transmission: has("transmission") || has("vites") || has("Otomatik"),
      supplier: has("supplier") || has("vendor") || has("firma"),
      dailyPrice: has("dailyPrice") || has("dailyTotalPrice"),
      price: has("price"),
      carClass: has("carClass") || has("Ekonomik"),
      vehicle: has("vehicle") || has("car"),
    },
    ndSnippet: nd ? JSON.stringify(nd?.props?.pageProps).slice(0, 1500) : null,
  });
  console.log("→ probe-cars.json  pages:", pages.length, "types:", JSON.stringify(byType));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
