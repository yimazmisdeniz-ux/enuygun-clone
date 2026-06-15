import { XMLParser } from "fast-xml-parser";
import { fetchText } from "./http.js";

const parser = new XMLParser({ ignoreAttributes: true });

/** Return all <loc> URLs from a sitemap or sitemap-index XML document. */
export async function fetchSitemapLocs(url: string): Promise<string[]> {
  const xml = await fetchText(url);
  const doc = parser.parse(xml);
  const locs: string[] = [];

  const collect = (node: any) => {
    if (!node) return;
    const arr = Array.isArray(node) ? node : [node];
    for (const entry of arr) {
      if (entry?.loc) locs.push(String(entry.loc).trim());
    }
  };

  if (doc.sitemapindex?.sitemap) collect(doc.sitemapindex.sitemap);
  if (doc.urlset?.url) collect(doc.urlset.url);

  return locs;
}

/** Recursively walk a sitemap index, returning all leaf <loc> page URLs that
 * match an optional filter. */
export async function crawlSitemap(
  indexUrl: string,
  opts: { childFilter?: (u: string) => boolean; pageFilter?: (u: string) => boolean } = {},
): Promise<string[]> {
  const top = await fetchSitemapLocs(indexUrl);
  const childSitemaps = top.filter((u) => u.endsWith(".xml"));
  const directPages = top.filter((u) => !u.endsWith(".xml"));

  const result: string[] = [...directPages];

  const children = opts.childFilter
    ? childSitemaps.filter(opts.childFilter)
    : childSitemaps;

  for (const child of children) {
    try {
      const locs = await fetchSitemapLocs(child);
      for (const l of locs) {
        if (l.endsWith(".xml")) {
          // nested index — one more level
          const nested = await fetchSitemapLocs(l);
          result.push(...nested.filter((u) => !u.endsWith(".xml")));
        } else {
          result.push(l);
        }
      }
    } catch (e) {
      console.warn(`  ! sitemap child failed: ${child} (${(e as Error).message})`);
    }
  }

  const pages = opts.pageFilter ? result.filter(opts.pageFilter) : result;
  return [...new Set(pages)];
}
