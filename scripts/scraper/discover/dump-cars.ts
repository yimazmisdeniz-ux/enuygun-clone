/** Extract car objects from a car landing page's RSC flight data. */
import { BASE, paths } from "../config.js";
import { fetchText } from "../lib/http.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

function decodeFlight(html: string): string {
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) chunks.push(m[1]);
  return chunks
    .join("")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\\\/g, "\\");
}

/** Find balanced {...} JSON objects containing a needle. */
function extractObjects(text: string, needle: string, max = 5): any[] {
  const out: any[] = [];
  let idx = 0;
  while (out.length < max) {
    const hit = text.indexOf(needle, idx);
    if (hit < 0) break;
    // walk back to nearest '{'
    let start = hit;
    while (start > 0 && text[start] !== "{") start--;
    // walk forward to matching close
    let depth = 0;
    let end = start;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const slice = text.slice(start, end + 1);
    try {
      out.push(JSON.parse(slice));
    } catch {
      out.push({ raw: slice.slice(0, 500) });
    }
    idx = end + 1;
  }
  return out;
}

async function main() {
  // a search results page is more likely to carry car offers than a landing page
  const url = `${BASE}/arac-kiralama/sehir/istanbul/`;
  const html = await fetchText(url);
  const text = decodeFlight(html);

  writeJson(path.join(paths.data, "dump-cars.json"), {
    url,
    decodedLen: text.length,
    transmissionObjs: extractObjects(text, '"transmission"', 3),
    vendorObjs: extractObjects(text, '"vendor"', 2),
    supplierObjs: extractObjects(text, '"supplier"', 2),
    ekonomikCtx: (() => {
      const i = text.indexOf("Ekonomik");
      return i < 0 ? null : text.slice(Math.max(0, i - 400), i + 400);
    })(),
    carClassCtx: (() => {
      const i = text.indexOf("carClass");
      return i < 0 ? null : text.slice(Math.max(0, i - 300), i + 300);
    })(),
  });
  console.log("→ dump-cars.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
