/**
 * Site-wide exclusive hotel offer: a single flat discount applied once at the
 * data-mapping layer (supabase/map.ts). DB prices are treated as the original
 * price; nothing else in the app may discount again, so the offer never stacks
 * with the scraped per-hotel discounts.
 */
/**
 * Marketing badge percentage shown in the UI ("%50 indirim"). This is the
 * advertised figure only — the actual price reduction is {@link OFFER_REAL_PCT}.
 */
export const OFFER_PCT = 50;

/** Real discount applied to prices (kept lower so prices stay realistic). */
export const OFFER_REAL_PCT = 20;

/**
 * Fixed campaign deadline the countdown targets (local time). End of July —
 * replaces the old rolling 48h window.
 */
export const OFFER_DEADLINE = "2026-07-31T23:59:59";

export function offerPrice(baseTL: number): number {
  return Math.round(baseTL * (1 - OFFER_REAL_PCT / 100));
}

/**
 * Strikethrough "old" price shown next to the discounted price. Derived from the
 * real price so the visible gap matches the advertised {@link OFFER_PCT} badge
 * (e.g. 50% off): old = price / (1 - 50%) = price × 2.
 */
export function strikePrice(priceTL: number): number {
  return Math.round(priceTL / (1 - OFFER_PCT / 100));
}
