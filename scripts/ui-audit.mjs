// UI audit harness — drives the local clone like a real user across both
// flows (hotel + car rental), capturing console/page errors, failed network
// requests, dead links, and broken interactions. Produces a markdown report
// plus step screenshots. Run: `node scripts/ui-audit.mjs` with `npm run dev` up.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const ROOT = process.cwd();
const SHOT_DIR = path.join(ROOT, "docs", "design-references", "audit");
const REPORT_MD = path.join(ROOT, "docs", "research", "UI_AUDIT.md");
const REPORT_JSON = path.join(ROOT, "docs", "research", "ui-audit.json");

const checks = []; // { journey, step, status: ok|warn|fail|info, detail }
const pageEvents = []; // { url, type: console|pageerror|requestfailed|httperror, text }
let shotN = 0;

function record(journey, step, status, detail) {
  checks.push({ journey, step, status, detail });
  const icon = { ok: "OK ", warn: "WARN", fail: "FAIL", info: "..." }[status] ?? "?";
  console.log(`[${icon}] ${journey} :: ${step}${detail ? " — " + detail : ""}`);
}

async function shot(page, name) {
  shotN += 1;
  const file = `${String(shotN).padStart(2, "0")}-${name}.png`;
  try {
    await page.screenshot({ path: path.join(SHOT_DIR, file), fullPage: true });
  } catch (e) {
    /* full-page can fail on huge pages; fall back to viewport */
    try { await page.screenshot({ path: path.join(SHOT_DIR, file) }); } catch {}
  }
  return file;
}

function wireDiagnostics(page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Ignore noisy 3rd-party + favicon noise but keep app errors
      pageEvents.push({ url: page.url(), type: "console", text: t });
    }
  });
  page.on("pageerror", (err) => {
    pageEvents.push({ url: page.url(), type: "pageerror", text: String(err?.message ?? err) });
  });
  page.on("requestfailed", (req) => {
    const f = req.failure();
    pageEvents.push({ url: page.url(), type: "requestfailed", text: `${req.method()} ${req.url()} — ${f?.errorText ?? "failed"}` });
  });
  page.on("response", (res) => {
    const s = res.status();
    if (s >= 400) {
      pageEvents.push({ url: page.url(), type: "httperror", text: `${s} ${res.request().method()} ${res.url()}` });
    }
  });
}

const internalLinks = new Set();
async function collectLinks(page) {
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) {
    if (!h) continue;
    if (h.startsWith("/")) internalLinks.add(h.split("#")[0]);
  }
}

async function safe(journey, step, fn) {
  try {
    await fn();
  } catch (e) {
    record(journey, step, "fail", `threw: ${String(e?.message ?? e).slice(0, 200)}`);
  }
}

async function gotoOk(page, url, journey, step) {
  const res = await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200); // let client hydrate / data settle
  const status = res?.status() ?? 0;
  if (status >= 400) record(journey, step, "fail", `${url} returned HTTP ${status}`);
  else record(journey, step, "ok", `${url} HTTP ${status}`);
  return status;
}

async function main() {
  await mkdir(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "tr-TR" });
  const page = await context.newPage();
  wireDiagnostics(page);

  /* ===================== J1 — Homepage ===================== */
  await safe("Anasayfa", "Yüklenme", async () => {
    await gotoOk(page, "/", "Anasayfa", "GET /");
    await collectLinks(page);
    await shot(page, "home");
    const railCards = await page.locator("a[href^='/otel/']").count();
    record("Anasayfa", "Otel rail", railCards > 0 ? "ok" : "warn", `${railCards} otel linki render edildi`);
  });

  await safe("Anasayfa", "Otel arama (Otel bul)", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const input = page.locator("input[placeholder*='ehir']").first();
    await input.fill("Antalya");
    const before = page.url();
    await page.getByRole("button", { name: /Otel bul/i }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const after = page.url();
    if (after !== before && /\/otel\//.test(after)) record("Anasayfa", "Otel arama", "ok", `→ ${after.replace(BASE, "")}`);
    else record("Anasayfa", "Otel arama", "fail", `navigasyon olmadı (URL: ${after.replace(BASE, "")})`);
  });

  await safe("Anasayfa", "Araç tab → Araç bul", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /^Araç$/ }).click();
    await page.waitForTimeout(300);
    const before = page.url();
    await page.getByRole("button", { name: /Araç bul/i }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const after = page.url();
    if (/\/arac-kiralama\/sonuclar/.test(after)) record("Anasayfa", "Araç arama", "ok", `→ ${after.replace(BASE, "")}`);
    else record("Anasayfa", "Araç arama", "fail", `beklenen sonuclar sayfası değil (URL: ${after.replace(BASE, "")})`);
  });

  await safe("Anasayfa", "Rezervasyon Sorgula butonu", async () => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /Rezervasyon Sorgula/i }).click();
    await page.waitForTimeout(300);
    const before = page.url();
    await page.getByRole("button", { name: /^Sorgula$/ }).click();
    await page.waitForTimeout(800);
    const after = page.url();
    if (after === before) record("Anasayfa", "Rezervasyon Sorgula", "fail", "buton hiçbir şey yapmıyor (onClick yok)");
    else record("Anasayfa", "Rezervasyon Sorgula", "ok", `→ ${after.replace(BASE, "")}`);
  });

  /* ===================== J2 — Hotel results ===================== */
  let detailHref = null;
  await safe("Otel Sonuç", "Liste sayfası", async () => {
    await gotoOk(page, "/otel/kibris-45", "Otel Sonuç", "GET /otel/kibris-45");
    await collectLinks(page);
    await shot(page, "hotel-results");
    const cards = await page.locator("a[href*='/otel/'][href*='?']").count();
    const anyHotelLink = await page.locator("a[href^='/otel/kibris']").first();
    record("Otel Sonuç", "Otel kartları", cards > 0 ? "ok" : "warn", `${cards} kart linki`);
    // capture a detail href to use later
    const hrefs = await page.$$eval("a[href^='/otel/']", (as) => as.map((a) => a.getAttribute("href")));
    detailHref = hrefs.find((h) => h && /\/otel\/[^/]+\/[^/?]+/.test(h)) ?? null;
    record("Otel Sonuç", "Detay linki yakalandı", detailHref ? "ok" : "warn", detailHref ?? "bulunamadı");
  });

  await safe("Otel Sonuç", "Sıralama sekmeleri", async () => {
    const tabs = page.getByRole("button", { name: /Fiyat|Puan|Önerilen|Popüler/i });
    const n = await tabs.count();
    if (n === 0) { record("Otel Sonuç", "Sıralama", "warn", "sıralama sekmesi bulunamadı"); return; }
    const firstNameBefore = await page.locator("h3, h2").first().textContent().catch(() => null);
    await tabs.first().click();
    await page.waitForTimeout(800);
    const firstNameAfter = await page.locator("h3, h2").first().textContent().catch(() => null);
    record("Otel Sonuç", "Sıralama", "info", `${n} sekme; tık sonrası ilk başlık ${firstNameBefore === firstNameAfter ? "değişmedi" : "değişti"}`);
  });

  await safe("Otel Sonuç", "Filtre (checkbox)", async () => {
    const boxes = page.locator("input[type='checkbox']");
    const n = await boxes.count();
    if (n === 0) { record("Otel Sonuç", "Filtreler", "warn", "checkbox filtre yok"); return; }
    const countBefore = await page.locator("a[href*='/otel/'][href*='?']").count();
    await boxes.first().check({ force: true }).catch(() => {});
    await page.waitForTimeout(900);
    const countAfter = await page.locator("a[href*='/otel/'][href*='?']").count();
    record("Otel Sonuç", "Filtreler", "info", `${n} checkbox; sonuç ${countBefore}→${countAfter} (${countBefore === countAfter ? "filtre etkisiz?" : "filtre uygulandı"})`);
  });

  await safe("Otel Sonuç", "Harita modalı", async () => {
    const mapBtn = page.getByRole("button", { name: /Harita/i }).first();
    if (await mapBtn.count() === 0) { record("Otel Sonuç", "Harita", "warn", "harita butonu yok"); return; }
    await mapBtn.click();
    await page.waitForTimeout(1200);
    const modalVisible = await page.locator(".leaflet-container, [role='dialog']").first().isVisible().catch(() => false);
    record("Otel Sonuç", "Harita", modalVisible ? "ok" : "warn", modalVisible ? "modal/harita açıldı" : "harita görünmedi");
    await shot(page, "hotel-map");
    await page.keyboard.press("Escape").catch(() => {});
  });

  /* ===================== J3 — Hotel detail ===================== */
  await safe("Otel Detay", "Detay sayfası", async () => {
    const url = detailHref ?? "/otel/kibris-45/salamis-bay-conti";
    await gotoOk(page, url, "Otel Detay", `GET ${url}`);
    await collectLinks(page);
    await shot(page, "hotel-detail");
    const rooms = await page.getByRole("button", { name: /Seç|Rezervasyon|Odayı/i }).count();
    const galleryImgs = await page.locator("img").count();
    record("Otel Detay", "Galeri görselleri", galleryImgs > 0 ? "ok" : "warn", `${galleryImgs} img`);
    record("Otel Detay", "Oda seç CTA", rooms > 0 ? "ok" : "warn", `${rooms} CTA`);
  });

  await safe("Otel Detay", "Oda seç → rezervasyon", async () => {
    const cta = page.locator("a[href*='/otel/rezervasyon'], a[href*='rezervasyon']").first();
    if (await cta.count() === 0) { record("Otel Detay", "Oda seç akışı", "warn", "rezervasyon linki yok"); return; }
    const href = await cta.getAttribute("href");
    await cta.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    record("Otel Detay", "Oda seç akışı", /rezervasyon/.test(page.url()) ? "ok" : "fail", `→ ${page.url().replace(BASE, "")}`);
  });

  /* ===================== J4 — Reservation ===================== */
  await safe("Rezervasyon", "Misafir formu", async () => {
    if (!/rezervasyon/.test(page.url())) await gotoOk(page, "/otel/rezervasyon", "Rezervasyon", "GET /otel/rezervasyon");
    await shot(page, "reservation");
    const inputs = await page.locator("input, select").count();
    record("Rezervasyon", "Form alanları", inputs > 0 ? "ok" : "warn", `${inputs} alan`);
    // Try fill name/email/phone heuristically
    const text = page.locator("input[type='text'], input:not([type])");
    const tn = await text.count();
    for (let i = 0; i < Math.min(tn, 3); i++) await text.nth(i).fill("Test Kullanıcı").catch(() => {});
    await page.locator("input[type='email']").first().fill("test@example.com").catch(() => {});
    await page.locator("input[type='tel']").first().fill("5551234567").catch(() => {});
  });

  await safe("Rezervasyon", "Devam → ödeme", async () => {
    const cont = page.locator("a[href*='/otel/odeme'], a[href*='odeme']").first();
    if (await cont.count() === 0) {
      const btn = page.getByRole("button", { name: /Devam|Ödeme|İlerle/i }).first();
      if (await btn.count() === 0) { record("Rezervasyon", "Devam", "warn", "devam linki/butonu yok"); return; }
      await btn.click();
    } else {
      await cont.click();
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    record("Rezervasyon", "Devam", /odeme/.test(page.url()) ? "ok" : "warn", `→ ${page.url().replace(BASE, "")}`);
  });

  /* ===================== J5 — Hotel payment ===================== */
  await safe("Ödeme (Otel)", "Ödeme sayfası", async () => {
    if (!/odeme/.test(page.url())) await gotoOk(page, "/otel/odeme", "Ödeme (Otel)", "GET /otel/odeme");
    await shot(page, "hotel-payment");
    const cardInputs = await page.locator("input").count();
    record("Ödeme (Otel)", "Form alanları", cardInputs > 0 ? "ok" : "warn", `${cardInputs} input`);
    // Fill a fake card and attempt pay
    await page.locator("input").nth(0).fill("4111 1111 1111 1111").catch(() => {});
    const payBtn = page.getByRole("button", { name: /Öde|Ödemeyi|Tamamla|Rezervasyonu/i }).first();
    if (await payBtn.count() === 0) { record("Ödeme (Otel)", "Öde butonu", "warn", "öde butonu yok"); return; }
    const before = page.url();
    await payBtn.click();
    await page.waitForTimeout(1200);
    const after = page.url();
    record("Ödeme (Otel)", "Öde butonu", "info", after === before ? "tık sonrası navigasyon/onay yok (mock?)" : `→ ${after.replace(BASE, "")}`);
  });

  /* ===================== J6/7 — Car rental ===================== */
  await safe("Araç", "Ana sayfa", async () => {
    await gotoOk(page, "/arac-kiralama", "Araç", "GET /arac-kiralama");
    await collectLinks(page);
    await shot(page, "rental-home");
  });

  let driverReached = false;
  await safe("Araç Sonuç", "Liste sayfası", async () => {
    await gotoOk(page, "/arac-kiralama/sonuclar", "Araç Sonuç", "GET /arac-kiralama/sonuclar");
    await collectLinks(page);
    await shot(page, "rental-results");
    const cars = await page.locator("a[href*='/arac-kiralama/']").count();
    record("Araç Sonuç", "Araç kartları", cars > 0 ? "ok" : "warn", `${cars} kart/link`);
  });

  await safe("Araç Sonuç", "Araç seç akışı", async () => {
    const cta = page.locator("a[href*='/arac-kiralama/surucu'], a[href*='/arac-kiralama/kiralama'], a[href*='/arac-kiralama/odeme']").first();
    if (await cta.count() === 0) {
      const btn = page.getByRole("link", { name: /Seç|Kirala|Devam/i }).first();
      if (await btn.count() === 0) { record("Araç Sonuç", "Araç seç", "warn", "seç linki yok"); return; }
      await btn.click();
    } else {
      await cta.click();
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    driverReached = /surucu|kiralama|odeme/.test(page.url());
    record("Araç Sonuç", "Araç seç", driverReached ? "ok" : "warn", `→ ${page.url().replace(BASE, "")}`);
  });

  await safe("Araç Sürücü", "Sürücü formu", async () => {
    await gotoOk(page, "/arac-kiralama/surucu", "Araç Sürücü", "GET /arac-kiralama/surucu");
    await shot(page, "rental-driver");
    const inputs = await page.locator("input, select").count();
    record("Araç Sürücü", "Form alanları", inputs > 0 ? "ok" : "warn", `${inputs} alan`);
    const text = page.locator("input[type='text'], input:not([type])");
    const tn = await text.count();
    for (let i = 0; i < Math.min(tn, 3); i++) await text.nth(i).fill("Test").catch(() => {});
    await page.locator("input[type='email']").first().fill("t@e.com").catch(() => {});
    const cont = page.getByRole("button", { name: /Devam|Ödeme|İlerle/i }).first();
    if (await cont.count() > 0) {
      const before = page.url();
      await cont.click();
      await page.waitForTimeout(1200);
      record("Araç Sürücü", "Devam → ödeme", /odeme/.test(page.url()) ? "ok" : "warn", `→ ${page.url().replace(BASE, "")}`);
    } else record("Araç Sürücü", "Devam", "warn", "devam butonu yok");
  });

  await safe("Ödeme (Araç)", "Ödeme sayfası", async () => {
    await gotoOk(page, "/arac-kiralama/odeme", "Ödeme (Araç)", "GET /arac-kiralama/odeme");
    await shot(page, "rental-payment");
    const inputs = await page.locator("input").count();
    record("Ödeme (Araç)", "Form alanları", inputs > 0 ? "ok" : "warn", `${inputs} input`);
  });

  /* ===================== Dead-link crawl ===================== */
  // The nav/footer hrefs that the homepage advertises but may not be routed.
  const NAV = ["/ucak-bileti", "/otel", "/otobus-bileti", "/arac-kiralama", "/transfer",
    "/kampanyalar", "/iletisim", "/bilgi", "/gsm", "/kredi-karti-puanlari", "/enuygun-hediye-kart", "/internet-baglantilari"];
  for (const n of NAV) internalLinks.add(n);

  record("Linkler", "Toplam iç link", "info", `${internalLinks.size} benzersiz iç link toplandı`);
  const deadLinks = [];
  const okLinks = [];
  for (const href of [...internalLinks].sort()) {
    try {
      const res = await context.request.get(BASE + href, { timeout: 20000, failOnStatusCode: false });
      const s = res.status();
      if (s >= 400) deadLinks.push({ href, status: s });
      else okLinks.push({ href, status: s });
    } catch (e) {
      deadLinks.push({ href, status: "ERR" });
    }
  }
  record("Linkler", "Çalışan iç linkler", "ok", `${okLinks.length} link 2xx/3xx`);
  record("Linkler", "Ölü iç linkler (404)", deadLinks.length ? "fail" : "ok", `${deadLinks.length} link 4xx/err`);

  await browser.close();

  /* ===================== Report ===================== */
  const byStatus = (s) => checks.filter((c) => c.status === s);
  const fails = byStatus("fail");
  const warns = byStatus("warn");

  const appErrors = pageEvents.filter((e) => e.type === "pageerror");
  const consoleErrors = pageEvents.filter((e) => e.type === "console");
  const reqFailed = pageEvents.filter((e) => e.type === "requestfailed");
  const httpErrors = pageEvents.filter((e) => e.type === "httperror");

  const lines = [];
  lines.push("# UI Audit — EnUygun Clone\n");
  lines.push(`Çalıştırma tabanı: \`${BASE}\`\n`);
  lines.push("## Özet\n");
  lines.push(`- ✅ OK: ${byStatus("ok").length}`);
  lines.push(`- ⚠️ WARN: ${warns.length}`);
  lines.push(`- ❌ FAIL: ${fails.length}`);
  lines.push(`- Ölü iç linkler: ${deadLinks.length}`);
  lines.push(`- Uncaught page errors: ${appErrors.length}`);
  lines.push(`- Console errors: ${consoleErrors.length}`);
  lines.push(`- Failed requests: ${reqFailed.length}`);
  lines.push(`- HTTP ≥400 responses: ${httpErrors.length}\n`);

  lines.push("## ❌ Kırık / Eksik (FAIL)\n");
  if (fails.length === 0) lines.push("_Yok_\n");
  for (const c of fails) lines.push(`- **${c.journey} → ${c.step}**: ${c.detail}`);
  lines.push("");

  lines.push("## ⚠️ Şüpheli / Yarım (WARN)\n");
  if (warns.length === 0) lines.push("_Yok_\n");
  for (const c of warns) lines.push(`- **${c.journey} → ${c.step}**: ${c.detail}`);
  lines.push("");

  lines.push("## Ölü iç linkler (route yok / 404)\n");
  if (deadLinks.length === 0) lines.push("_Yok_\n");
  for (const d of deadLinks) lines.push(`- \`${d.href}\` → ${d.status}`);
  lines.push("");

  lines.push("## Tüm adımlar\n");
  for (const c of checks) lines.push(`- [${c.status.toUpperCase()}] ${c.journey} → ${c.step}${c.detail ? " — " + c.detail : ""}`);
  lines.push("");

  if (appErrors.length) {
    lines.push("## Uncaught page errors\n");
    for (const e of appErrors.slice(0, 40)) lines.push(`- \`${e.url.replace(BASE, "")}\` — ${e.text}`);
    lines.push("");
  }
  if (consoleErrors.length) {
    lines.push("## Console errors (örnek)\n");
    for (const e of consoleErrors.slice(0, 40)) lines.push(`- \`${e.url.replace(BASE, "")}\` — ${e.text.slice(0, 200)}`);
    lines.push("");
  }
  if (reqFailed.length) {
    lines.push("## Başarısız network istekleri (örnek)\n");
    for (const e of reqFailed.slice(0, 40)) lines.push(`- ${e.text}`);
    lines.push("");
  }
  if (httpErrors.length) {
    lines.push("## HTTP ≥400 yanıtlar (örnek)\n");
    const seen = new Set();
    for (const e of httpErrors) {
      if (seen.has(e.text)) continue; seen.add(e.text);
      lines.push(`- ${e.text}`);
      if (seen.size >= 40) break;
    }
    lines.push("");
  }

  lines.push(`\n_Screenshots: docs/design-references/audit/ (${shotN} adet)_\n`);

  await writeFile(REPORT_MD, lines.join("\n"), "utf8");
  await writeFile(REPORT_JSON, JSON.stringify({ checks, pageEvents, deadLinks, okLinks }, null, 2), "utf8");

  console.log("\n==================== AUDIT DONE ====================");
  console.log(`OK=${byStatus("ok").length} WARN=${warns.length} FAIL=${fails.length} DEAD_LINKS=${deadLinks.length}`);
  console.log(`pageerrors=${appErrors.length} console_errors=${consoleErrors.length} req_failed=${reqFailed.length} http>=400=${httpErrors.length}`);
  console.log(`Report: ${REPORT_MD}`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
