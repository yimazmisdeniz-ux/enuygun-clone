import fs from "node:fs";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { paths, UA } from "../config.js";

/** Launch chromium with a realistic context. Reuses storageState if present. */
export async function launchBrowser(headless = true): Promise<{
  browser: Browser;
  context: BrowserContext;
}> {
  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const hasState = fs.existsSync(paths.storageState);
  const context = await browser.newContext({
    userAgent: UA,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    viewport: { width: 1440, height: 900 },
    ...(hasState ? { storageState: paths.storageState } : {}),
  });
  return { browser, context };
}

/** Visit a URL to warm Cloudflare cookies, then persist storageState. */
export async function warmSession(context: BrowserContext, url: string) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await context.storageState({ path: paths.storageState });
  await page.close();
}

export function saveStorageState(context: BrowserContext) {
  return context.storageState({ path: paths.storageState });
}
