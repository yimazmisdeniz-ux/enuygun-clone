/** Probe what __NEXT_DATA__ embeds on detail + listing pages (current reality). */
import { BASE, PRICE_WINDOW, paths } from "../config.js";
import { fetchText } from "../lib/http.js";
import { extractNextData, findAllByKeys } from "../lib/nextdata.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

function summarizeKeys(obj: any, depth = 0, maxDepth = 3): any {
  if (!obj || typeof obj !== "object" || depth > maxDepth) {
    return typeof obj;
  }
  if (Array.isArray(obj)) {
    return obj.length ? [summarizeKeys(obj[0], depth + 1, maxDepth)] : [];
  }
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    out[k] = summarizeKeys(obj[k], depth + 1, maxDepth);
  }
  return out;
}

async function probe(name: string, url: string) {
  console.log(`\n=== ${name}: ${url}`);
  const html = await fetchText(url);
  const nd = extractNextData(html);
  if (!nd) {
    console.log("  NO __NEXT_DATA__");
    writeJson(path.join(paths.data, `probe-${name}-rawhead.json`), {
      htmlLen: html.length,
      head: html.slice(0, 2000),
    });
    return;
  }
  const pageProps = nd?.props?.pageProps ?? {};
  console.log("  pageProps keys:", Object.keys(pageProps));

  // hunt for interesting structures
  const hotels = findAllByKeys(nd, ["id", "name"]).slice(0, 3);
  const offers = findAllByKeys(nd, ["price"]).slice(0, 3);
  const comments = findAllByKeys(nd, ["comment"]).slice(0, 3);
  console.log("  objects with {id,name}:", findAllByKeys(nd, ["id", "name"]).length);
  console.log("  objects with {price}:", findAllByKeys(nd, ["price"]).length);
  console.log("  objects with {comment}:", findAllByKeys(nd, ["comment"]).length);

  writeJson(path.join(paths.data, `probe-${name}.json`), {
    pagePropsShape: summarizeKeys(pageProps, 0, 4),
    sampleHotelLike: hotels,
    sampleOffers: offers,
    sampleComments: comments,
    buildId: nd.buildId,
  });
  console.log(`  → probe-${name}.json`);
}

async function main() {
  const detail = `${BASE}/otel/detay/concorde-luxury-resort-578301/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}`;
  const listing = `${BASE}/otel/bolge/kibris-45/`;
  await probe("detail", detail);
  await probe("listing", listing);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
