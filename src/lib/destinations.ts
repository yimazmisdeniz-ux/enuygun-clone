import { DESTINATIONS, type Destination } from "./destinations.data";

export type { Destination };
export { DESTINATIONS };

/** Localized country name for a destination's country code. */
export function countryLabel(code: "TR" | "CY", locale: string): string {
  if (code === "CY") return locale === "en" ? "Cyprus" : "Kıbrıs";
  return locale === "en" ? "Turkey" : "Türkiye";
}

/** Country suffix for a suggestion, omitted when the row *is* the country. */
export function destinationCountrySuffix(d: Destination, locale: string): string {
  if (d.slug === "turkiye" || d.slug === "turkey" || d.slug === "kibris") return "";
  return countryLabel(d.country, locale);
}

const TR_FOLD: Record<string, string> = {
  İ: "i", I: "i", ı: "i", Ş: "s", ş: "s", Ğ: "g", ğ: "g",
  Ç: "c", ç: "c", Ö: "o", ö: "o", Ü: "u", ü: "u",
};

/** Lowercase + strip Turkish diacritics so "İst" matches "İstanbul". */
function fold(s: string): string {
  return s.replace(/[İIıŞşĞğÇçÖöÜü]/g, (c) => TR_FOLD[c] ?? c).toLowerCase().trim();
}

/** Extra (folded) search terms per destination slug — e.g. English names. */
const ALIASES: Record<string, string[]> = {
  turkiye: ["turkey"],
  kibris: ["cyprus"],
  istanbul: ["istanbul", "constantinople"],
};

/**
 * Autocomplete over the destination index. Ranks exact > prefix > substring,
 * then by hotel count. Diacritic-insensitive ("cesme" finds "Çeşme").
 */
export function searchDestinations(query: string, limit = 8): Destination[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const scored: { d: Destination; score: number }[] = [];
  for (const d of DESTINATIONS) {
    const name = fold(d.name);
    // Match the whole string or any word's start — avoids mid-word noise
    // like "İst" matching "Paphos District".
    let score = -1;
    if (name === q) score = 3;
    else if (name.startsWith(q)) score = 2;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 1;
    // English / alternate names (e.g. "turkey" → Türkiye, "cyprus" → Kıbrıs).
    if (score < 0) {
      const aliases = ALIASES[d.slug];
      if (aliases?.some((a) => a === q || a.startsWith(q))) score = 2;
    }
    if (score >= 0) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score || b.d.count - a.d.count);
  return scored.slice(0, limit).map((x) => x.d);
}
