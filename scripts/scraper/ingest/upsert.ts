/**
 * Idempotent ingest: load scraped JSON -> Supabase (service-role key).
 * Hotels upsert on id; rooms delete-replace per hotel; reviews upsert on
 * (hotel_id, source_key); cars upsert on slug.
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run ingest
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { paths } from "../config.js";
import { readJson } from "../lib/checkpoint.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const GALLERY_CAP = 30;
const ROOM_IMG_CAP = 10;
const REVIEW_CAP = 20;

/** Coerce scraped values into the integer columns (some sizes/percent come as
 *  decimals like "23.5"). Preserves null; rounds finite numbers. */
function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : null;
}

function chunk<T>(a: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

async function ingestHotels() {
  const dir = paths.hotelsDetail;
  if (!fs.existsSync(dir)) {
    console.warn("no hotel detail dir; skipping hotels");
    return;
  }
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f));
  console.log(`Ingesting ${files.length} hotels…`);

  let n = 0;
  for (const batch of chunk(files, 400)) {
    const hotels: any[] = [];
    const roomsByHotel: { hotel_id: number; rooms: any[] }[] = [];
    const reviews: any[] = [];

    for (const f of batch) {
      const d = readJson<any>(path.join(dir, f), null);
      if (!d?.id) continue;
      hotels.push({
        id: d.id,
        slug: d.slug,
        name: d.name,
        city: d.city,
        district: d.district,
        region: d.region,
        region_id: toInt(d.region_id),
        region_slug: d.region_slug,
        location: d.location,
        rating: d.rating,
        rating_label: d.rating_label,
        star_rating: toInt(d.star_rating),
        review_count: toInt(d.review_count),
        board: d.board,
        description: d.description,
        lat: d.lat,
        lng: d.lng,
        total_photos: toInt(d.total_photos),
        gallery: (d.gallery ?? []).slice(0, GALLERY_CAP),
        amenities: d.amenities ?? [],
        pois: d.pois ?? [],
        category_scores: d.category_scores ?? [],
        ai_likes: d.ai_likes ?? [],
        discount_pct: toInt(d.discount_pct),
        old_price_tl: d.old_price_tl,
        price_tl: d.price_tl,
        nights: toInt(d.nights),
        rooms_left: toInt(d.rooms_left),
        is_cyprus: d.is_cyprus,
        is_domestic: d.is_domestic,
        snapshot_checkin: d.snapshot_checkin,
        snapshot_checkout: d.snapshot_checkout,
      });
      roomsByHotel.push({
        hotel_id: d.id,
        rooms: (d.rooms ?? []).map((rm: any, i: number) => ({
          hotel_id: d.id,
          name: rm.name,
          size_m2: toInt(rm.size_m2),
          amenities: rm.amenities ?? [],
          images: (rm.images ?? []).slice(0, ROOM_IMG_CAP),
          board: rm.board,
          cancellable: rm.cancellable,
          discount_pct: toInt(rm.discount_pct),
          old_price_tl: rm.old_price_tl,
          price_tl: rm.price_tl,
          sort_order: i,
        })),
      });
      const seen = new Set<string>();
      for (const rv of (d.reviews ?? []).slice(0, REVIEW_CAP)) {
        const key = rv.source_key ?? `${rv.name}|${rv.review_date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        reviews.push({
          hotel_id: d.id,
          initials: rv.initials,
          name: rv.name,
          review_date: rv.review_date,
          rating: rv.rating,
          text: rv.text,
          room: rv.room,
          stay: rv.stay,
          guest_type: rv.guest_type,
          source_key: key,
        });
      }
    }

    // 1) hotels
    let e = (await sb.from("hotels").upsert(hotels, { onConflict: "id" })).error;
    if (e) throw new Error(`hotels upsert: ${e.message}`);

    // 2) rooms — delete then insert per batch of hotel ids
    const hotelIds = roomsByHotel.map((x) => x.hotel_id);
    e = (await sb.from("rooms").delete().in("hotel_id", hotelIds)).error;
    if (e) throw new Error(`rooms delete: ${e.message}`);
    const allRooms = roomsByHotel.flatMap((x) => x.rooms);
    for (const rc of chunk(allRooms, 1000)) {
      e = (await sb.from("rooms").insert(rc)).error;
      if (e) throw new Error(`rooms insert: ${e.message}`);
    }

    // 3) reviews — upsert dedupe
    for (const rc of chunk(reviews, 1000)) {
      e = (
        await sb
          .from("reviews")
          .upsert(rc, { onConflict: "hotel_id,source_key", ignoreDuplicates: true })
      ).error;
      if (e) throw new Error(`reviews upsert: ${e.message}`);
    }

    n += hotels.length;
    console.log(`  …${n}/${files.length} hotels`);
  }
  console.log(`✓ hotels ingested: ${n}`);
}

async function ingestCars() {
  const file = path.join(paths.data, "cars", "all.json");
  const cars = readJson<any[]>(file, []);
  if (!cars.length) {
    console.warn("no cars/all.json; skipping cars");
    return;
  }
  console.log(`Ingesting ${cars.length} cars…`);
  for (const rc of chunk(cars, 500)) {
    const rows = rc.map((c) => ({
      slug: c.slug,
      name: c.name,
      transmission: c.transmission,
      fuel: c.fuel,
      min_age: toInt(c.min_age),
      km_limit: toInt(c.km_limit),
      deposit_tl: c.deposit_tl,
      delivery: c.delivery,
      car_class: c.car_class,
      supplier: c.supplier,
      rating: c.rating,
      review_count: toInt(c.review_count),
      location: c.location,
      daily_tl: c.daily_tl,
      total_tl: c.total_tl,
      free_cancel: c.free_cancel,
      accent: c.accent,
      image: c.image,
    }));
    const e = (await sb.from("cars").upsert(rows, { onConflict: "slug" })).error;
    if (e) throw new Error(`cars upsert: ${e.message}`);
  }
  console.log(`✓ cars ingested: ${cars.length}`);
}

async function main() {
  const only = process.argv[2];
  if (only !== "cars") await ingestHotels();
  if (only !== "hotels") await ingestCars();
  console.log("✓ ingest complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
