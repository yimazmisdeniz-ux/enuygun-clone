import * as cheerio from "cheerio";

/** Extract and parse the __NEXT_DATA__ JSON blob from an HTML string. */
export function extractNextData(html: string): any | null {
  const $ = cheerio.load(html);
  const raw = $("#__NEXT_DATA__").contents().text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Deep-find the first object that has ALL given keys (BFS). Useful when the
 * exact path inside __NEXT_DATA__ varies between build IDs. */
export function findByKeys(root: any, keys: string[]): any | null {
  const queue: any[] = [root];
  const seen = new Set<any>();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (!Array.isArray(node) && keys.every((k) => k in node)) return node;
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return null;
}

/** Collect ALL objects matching keys (BFS). */
export function findAllByKeys(root: any, keys: string[]): any[] {
  const out: any[] = [];
  const queue: any[] = [root];
  const seen = new Set<any>();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (!Array.isArray(node) && keys.every((k) => k in node)) out.push(node);
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return out;
}
