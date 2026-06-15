/**
 * Make the catalogue believable: realistic ratings everywhere, and generated
 * reviews / "what guests liked" / descriptions for hotels that have none.
 *
 * - Deterministic (seeded by hash(slug)) and idempotent (synthetic reviews use
 *   source_key 'synthetic-N'; re-running yields identical values, no dupes).
 * - Keeps REAL scraped data: a hotel that already has real review rows keeps its
 *   rating/count/reviews; we only fix mass "10.00"/"0.00" and fill empty fields.
 * - Review texts are SAMPLED FROM THE REAL POOL, so the translation batch (which
 *   translates distinct review texts) covers synthetic reviews for free.
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run realism
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

const PAGE = 1000;
const CONCURRENCY = 8;

/** Retry a Supabase write a few times on transient errors. Returns error msg or null. */
async function withRetry(fn: () => PromiseLike<{ error: { message: string } | null }>): Promise<string | null> {
  let last = "";
  for (let i = 0; i < 4; i++) {
    const { error } = await fn();
    if (!error) return null;
    last = error.message;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return last;
}

/* ---------------- deterministic RNG ---------------- */
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
function sampleN<T>(rng: () => number, arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  const out: T[] = [];
  const used = new Set<number>();
  let guard = 0;
  while (out.length < n && guard < n * 20) {
    const i = Math.floor(rng() * arr.length);
    if (!used.has(i)) {
      used.add(i);
      out.push(arr[i]);
    }
    guard++;
  }
  return out;
}

/* ---------------- domain helpers (mirror parse.ts) ---------------- */
function ratingLabel(score: number): string {
  if (score >= 9.5) return "Olağanüstü";
  if (score >= 9) return "Mükemmel";
  if (score >= 8.5) return "Harika";
  if (score >= 8) return "Çok İyi";
  if (score >= 7) return "İyi";
  if (score >= 6) return "Memnun Edici";
  return "Değerlendirme";
}

/** Realistic, believable score — booking sites skew high but never all-10. */
function realisticRating(rng: () => number): number {
  const roll = rng();
  let r: number;
  if (roll < 0.05) r = 6.6 + rng() * 1.2; // 6.6–7.8  (5%)
  else if (roll < 0.3) r = 7.8 + rng() * 0.7; // 7.8–8.5  (25%)
  else if (roll < 0.72) r = 8.5 + rng() * 0.6; // 8.5–9.1  (42%)
  else r = 9.1 + rng() * 0.5; // 9.1–9.6  (28%)
  return round1(r);
}

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const FIRST = ["Ahmet","Mehmet","Ayşe","Fatma","Mustafa","Elif","Can","Selin","Murat","Zeynep","Emre","Deniz","Burak","Merve","Ali","Gizem","Onur","Ece","Kerem","Buse","Hakan","Derya","Serkan","Aslı","Tolga","Pınar","Cem","Esra","Barış","Sıla"];
const LAST_INITIAL = ["Y.","K.","D.","A.","T.","S.","Ö.","Ç.","B.","G.","U.","E.","M.","P.","Ş."];
const ROOMS = ["Standart Oda","Deluxe Oda","Aile Odası","Çift Kişilik Oda","Superior Oda","Suit"];
const GUEST_TYPES = ["Çift","Aile","Tatil","İş Gezisi","Arkadaş Grubu","Yalnız Gezginler"];
const CATEGORY_LABELS = ["Temizlik","Konum","Hizmet","Personel","Konfor","Fiyat/Performans","Wi-Fi"];

const AI_LIKES_POOL = [
  "Personelin ilgisi sık sık öne çıkarılıyor",
  "Zengin açık büfe kahvaltı misafirlerin favorisi",
  "Misafirler temiz ve ferah odalardan övgüyle bahsediyor",
  "Deniz manzarası ve özel plaj çok beğeniliyor",
  "Konum ve ulaşım kolaylığı çok beğeniliyor",
  "Havuz ve dinlenme alanları keyifli bulunuyor",
  "Fiyat/performans dengesi sıkça övülüyor",
  "Yemeklerin lezzeti ve çeşitliliği beğeniliyor",
  "Sessiz ve huzurlu ortam misafirleri memnun ediyor",
  "Spa ve wellness imkânları öne çıkıyor",
  "Çocuklar için aktiviteler aileler tarafından seviliyor",
  "Resepsiyonun hızlı ve güler yüzlü hizmeti vurgulanıyor",
  "Odaların konforu ve yatak kalitesi öne çıkıyor",
  "Şehir merkezine yakınlığı avantaj olarak görülüyor",
  "Temizlik standartları yüksek bulunuyor",
  "Otoparkın ücretsiz ve geniş olması memnuniyet yaratıyor",
];

function makeDescription(name: string, city: string, district: string, label: string): string {
  const place = district || city || "";
  return `${name}, ${city || place} bölgesinde ${place} mevkiinde yer alan ${label.toLocaleLowerCase("tr-TR")} puanlı bir tatil tesisidir. Özel plajı, açık ve kapalı havuzları, spa merkezi ve zengin yeme-içme seçenekleriyle konforlu bir konaklama sunar.`;
}

/* ---------------- types ---------------- */
type HotelRow = {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  district: string | null;
  rating: number | null;
  rating_label: string | null;
  review_count: number | null;
  board: string | null;
  description: string | null;
  category_scores: unknown;
  ai_likes: unknown;
};

async function loadRealReviewPool(): Promise<string[]> {
  const pool: string[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("reviews")
      .select("text")
      .not("source_key", "like", "synthetic-%")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`pool: ${error.message}`);
    const rows = (data ?? []) as { text: string | null }[];
    if (rows.length === 0) break;
    for (const r of rows) if (r.text && r.text.trim().length > 15) pool.push(r.text);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  // de-dup keeps memory reasonable & sampling varied
  return [...new Set(pool)];
}

async function loadHotelsWithRealReviews(): Promise<Set<number>> {
  const set = new Set<number>();
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("reviews")
      .select("hotel_id")
      .not("source_key", "like", "synthetic-%")
      .order("hotel_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`real-ids: ${error.message}`);
    const rows = (data ?? []) as { hotel_id: number }[];
    if (rows.length === 0) break;
    for (const r of rows) set.add(r.hotel_id);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return set;
}

function jsonLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

async function main() {
  console.log("Loading real review pool & hotels-with-reviews…");
  const [pool, realHotels] = await Promise.all([
    loadRealReviewPool(),
    loadHotelsWithRealReviews(),
  ]);
  console.log(`Pool: ${pool.length} distinct reviews. Hotels with real reviews: ${realHotels.size}.`);
  if (pool.length === 0) throw new Error("empty review pool — aborting");

  const limit = pLimit(CONCURRENCY);
  let hotelsUpdated = 0;
  let reviewsInserted = 0;
  let from = 0;

  for (;;) {
    const { data, error } = await sb
      .from("hotels")
      .select("id,slug,name,city,district,rating,rating_label,review_count,board,description,category_scores,ai_likes")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`hotels page: ${error.message}`);
    const hotels = (data ?? []) as HotelRow[];
    if (hotels.length === 0) break;

    const tasks: Promise<void>[] = [];

    for (const h of hotels) {
      const rng = mulberry32(hash32(h.slug || String(h.id)));
      const hasReal = realHotels.has(h.id);
      const curRating = Number(h.rating ?? 0);

      const patch: Record<string, unknown> = {};

      // Rating: fix 0 / mass-10 / missing-data hotels; keep genuine ratings.
      let rating = curRating;
      if (!hasReal || curRating === 0 || curRating >= 9.95) {
        rating = realisticRating(rng);
        patch.rating = rating;
        patch.rating_label = ratingLabel(rating);
      }

      // Review count for hotels without real reviews.
      if (!hasReal && (!h.review_count || h.review_count === 0)) {
        patch.review_count = 18 + Math.floor(rng() * rng() * 1382); // 18–1400, skewed low
      }

      // Category scores if missing.
      if (jsonLen(h.category_scores) === 0) {
        patch.category_scores = CATEGORY_LABELS.map((label) => ({
          label,
          score: round1(clamp(rating + (rng() - 0.5) * 0.9, 6, 9.9)),
        }));
      }

      // "What guests liked" bullets if missing.
      if (jsonLen(h.ai_likes) === 0) {
        patch.ai_likes = sampleN(rng, AI_LIKES_POOL, 3 + Math.floor(rng() * 2)); // 3–4
      }

      // Description if missing (template form → translates for free).
      if (!h.description || h.description.trim().length === 0) {
        patch.description = makeDescription(
          h.name,
          h.city ?? "",
          h.district ?? "",
          patch.rating_label ? String(patch.rating_label) : h.rating_label || ratingLabel(rating),
        );
      }

      if (Object.keys(patch).length > 0) {
        tasks.push(
          limit(async () => {
            const e = await withRetry(() => sb.from("hotels").update(patch).eq("id", h.id));
            if (e) console.warn(`hotel ${h.id} update: ${e}`);
            else hotelsUpdated++;
          }),
        );
      }

      // Synthetic reviews for hotels without real ones.
      if (!hasReal) {
        const k = 4 + Math.floor(rng() * 5); // 4–8
        const texts = sampleN(rng, pool, k);
        const rows = texts.map((text, i) => {
          const first = pick(rng, FIRST);
          const li = pick(rng, LAST_INITIAL);
          const month = pick(rng, MONTHS);
          const year = rng() < 0.5 ? 2025 : 2026;
          const rv = round1(clamp(rating + (rng() - 0.5) * 1.2, 5.5, 10));
          return {
            hotel_id: h.id,
            initials: (first[0] + li[0]).toLocaleUpperCase("tr-TR"),
            name: `${first} ${li}`,
            review_date: `${month} ${year}`,
            rating: rv,
            text,
            room: pick(rng, ROOMS),
            stay: `${1 + Math.floor(rng() * 6)} gece · ${month} ${year}`,
            guest_type: pick(rng, GUEST_TYPES),
            source_key: `synthetic-${i}`,
          };
        });
        tasks.push(
          limit(async () => {
            const e = await withRetry(() =>
              sb.from("reviews").upsert(rows, { onConflict: "hotel_id,source_key", ignoreDuplicates: false }),
            );
            if (e) console.warn(`hotel ${h.id} reviews: ${e}`);
            else reviewsInserted += rows.length;
          }),
        );
      }
    }

    await Promise.all(tasks);
    from += PAGE;
    console.log(`…processed ${from} hotels | updated ${hotelsUpdated} | reviews +${reviewsInserted}`);
  }

  console.log(`Done. Hotels updated: ${hotelsUpdated}. Synthetic reviews upserted: ${reviewsInserted}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
