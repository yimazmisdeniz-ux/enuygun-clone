/**
 * Currency model — pure helpers, no React / no next/headers, so this module is
 * safe to import from both client and server components.
 *
 * Prices are stored in the DB in Turkish Lira (TRY). A rate is expressed as
 * `try_per_unit`: how many TRY equal 1 unit of the quote currency
 * (e.g. USD → 32.5 means 1 USD = 32.5 TRY). TRY itself is always 1.
 */

export const CURRENCIES = ["TRY", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "EUR";

/** quote code → try_per_unit. Always contains TRY = 1. */
export type FxRates = Record<string, number>;

export function isCurrency(v: string | null | undefined): v is Currency {
  return !!v && (CURRENCIES as readonly string[]).includes(v);
}

/** Convert a TRY amount into the target currency using try_per_unit rates.
 *  Falls back to the raw TRY number if the rate is missing/invalid so the UI
 *  never renders NaN. */
export function convert(amountTL: number, rates: FxRates, currency: Currency): number {
  if (!Number.isFinite(amountTL)) return 0;
  if (currency === "TRY") return amountTL;
  const unit = rates[currency];
  if (!unit || !Number.isFinite(unit) || unit <= 0) return amountTL;
  return amountTL / unit;
}

/** BCP-47 tag for grouping/decimal separators. Symbol comes from `currency`. */
function localeTag(locale: string): string {
  return locale === "en" ? "en-US" : "tr-TR";
}

/**
 * Format a plain (non-money) integer with locale grouping — e.g. km limits or
 * review counts. NOT a currency, so it is never converted. Pure, client-safe.
 */
export function formatCount(n: number, locale = "tr"): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString(localeTag(locale), {
    maximumFractionDigits: 0,
  });
}

/**
 * Format a stored TRY amount in the user's chosen currency + locale.
 *
 * TRY keeps the site's original "31.600 TL" / "49.500,00 TL" presentation
 * (literal "TL" suffix, for pixel-perfect emulation). Other currencies use
 * Intl currency formatting with the native narrow symbol ($, €, £).
 */
export function formatMoney(
  amountTL: number,
  rates: FxRates,
  currency: Currency,
  locale: string,
  opts?: { decimals?: 0 | 2 },
): string {
  const value = convert(amountTL, rates, currency);
  const decimals = opts?.decimals ?? 0;

  if (currency === "TRY") {
    const num = value.toLocaleString(localeTag(locale), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${num} TL`;
  }

  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
