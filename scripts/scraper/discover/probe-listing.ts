/** Inspect the App-Router bolge listing: does RSC flight data carry prices? */
import { BASE, PRICE_WINDOW, paths } from "../config.js";
import { fetchText } from "../lib/http.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

async function main() {
  const url = `${BASE}/otel/bolge/kibris-45/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}&autoRequest=true`;
  const html = await fetchText(url);

  // collect __next_f flight chunks
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) chunks.push(m[1]);

  const joined = chunks.join("");
  const decoded = joined
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");

  const has = (s: string) => decoded.includes(s);
  const findContext = (needle: string, span = 300) => {
    const i = decoded.indexOf(needle);
    return i < 0 ? null : decoded.slice(Math.max(0, i - span), i + span);
  };

  writeJson(path.join(paths.data, "probe-listing-flight.json"), {
    htmlLen: html.length,
    chunkCount: chunks.length,
    decodedLen: decoded.length,
    markers: {
      price: has("price"),
      dailyPrice: has("dailyPrice"),
      hotelId: has("hotelId"),
      reviewScore: has("reviewScore"),
      discount: has("discount"),
      offer: has("offer"),
      TL: has("TL"),
      board: has("board"),
      pension: has("pension"),
    },
    priceContext: findContext('"price"', 400),
    hotelContext: findContext('"hotelId"', 400) ?? findContext('"id"', 200),
  });
  console.log("→ probe-listing-flight.json  (chunks:", chunks.length, ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
