/** Render a detail page in Playwright, wait for room prices to appear, capture
 * the network call that delivers them + the rendered DOM price. */
import type { Request as PWRequest } from "playwright";
import { BASE, PRICE_WINDOW, paths } from "../config.js";
import { launchBrowser } from "../lib/browser.js";
import { writeJson } from "../lib/checkpoint.js";
import path from "node:path";

async function main() {
  const url = `${BASE}/otel/detay/concorde-luxury-resort-578301/?checkInDate=${PRICE_WINDOW.checkin}&checkOutDate=${PRICE_WINDOW.checkout}&rooms=${PRICE_WINDOW.adults}`;
  const { browser, context } = await launchBrowser(true);
  const page = await context.newPage();

  const calls: { url: string; method: string; status: number; sample: string }[] = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (res.request().resourceType() === "image") return;
    const lower = u.toLowerCase();
    if (
      lower.includes("price") ||
      lower.includes("offer") ||
      lower.includes("room") ||
      lower.includes("availab") ||
      lower.includes("search") ||
      lower.includes("/napi/")
    ) {
      let sample = "";
      try {
        sample = (await res.text()).slice(0, 600);
      } catch {
        /* ignore */
      }
      calls.push({ url: u, method: res.request().method(), status: res.status(), sample });
    }
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for any TL price text to render in the rooms area
  let domPrices: string[] = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1500);
    domPrices = await page.evaluate(() => {
      const out: string[] = [];
      const re = /[\d.]+\s*(TL|₺)/;
      document.querySelectorAll("body *").forEach((el) => {
        if (el.children.length === 0) {
          const t = (el.textContent || "").trim();
          if (re.test(t) && t.length < 40) out.push(t);
        }
      });
      return [...new Set(out)].slice(0, 40);
    });
    if (domPrices.length > 3) break;
  }

  await context.storageState({ path: paths.storageState });
  await browser.close();

  writeJson(path.join(paths.data, "capture-prices.json"), {
    url,
    domPriceSamples: domPrices,
    networkCalls: calls,
  });
  console.log(`→ capture-prices.json  (domPrices: ${domPrices.length}, calls: ${calls.length})`);
  console.log("DOM prices:", domPrices.slice(0, 10));
  console.log("Network:", calls.map((c) => `${c.status} ${c.method} ${c.url.slice(0, 90)}`).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
