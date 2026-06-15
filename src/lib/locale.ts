/** Supported UI locales. Turkish is the default (the site's primary market). */
export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LANG_COOKIE = "eu_lang";
export const CURRENCY_COOKIE = "eu_currency";

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "tr" || v === "en";
}

/** Normalize anything (legacy "TR"/"EN", "tr-TR", etc.) to a supported locale. */
export function normalizeLocale(v: string | null | undefined): Locale {
  const base = (v ?? "").toLowerCase().split("-")[0];
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

/**
 * Pick a locale from an Accept-Language header. Turkish if any Turkish tag
 * appears, otherwise English (we only ship tr/en). Falls back to default.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag === "tr") return "tr";
    if (tag === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

/** Country (ISO-3166 alpha-2) → locale. Turkey → tr, everything else → en. */
export function localeFromCountry(country: string | null): Locale | null {
  if (!country) return null;
  return country.toUpperCase() === "TR" ? "tr" : "en";
}

const EUROZONE = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

/** Country → sensible default currency for first-time visitors. */
export function currencyFromCountry(country: string | null): "TRY" | "USD" | "EUR" | "GBP" {
  const c = (country ?? "").toUpperCase();
  if (c === "TR") return "TRY";
  if (c === "GB") return "GBP";
  if (c === "US") return "USD";
  if (EUROZONE.has(c)) return "EUR";
  return "USD";
}
