/** Fetch car landing pages, extract real car listings, dedupe -> cars/all.json. */
import path from "node:path";
import pLimit from "p-limit";
import { CONCURRENCY, paths, argLimit, jitter } from "../config.js";
import { fetchText, loadCookiesFromStorageState } from "../lib/http.js";
import { parseCarsFromHtml, type ParsedCar } from "./parse.js";
import { CheckpointStore, readJson, writeJson } from "../lib/checkpoint.js";

type CarUrl = { type: string; location: string; url: string };

async function main() {
  loadCookiesFromStorageState();
  let urls = readJson<CarUrl[]>(paths.carsUrls, []);
  if (!urls.length) {
    console.error("No cars/urls.json — run cars/01-enumerate first.");
    process.exit(1);
  }
  const limit = argLimit();
  if (limit) urls = urls.slice(0, limit);

  const cp = new CheckpointStore(paths.carsDetail);
  const lim = pLimit(CONCURRENCY.cars);
  const bySlug = new Map<string, ParsedCar>();
  // preload any prior merged result so reruns accumulate
  for (const c of readJson<ParsedCar[]>(path.join(paths.carsDetail, "..", "all.json"), [])) {
    bySlug.set(c.slug, c);
  }
  let ok = 0;
  let fail = 0;

  await Promise.all(
    urls.map((u) =>
      lim(async () => {
        const id = u.url;
        if (cp.isDone(id)) return;
        try {
          await jitter();
          const html = await fetchText(u.url);
          const cars = parseCarsFromHtml(html, u.location);
          for (const c of cars) if (!bySlug.has(c.slug)) bySlug.set(c.slug, c);
          writeJson(path.join(paths.carsDetail, `${u.type}-${u.location}.json`), cars);
          cp.markDone(id);
          ok++;
          if (ok % 20 === 0) console.log(`  …${ok} pages, ${bySlug.size} unique cars`);
        } catch (e) {
          cp.markFailed(id, e);
          fail++;
          console.warn(`  ! ${u.url}: ${(e as Error).message}`);
        }
      }),
    ),
  );

  const all = [...bySlug.values()].filter((c) => c.daily_tl > 0);
  writeJson(path.join(paths.data, "cars", "all.json"), all);
  console.log(`✓ cars done: ${ok} pages, ${fail} fail, ${all.length} unique cars → cars/all.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
