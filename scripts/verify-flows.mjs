// Focused re-verification of the few audit findings that looked like they
// might be harness false-positives (timing / selector / unfilled validation).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const out = [];
const log = (s, m) => { out.push(`[${s}] ${m}`); console.log(`[${s}] ${m}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "tr-TR" });
const page = await ctx.newPage();

/* 1) Homepage "Otel bul" with a generous waitForURL */
try {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await page.locator("input[placeholder*='ehir']").first().fill("Antalya");
  await page.getByRole("button", { name: /Otel bul/i }).click();
  await page.waitForURL(/\/otel\/kibris-45/, { timeout: 10000 });
  log("OK", `Otel bul → ${page.url().replace(BASE, "")}`);
} catch (e) {
  log("FAIL", `Otel bul navigasyonu olmadı: ${String(e.message).slice(0, 120)}`);
}

/* 2) Full car chain: sonuclar → kiralama → surucu → odeme */
try {
  await page.goto(BASE + "/arac-kiralama/sonuclar", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.getByRole("link", { name: /Hemen kirala/i }).first().click();
  await page.waitForURL(/\/arac-kiralama\/kiralama/, { timeout: 10000 });
  log("OK", `Hemen kirala → ${page.url().replace(BASE, "")}`);

  // Extras step → Devam → surucu
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: /Devam|Sürücü|İlerle/i }).first().click().catch(async () => {
    await page.getByRole("button", { name: /Devam|Sürücü|İlerle/i }).first().click();
  });
  await page.waitForURL(/\/arac-kiralama\/surucu/, { timeout: 10000 });
  log("OK", `Extras Devam → ${page.url().replace(BASE, "")}`);

  // Driver form — fill ALL required fields, then submit
  await page.waitForTimeout(600);
  await page.locator("input[type='email']").first().fill("test@example.com");
  await page.locator("input[type='tel']").first().fill("5551234567").catch(() => {});
  // name fields
  const texts = page.locator("input[type='text'], input:not([type])");
  const tn = await texts.count();
  // best-effort: first two text inputs = name/surname; TC field is 11-digit
  for (let i = 0; i < tn; i++) {
    const ph = (await texts.nth(i).getAttribute("placeholder")) ?? "";
    if (/Ad/i.test(ph) && !/Soyad/i.test(ph)) await texts.nth(i).fill("Test");
    else if (/Soyad/i.test(ph)) await texts.nth(i).fill("Kullanici");
    else if (/TC|Kimlik/i.test(ph)) await texts.nth(i).fill("12345678901");
    else if (/telefon|phone|GSM/i.test(ph)) await texts.nth(i).fill("5551234567");
  }
  // selects (birth day/month/year)
  const selects = page.locator("select");
  const sc = await selects.count();
  for (let i = 0; i < sc; i++) {
    const opts = selects.nth(i).locator("option");
    const oc = await opts.count();
    if (oc > 1) await selects.nth(i).selectOption({ index: 1 }).catch(() => {});
  }
  // any remaining empty text input that looks like TC (11 digits) — fill blindly
  for (let i = 0; i < tn; i++) {
    const v = await texts.nth(i).inputValue().catch(() => "x");
    if (v === "") await texts.nth(i).fill("12345678901");
  }
  await page.getByRole("button", { name: /Devam|Öde|İlerle|Ödeme/i }).first().click();
  await page.waitForURL(/\/arac-kiralama\/odeme/, { timeout: 8000 });
  log("OK", `Sürücü (dolu form) Devam → ${page.url().replace(BASE, "")}`);
} catch (e) {
  log("WARN", `Araç zinciri bir adımda durdu: ${String(e.message).slice(0, 140)} (URL: ${page.url().replace(BASE, "")})`);
}

/* 3) Does a payment produce ANY confirmation/success state? */
try {
  await page.goto(BASE + "/otel/odeme?slug=merit-park", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const payBtn = page.getByRole("button", { name: /Öde|Ödemeyi|Tamamla|Rezervasyonu tamamla/i }).first();
  const hasPay = await payBtn.count() > 0;
  if (!hasPay) { log("WARN", "Otel ödeme: öde butonu bulunamadı"); }
  else {
    const before = page.url();
    await payBtn.click();
    await page.waitForTimeout(1500);
    const changed = page.url() !== before;
    const success = await page.getByText(/teşekkür|başarı|onayland|rezervasyon.*tamam/i).count();
    log(success > 0 || changed ? "OK" : "INFO",
      `Otel ödeme tık sonrası: ${changed ? "navigasyon var" : "navigasyon yok"}, onay metni=${success}`);
  }
} catch (e) {
  log("WARN", `Ödeme testi: ${String(e.message).slice(0, 120)}`);
}

/* 4) Spot-check specific nav routes users will click */
for (const r of ["/otel", "/giris-yap", "/ucak-bileti", "/kampanyalar"]) {
  const res = await ctx.request.get(BASE + r, { failOnStatusCode: false });
  log(res.status() >= 400 ? "FAIL" : "OK", `route ${r} → HTTP ${res.status()}`);
}

await browser.close();
console.log("\n----- VERIFY SUMMARY -----\n" + out.join("\n"));
