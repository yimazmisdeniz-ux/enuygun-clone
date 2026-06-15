// Input masks shared by the booking and rental forms. Each helper takes the
// raw input value and returns the sanitized/formatted text, so fields reject
// invalid characters as the user types instead of failing at submit.

/** Person names: letters in any alphabet plus space, hyphen, apostrophe. */
export function lettersOnly(v: string): string {
  return v.replace(/[^\p{L}\p{M} '-]/gu, "").replace(/ {2,}/g, " ");
}

/** Digits only, optionally capped at `max` characters. */
export function digitsOnly(v: string, max?: number): string {
  const d = v.replace(/\D/g, "");
  return max ? d.slice(0, max) : d;
}

/**
 * TR mobile number as the user types: "5XX XXX XX XX" (10 digits, 3-3-2-2).
 * Pasted "+90…" and "0…" prefixes are normalized away so the national number
 * remains.
 */
export function formatTrPhone(v: string): string {
  let d = v.replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("90") && d.length > 10) d = d.slice(2);
  d = d.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)]
    .filter(Boolean)
    .join(" ");
}

/** A 10-digit TR mobile number (5XX XXX XX XX), ignoring the mask spaces. */
export function isValidTrPhone(v: string): boolean {
  return /^5\d{9}$/.test(v.replace(/\D/g, ""));
}

/** Flight code: uppercase letters + digits ("TK1234"), max 7 chars. */
export function formatFlightNo(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}
