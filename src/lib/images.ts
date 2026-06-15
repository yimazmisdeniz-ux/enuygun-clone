/**
 * Hotel photos come from the hotel image CDN at a low thumbnail height — the
 * vast majority are stored as `…/media/lib/1x420/…`, which renders soft once it
 * fills a card or the detail hero. The CDN re-encodes on demand for any height
 * baked into the path (`1x720`, `1x1080` are all valid; only `0x0` 404s), so we
 * rewrite the size segment up to a crisp target.
 *
 * Because every consumer renders with `next/image` + `fill` + `object-cover`,
 * the rendered box is driven by CSS, not the source — a larger source only
 * sharpens the image, it never changes layout dimensions. Local assets
 * (`/images/…`) and any non-CDN URL pass through untouched.
 */
const CDN_SIZE_RE = /(\/media\/lib\/)\d+x\d+(\/)/;

/**
 * Upscale a hotel CDN image URL to `height` px (width stays proportional via
 * the CDN's `1x` auto-width prefix). Pass-through for empty / local / non-CDN.
 */
export function hiResImage(url: string | undefined | null, height = 1080): string {
  if (!url || !url.startsWith("http")) return url ?? "";
  return url.replace(CDN_SIZE_RE, `$1` + `1x${height}` + `$2`);
}

/** Map a list of URLs through {@link hiResImage}. */
export function hiResImages(urls: (string | undefined | null)[], height = 1080): string[] {
  return urls.map((u) => hiResImage(u, height)).filter((u): u is string => !!u);
}
