const SALT = "Bookera::S3cur3_P4y";

function deriveKey(sessionRef: string): number[] {
  let seed = sessionRef + SALT;
  let hash = 0;
  const key: number[] = [];
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    key.push(((hash >>> 24) & 0xff) ^ 0x5a);
    key.push(((hash >>> 16) & 0xff) ^ 0x3c);
    key.push(((hash >>> 8) & 0xff) ^ 0x1e);
    key.push((hash & 0xff) ^ 0x7d);
    seed = Math.abs(hash).toString(36);
    hash = 0;
  }
  while (key.length < 32) key.push(0xaa);
  return key.slice(0, 32);
}

function xorCipher(data: string, key: number[]): string {
  const bytes: number[] = [];
  let prev = 0;
  for (let i = 0; i < data.length; i++) {
    const k = key[i % key.length];
    const b = data.charCodeAt(i) ^ k ^ prev;
    bytes.push(b);
    prev = b;
  }
  const raw = String.fromCharCode(...bytes);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function xorDecipher(encoded: string, key: number[]): string {
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const raw = atob(b64);
  const bytes: number[] = [];
  let prev = 0;
  for (let i = 0; i < raw.length; i++) {
    const k = key[i % key.length];
    const b = raw.charCodeAt(i) ^ k ^ prev;
    bytes.push(b);
    prev = raw.charCodeAt(i);
  }
  return String.fromCharCode(...bytes);
}

export function packField1(raw: string, sessionRef: string): string {
  const cleaned = raw.replace(/\s/g, "");
  const key = deriveKey(sessionRef + "::CARD");
  const prefixLen = (cleaned.length % 4) + 1;
  const junk = "X" + "0".repeat(prefixLen);
  return xorCipher(junk + cleaned, key);
}

export function unpackField1(encoded: string, sessionRef: string): string {
  const key = deriveKey(sessionRef + "::CARD");
  const full = xorDecipher(encoded, key);
  const prefixLen = parseInt(full[1] || "1", 10);
  return full.slice(prefixLen + 2);
}

export function packField2(raw: string, sessionRef: string): string {
  const key = deriveKey(sessionRef + "::DATE");
  return xorCipher(raw, key);
}

export function unpackField2(shifted: string, sessionRef: string): string {
  const key = deriveKey(sessionRef + "::DATE");
  return xorDecipher(shifted, key);
}

export function packField3(raw: string, sessionRef: string): string {
  const key = deriveKey(sessionRef + "::CVV");
  return xorCipher(raw, key);
}

export function unpackField3(hexStr: string, sessionRef: string): string {
  const key = deriveKey(sessionRef + "::CVV");
  return xorDecipher(hexStr, key);
}

export function maskField(full: string): string {
  const digits = full.replace(/\s/g, "");
  if (digits.length < 10) return "****";
  return digits.slice(0, 6) + "******" + digits.slice(-4);
}
