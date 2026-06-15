/** Fetch each hotel detail page, parse __NEXT_DATA__ -> detail/{id}.json. */
import path from "node:path";
import pLimit from "p-limit";
import { BASE, PRICE_WINDOW, CONCURRENCY, paths, argLimit, RETRY_FAILED, jitter } from "../config.js";
import { fetchText, loadCookiesFromStorageState } from "../lib/http.js";
import { extractNextData } from "../lib/nextdata.js";
import { parseHotelDetail } from "./parse.js";
import { CheckpointStore, readJson, writeJson, fileExists } from "../lib/checkpoint.js";

type HotelUrl = { id: number; slug: string; url: string };

async function main() {
  loadCookiesFromStorageState();
  let urls = readJson<HotelUrl[]>(paths.hotelsUrls, []);
  if (!urls.length) {
    console.error("No hotels/urls.json — run 01-enumerate first.");
    process.exit(1);
  }

  const cp = new CheckpointStore(paths.hotelsDetail);
  if (RETRY_FAILED) {
    const failed = new Set(cp.failedIds);
    urls = urls.filter((u) => failed.has(String(u.id)));
    console.log(`Retry mode: ${urls.length} failed hotels`);
  }
  const limit = argLimit();
  if (limit) urls = urls.slice(0, limit);

  const lim = pLimit(CONCURRENCY.detail);
  let ok = 0;
  let fail = 0;
  const qs = `?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}`;

  await Promise.all(
    urls.map((u) =>
      lim(async () => {
        const idStr = String(u.id);
        const out = path.join(paths.hotelsDetail, `${u.id}.json`);
        if (!RETRY_FAILED && (cp.isDone(idStr) || fileExists(out))) {
          cp.markDone(idStr);
          return;
        }
        try {
          await jitter();
          const html = await fetchText(u.url + qs);
          const nd = extractNextData(html);
          if (!nd) throw new Error("no __NEXT_DATA__");
          const parsed = parseHotelDetail(nd);
          if (!parsed) throw new Error("parse failed (no detailInfo)");
          writeJson(out, parsed);
          cp.markDone(idStr);
          ok++;
          if (ok % 25 === 0) console.log(`  …${ok} ok / ${fail} fail`);
        } catch (e) {
          cp.markFailed(idStr, e);
          fail++;
          console.warn(`  ! ${u.slug}: ${(e as Error).message}`);
        }
      }),
    ),
  );

  console.log(`✓ detail done: ${ok} ok, ${fail} fail (total checkpoint: ${JSON.stringify(cp.stats())})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
