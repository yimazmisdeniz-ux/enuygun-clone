/**
 * STEP 1 (GATE): Capture every /napi/v1 (and /api/) XHR enuygun.com fires
 * across the listing, hotel-detail, and car-search flows. Dumps endpoints +
 * headers + sample responses to data/napi-endpoints.json and warms cookies.
 *
 * Run: npm run scrape:discover            (headless)
 *      npm run scrape:discover -- --headed (watch it)
 */
import type { Request as PWRequest, Response as PWResponse } from "playwright";
import { BASE, PRICE_WINDOW, paths } from "../config.js";
import { launchBrowser } from "../lib/browser.js";
import { writeJson, ensureDir } from "../lib/checkpoint.js";
import fs from "node:fs";

type Capture = {
  flow: string;
  method: string;
  url: string;
  resourceType: string;
  requestHeaders: Record<string, string>;
  postData: string | null;
  status: number | null;
  responseSample: string | null;
};

const HEADED = process.argv.includes("--headed");

// Representative live URLs (slugs can change; these are enumerated from sitemap
// at scrape time, but we hardcode a couple of known-good ones for discovery).
const LISTING_URL = `${BASE}/otel/bolge/kibris-45/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}&autoRequest=true`;
const DETAIL_URL = `${BASE}/otel/detay/concorde-luxury-resort-578301/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}`;
const CAR_URL = `${BASE}/arac-kiralama/`;

function isApi(url: string) {
  return url.includes("/napi/") || /\/api\//.test(url);
}

async function main() {
  ensureDir(paths.data);
  const captures: Capture[] = [];
  const { browser, context } = await launchBrowser(!HEADED);
  const page = await context.newPage();

  const pending = new Map<PWRequest, Capture>();

  page.on("request", (req: PWRequest) => {
    const url = req.url();
    if (!isApi(url)) return;
    const cap: Capture = {
      flow: currentFlow,
      method: req.method(),
      url,
      resourceType: req.resourceType(),
      requestHeaders: req.headers(),
      postData: req.postData() ?? null,
      status: null,
      responseSample: null,
    };
    pending.set(req, cap);
    captures.push(cap);
  });

  page.on("response", async (res: PWResponse) => {
    const req = res.request();
    const cap = pending.get(req);
    if (!cap) return;
    cap.status = res.status();
    try {
      const body = await res.text();
      cap.responseSample = body.slice(0, 4000);
    } catch {
      cap.responseSample = "<unreadable>";
    }
  });

  let currentFlow = "warmup";
  const goto = async (flow: string, url: string, after?: () => Promise<void>) => {
    currentFlow = flow;
    console.log(`\n→ [${flow}] ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(4000);
      if (after) await after();
      await page.waitForTimeout(3000);
    } catch (e) {
      console.warn(`  ! ${flow} nav issue: ${(e as Error).message}`);
    }
  };

  // Flow 1: region listing (client-rendered grid -> search/listing napi)
  await goto("listing", LISTING_URL, async () => {
    await autoScroll(page);
  });

  // Flow 2: hotel detail (live prices + paginated reviews)
  await goto("detail", DETAIL_URL, async () => {
    await autoScroll(page);
    // try to click any "more reviews" / "load more" button(s)
    for (const label of [
      /yorum/i,
      /daha fazla/i,
      /tümünü/i,
      /devam/i,
    ]) {
      const btn = page.getByRole("button", { name: label }).first();
      try {
        if (await btn.isVisible({ timeout: 1500 })) {
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(2500);
        }
      } catch {
        /* ignore */
      }
    }
    await autoScroll(page);
  });

  // Flow 3: car rental search
  await goto("car-search", CAR_URL, async () => {
    await autoScroll(page);
  });

  await context.storageState({ path: paths.storageState });
  await browser.close();

  // Dedupe by method+pathname, keep first sample
  const byEndpoint = new Map<string, Capture[]>();
  for (const c of captures) {
    let key = c.url;
    try {
      const u = new URL(c.url);
      key = `${c.method} ${u.host}${u.pathname}`;
    } catch {
      /* keep raw */
    }
    if (!byEndpoint.has(key)) byEndpoint.set(key, []);
    byEndpoint.get(key)!.push(c);
  }

  writeJson(paths.napiEndpoints, {
    capturedAt: new Date().toISOString(),
    flows: ["listing", "detail", "car-search"],
    totalCalls: captures.length,
    uniqueEndpoints: byEndpoint.size,
    endpoints: [...byEndpoint.entries()].map(([key, list]) => ({
      key,
      count: list.length,
      flows: [...new Set(list.map((l) => l.flow))],
      sample: list[0],
    })),
    all: captures,
  });

  const summary = [...byEndpoint.entries()]
    .map(([key, list]) => `${key}  (${list.length}x, flows: ${[...new Set(list.map((l) => l.flow))].join(",")})`)
    .sort()
    .join("\n");
  fs.writeFileSync(paths.napiSummary, summary, "utf8");

  console.log(`\n✓ Captured ${captures.length} API calls, ${byEndpoint.size} unique endpoints`);
  console.log(`  → ${paths.napiEndpoints}`);
  console.log(`  → ${paths.napiSummary}`);
  console.log(`\nUnique endpoints:\n${summary}`);
}

async function autoScroll(page: import("playwright").Page) {
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const step = 600;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          total += step;
          if (total >= document.body.scrollHeight - window.innerHeight - 100) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 8000);
      });
    });
  } catch {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
