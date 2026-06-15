import fs from "node:fs";
import { DEFAULT_HEADERS, paths, sleep } from "../config.js";

/** In-memory cookie jar, seeded from Playwright storageState if present. */
let cookieHeader = "";

export function loadCookiesFromStorageState() {
  try {
    const raw = fs.readFileSync(paths.storageState, "utf8");
    const state = JSON.parse(raw) as {
      cookies?: { name: string; value: string; domain: string }[];
    };
    const pairs = (state.cookies ?? [])
      .filter((c) => c.domain.includes("enuygun.com"))
      .map((c) => `${c.name}=${c.value}`);
    cookieHeader = pairs.join("; ");
    return pairs.length;
  } catch {
    return 0;
  }
}

export function setCookieHeader(h: string) {
  cookieHeader = h;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type FetchOpts = {
  retries?: number;
  headers?: Record<string, string>;
  /** Treat these statuses as fatal (no retry). */
  asText?: boolean;
};

/**
 * fetch with browser headers, cookie reuse, exponential backoff on 403/429/5xx.
 */
export async function fetchText(
  url: string,
  opts: FetchOpts = {},
): Promise<string> {
  const retries = opts.retries ?? 6;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          ...opts.headers,
        },
        redirect: "follow",
      });

      // capture any set-cookie to keep session warm
      const sc = res.headers.get("set-cookie");
      if (sc) mergeSetCookie(sc);

      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        throw new HttpError(res.status, `HTTP ${res.status} for ${url}`);
      }
      if (!res.ok) {
        // 404 etc — fatal, don't retry
        throw new HttpError(res.status, `HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpError ? err.status : 0;
      // don't retry hard 4xx (except 403/429)
      if (status && status < 500 && status !== 403 && status !== 429) throw err;
      if (attempt < retries) {
        // 429 gets a longer cooldown than 5xx
        const base = status === 429 ? 2500 : 800;
        const backoff = base * Math.pow(2, attempt) + Math.floor(Math.random() * 600);
        await sleep(backoff);
      }
    }
  }
  throw lastErr;
}

function mergeSetCookie(setCookie: string) {
  // crude parse: take "name=value" before first ";" of each cookie
  const parts = setCookie.split(/,(?=[^;]+?=)/);
  const jar = new Map<string, string>();
  for (const p of cookieHeader.split("; ").filter(Boolean)) {
    const eq = p.indexOf("=");
    if (eq > 0) jar.set(p.slice(0, eq), p.slice(eq + 1));
  }
  for (const c of parts) {
    const first = c.split(";")[0].trim();
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq), first.slice(eq + 1));
  }
  cookieHeader = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
