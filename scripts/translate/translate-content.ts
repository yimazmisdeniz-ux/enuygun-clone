/**
 * One-time (resumable) machine-translation of free-form Turkish catalogue
 * content into English, cached in public.content_translations. The app then
 * reads only that table — translation APIs are never called per request.
 *
 * Engine: Google Translate free web endpoint (translate.googleapis.com). No API
 *         key, no cost. One request per string; throttled with low concurrency
 *         and exponential backoff so the unofficial endpoint doesn't rate-limit.
 * Sources: hotel descriptions, guest review texts, room names, amenities, POI
 *          names. Finite controlled vocab (rating/board/category/ai_likes) is
 *          handled statically in src/lib/dataLabels.ts and skipped here.
 *
 * Resumable: rows already in content_translations are skipped, so the run can
 * be stopped and restarted (or the engine swapped) without redoing work.
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run translate          (all sources)
 *      npm run translate -- reviews   (one source: descriptions|reviews|rooms|amenities|pois)
 */
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const CONCURRENCY = 8; // parallel requests — backoff handles any rate limiting
const FLUSH_EVERY = 200; // buffer this many translations before a DB upsert
const PAGE = 1000; // DB pagination size

// Finite controlled vocab handled statically in the app — skip translating.
const STATIC_SKIP = new Set<string>([
  "Olağanüstü", "Mükemmel", "Harika", "Çok İyi", "İyi", "Normal", "Değerlendirme",
  "Her Şey Dahil", "Ultra Her Şey Dahil", "Kahvaltı Dahil", "Sadece Oda", "Tam Pansiyon", "Yarım Pansiyon",
  "Fiyat/Fayda Dengesi", "Fiyat/Performans", "Hizmet", "Konfor", "Konum", "Personel", "Temizlik", "Tesisteki Olanaklar", "Wi-Fi",
]);

// Mirrors DESC_RE in src/lib/dataLabels.ts — the single generated description
// template that the app translates by parse-and-rebuild (no MT needed).
const TEMPLATE_DESC_RE =
  /bölgesinde .* mevkiinde yer alan .* puanlı bir tatil tesisidir/;

function isTurkish(s: string): boolean {
  // Skip pure numbers / codes / already-ASCII-trivial tokens to save calls.
  return /[a-zçğıöşü]/i.test(s) && s.trim().length > 1;
}

/** Pull a column across all rows via range pagination, collect distinct values. */
async function collectColumn(
  table: string,
  column: string,
  extract: (row: Record<string, unknown>) => (string | undefined | null)[],
): Promise<Set<string>> {
  const out = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await sb.from(table).select(column).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}.${column}: ${error.message}`);
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    if (rows.length === 0) break;
    for (const row of rows) {
      for (const v of extract(row)) {
        if (v && typeof v === "string" && isTurkish(v) && !STATIC_SKIP.has(v)) out.add(v);
      }
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function loadExistingKeys(): Promise<Set<string>> {
  const out = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("content_translations")
      .select("source_text")
      .eq("locale", "en")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`existing: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) out.add((r as { source_text: string }).source_text);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

/**
 * Translate one Turkish string to English via the free Google endpoint. The
 * response shape is `[[[seg, srcSeg, …], …], …]`; we concatenate the first
 * element of each segment to rebuild the full translation.
 */
async function translateOne(text: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=" +
    encodeURIComponent(text);

  for (let attempt = 0; attempt < 6; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    } catch {
      await sleep(backoff(attempt));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(backoff(attempt));
      continue;
    }
    if (!res.ok) throw new Error(`Google ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const segs: unknown[] = Array.isArray(data?.[0]) ? data[0] : [];
    const out = segs
      .map((s) => (Array.isArray(s) && typeof s[0] === "string" ? s[0] : ""))
      .join("");
    if (!out.trim()) throw new Error("empty translation");
    return out;
  }
  throw new Error("retries exhausted");
}

function backoff(attempt: number): number {
  return Math.min(20_000, 800 * 2 ** attempt) + Math.floor(Math.random() * 400);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const only = process.argv[2];
  console.log("Collecting distinct Turkish strings…");

  const all = new Set<string>();
  const add = (s: Set<string>) => s.forEach((v) => all.add(v));

  if (!only || only === "descriptions")
    add(
      await collectColumn("hotels", "description", (r) => {
        const d = r.description as string;
        // Template descriptions are rebuilt in-app for free — skip them.
        if (d && TEMPLATE_DESC_RE.test(d)) return [];
        return [d];
      }),
    );
  if (!only || only === "pois")
    add(await collectColumn("hotels", "pois", (r) =>
      (Array.isArray(r.pois) ? (r.pois as { name?: string }[]) : []).map((p) => p?.name),
    ));
  if (!only || only === "reviews")
    add(await collectColumn("reviews", "text,room", (r) => [r.text as string, r.room as string]));
  if (!only || only === "rooms")
    add(await collectColumn("rooms", "name,amenities", (r) => [
      r.name as string,
      ...(Array.isArray(r.amenities) ? (r.amenities as string[]) : []),
    ]));
  if (!only || only === "amenities")
    add(await collectColumn("rooms", "amenities", (r) =>
      Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
    ));

  console.log(`Distinct candidate strings: ${all.size}`);
  const existing = await loadExistingKeys();
  console.log(`Already cached: ${existing.size}`);

  const todo = [...all].filter((s) => !existing.has(s));
  console.log(`To translate: ${todo.length}`);
  if (todo.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const limit = pLimit(CONCURRENCY);
  let done = 0;
  let failed = 0;
  let lastLog = 0;
  let buffer: { source_text: string; locale: string; translated: string }[] = [];

  async function flush() {
    if (buffer.length === 0) return;
    const rows = buffer;
    buffer = [];
    const { error } = await sb
      .from("content_translations")
      .upsert(rows, { onConflict: "source_text,locale" });
    if (error) console.warn("upsert failed:", error.message);
  }

  await Promise.all(
    todo.map((text) =>
      limit(async () => {
        try {
          const translated = await translateOne(text);
          buffer.push({ source_text: text, locale: "en", translated });
          done++;
          if (buffer.length >= FLUSH_EVERY) await flush();
        } catch (e) {
          failed++;
          if (failed <= 15) console.warn(`failed: ${(e as Error).message}`);
        }
        if (done + failed - lastLog >= 1000 || done + failed === todo.length) {
          lastLog = done + failed;
          console.log(`progress: ${done} ok / ${failed} failed / ${todo.length} total`);
        }
      }),
    ),
  );
  await flush();

  console.log(`Done. Translated ${done}, failed ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
