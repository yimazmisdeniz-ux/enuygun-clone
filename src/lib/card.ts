// Card-number helpers for the payment forms. No bank/issuer detection — the
// 3D Secure step is bank-neutral (a generic, professional verification screen).

/**
 * Attributes that keep browsers, autofill, and password managers from touching
 * a field. These are DEMO inputs — not a real PCI card form — so we explicitly
 * opt out of autofill, "save this card?" prompts, and injected manager icons,
 * which prevents both data leakage (real saved cards) and broken layouts.
 * Spread onto each sensitive input: `<input {...NO_AUTOFILL} … />`.
 */
export const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  "data-1p-ignore": "",          // 1Password
  "data-lpignore": "true",       // LastPass
  "data-bwignore": "true",       // Bitwarden
  "data-dashlane-ignore": "true",// Dashlane
  "data-form-type": "other",     // generic manager hint: not a login/card form
};

/** Format "1234 5678 9012 3456" as the user types (max 16 digits). */
export function formatCardNumber(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

/** Last 4 digits, or "" if not enough entered. */
export function cardLast4(cardNumber: string): string {
  const d = cardNumber.replace(/\D/g, "");
  return d.length >= 4 ? d.slice(-4) : "";
}

/** Luhn-valid 15–16 digit number. */
export function isValidCardNumber(cardNumber: string): boolean {
  const d = cardNumber.replace(/\D/g, "");
  if (d.length < 15 || d.length > 16) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}
