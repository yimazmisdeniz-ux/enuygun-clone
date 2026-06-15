import { PRICE_WINDOW } from "../config.js";

/* ---------- helpers ---------- */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: "…",
  ndash: "–", mdash: "—", uuml: "ü", Uuml: "Ü", ouml: "ö", Ouml: "Ö",
  ccedil: "ç", Ccedil: "Ç", auml: "ä", Auml: "Ä", szlig: "ß",
  scaron: "š", otilde: "õ", otimes: "×", deg: "°", trade: "™",
  copy: "©", reg: "®", euro: "€", pound: "£",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) =>
      name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : m,
    );
}

export function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic 0..1 pseudo-random seeded by an integer (no Math.random). */
function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function ratingLabel(score: number): string {
  if (score >= 9.5) return "Olağanüstü";
  if (score >= 9) return "Mükemmel";
  if (score >= 8.5) return "Harika";
  if (score >= 8) return "Çok İyi";
  if (score >= 7) return "İyi";
  if (score >= 6) return "Memnun Edici";
  return "Değerlendirme";
}

const BOARD_RULES: [RegExp, string][] = [
  [/ultra/i, "Ultra Her Şey Dahil"],
  [/her\s*[şs]ey\s*dahil/i, "Her Şey Dahil"],
  [/tam\s*pansiyon/i, "Tam Pansiyon"],
  [/yar[ıi]m\s*pansiyon/i, "Yarım Pansiyon"],
  [/kahvalt/i, "Kahvaltı Dahil"],
  [/sadece\s*oda|^oda$/i, "Sadece Oda"],
];

export function detectBoard(text: string): string {
  for (const [re, label] of BOARD_RULES) if (re.test(text)) return label;
  return "Sadece Oda";
}

const AMENITY_STOP =
  /(say[ıi]s[ıi]|y[ıi]l[ıi]|tarihi|saati|kapasitesi|kurulu alan|uzunlu[ğg]u|uzakl[ıi][ğg][ıi]|metre kare)/i;

function cleanAmenities(facilities: any[]): string[] {
  if (!Array.isArray(facilities)) return [];
  const out: string[] = [];
  for (const f of facilities) {
    const d = String(f?.details ?? "").trim();
    if (!d || f?.availability === false) continue;
    if (d.endsWith(":")) continue;
    if (AMENITY_STOP.test(d)) continue;
    out.push(d);
  }
  return [...new Set(out)];
}

function initialsFrom(author: string): string {
  return author
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c) => c && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(c))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const TR_MONTHS_LONG = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** DD-MM-YYYY -> "DD.MM.YYYY"; build stay string from nights + checkInDate. */
function reviewDate(d: string | null): string {
  if (!d) return "";
  return d.replace(/-/g, ".");
}
function reviewStay(nights: number | null, checkIn: string | null): string {
  if (!nights) return "";
  let monthLabel = "";
  if (checkIn) {
    const parts = checkIn.split("-"); // DD-MM-YYYY
    const mi = Number(parts[1]) - 1;
    if (mi >= 0 && mi < 12) monthLabel = ` - ${TR_MONTHS_LONG[mi]} ${parts[2]}`;
  }
  return `${nights} gece${monthLabel}`;
}

/* ---------- price synthesis (representative, NOT live) ---------- */

export function synthHotelPrice(opts: {
  id: number;
  star: number;
  score: number;
  isCyprus: boolean;
  isDomestic: boolean;
}) {
  const { id, star, score, isCyprus } = opts;
  const nights = PRICE_WINDOW.adults; // window is 2 nights (18->20)
  const N = 2;
  const r = seeded(id);
  let base =
    2200 + (star || 3) * 1600 + Math.max(0, (score || 7) - 6.5) * 1400;
  if (isCyprus) base *= 1.55;
  base *= 0.85 + r * 0.5; // ±deterministic variance
  const perNight = Math.round(base / 100) * 100;
  const priceTL = perNight * N;
  const discountPct = 10 + Math.floor(seeded(id + 7) * 36); // 10..45
  const oldPriceTL = Math.round(priceTL / (1 - discountPct / 100) / 100) * 100;
  const roomsLeft = seeded(id + 3) < 0.35 ? 1 + Math.floor(seeded(id + 5) * 5) : undefined;
  return { priceTL, oldPriceTL, discountPct, nights: N, roomsLeft, perNight };
}

/* ---------- main parser ---------- */

export type ParsedHotel = ReturnType<typeof parseHotelDetail>;

export function parseHotelDetail(nd: any) {
  const di = nd?.props?.pageProps?.data?.detailInfo;
  if (!di?.hotel?.details) return null;
  const d = di.hotel.details;
  const id: number = d.id;
  const isCyprus = !!d.isCyprus;
  const isDomestic = !!d.domestic;
  const score = Number(d.reviewScore ?? 0);
  const star = Number(d.starRating ?? 0);

  const addr = d.address ?? {};
  const regionObj = di.region ?? {};
  const regionName = d.cityCenterPointRegionName || regionObj.name || addr.city || "";
  const town = addr.town || addr.subTown || "";
  const district = [town, regionName].filter(Boolean).join(", ");
  const location = [town, addr.city, addr.country].filter(Boolean).join(", ");

  const gallery: string[] = Array.isArray(d.images)
    ? d.images.map((im: any) => im?.url).filter(Boolean)
    : [];

  const amenities = cleanAmenities(d.facilities?.all);

  const categoryScores = Array.isArray(d.reviewsAverage)
    ? d.reviewsAverage.map((c: any) => ({
        label: c.ratingAverageLabel,
        score: Math.round(Number(c.ratingAverage) * 10) / 10,
      }))
    : [];

  // POIs
  const poi = di.poi ?? {};
  const pois: { type: string; name: string; distance: string }[] = [];
  const pushPoi = (arr: any, type: string, max = 2) => {
    if (!Array.isArray(arr)) return;
    for (const p of arr.slice(0, max)) {
      const dist = Number(p?.calculated_distance);
      pois.push({
        type,
        name: p?.name ?? "",
        distance: Number.isFinite(dist) ? `${dist.toFixed(1).replace(".", ",")} km` : "",
      });
    }
  };
  pushPoi(poi.AirPorts, "airport", 1);
  pushPoi(poi.Beach, "beach", 1);
  pushPoi(poi.HistoricalAndTouristicPlaces, "landmark", 1);
  pushPoi(poi.NearPlaces, "landmark", 1);
  if (regionName && Number.isFinite(Number(d.cityCenterPointDistance))) {
    pois.push({
      type: "center",
      name: `${regionName} Merkez`,
      distance: `${Number(d.cityCenterPointDistance)} km`,
    });
  }

  // Rooms
  const rawRooms = Array.isArray(di.hotel.rooms) ? di.hotel.rooms : [];
  const hotelPrice = synthHotelPrice({ id, star, score, isCyprus, isDomestic });
  const rooms = rawRooms.map((rm: any, i: number) => {
    const name = rm?.type?.name ?? "Standart Oda";
    const sizeFac = (rm?.facilities ?? []).find((f: any) =>
      /metre kare/i.test(f?.details ?? ""),
    );
    const sizeM2 = Number(sizeFac?.value) || 0;
    const board = detectBoard(name);
    const images = Array.isArray(rm?.images)
      ? rm.images.map((im: any) => im?.url).filter(Boolean)
      : [];
    // per-room price variance from base
    const mult = 1 + i * 0.14 + seeded(id + i * 13) * 0.1;
    const priceTL = Math.round((hotelPrice.perNight * 2 * mult) / 100) * 100;
    const discountPct = hotelPrice.discountPct;
    const oldPriceTL = Math.round(priceTL / (1 - discountPct / 100) / 100) * 100;
    return {
      name,
      size_m2: sizeM2,
      amenities: cleanAmenities(rm?.facilities),
      images,
      board,
      cancellable: seeded(id + i * 17) > 0.5,
      discount_pct: discountPct,
      old_price_tl: oldPriceTL,
      price_tl: priceTL,
    };
  });

  const board = rooms[0]?.board ?? detectBoard(JSON.stringify(d.hotelConcepts ?? ""));

  // Reviews (first page from SSR)
  const rawReviews = Array.isArray(di.hotelReviewsResult?.reviews)
    ? di.hotelReviewsResult.reviews
    : [];
  const reviews = rawReviews.map((rv: any) => {
    const author = rv?.author ?? "";
    const point = (rv?.ratings ?? []).find((x: any) => x?.ratingType === "point");
    const r = rv?.review ?? {};
    const text = stripHtml(r.text);
    return {
      initials: initialsFrom(author),
      name: author,
      review_date: reviewDate(r.date),
      rating: Number(point?.ratingValue ?? score) / (point ? 1 : 1),
      text,
      room: r.roomName ?? "",
      stay: reviewStay(r.nightsStayed, r.checkInDate),
      guest_type: r.accommodationText ?? "",
      source_key: `${author}|${r.date ?? ""}|${text.slice(0, 24)}`,
    };
  });

  const reviewCount = Number(d.reviewsTotalCount ?? d.commentCount ?? rawReviews.length);

  return {
    id,
    slug: d.slug, // full enuygun slug incl. id (unique)
    name: d.name,
    city: addr.city || regionName,
    district,
    region: regionName,
    region_id: regionObj.id ?? null,
    region_slug: regionObj.slug ?? null,
    location,
    rating: score,
    rating_label: d.reviewScoreCommentText || ratingLabel(score),
    star_rating: star,
    review_count: reviewCount,
    board,
    description: stripHtml(d.description) || stripHtml(di.hotelDescription),
    lat: Number(d.coordinate?.latitude) || null,
    lng: Number(d.coordinate?.longitude) || null,
    total_photos: gallery.length,
    gallery,
    amenities,
    pois,
    category_scores: categoryScores,
    ai_likes: [] as string[],
    discount_pct: hotelPrice.discountPct,
    old_price_tl: hotelPrice.oldPriceTL,
    price_tl: hotelPrice.priceTL,
    nights: hotelPrice.nights,
    rooms_left: hotelPrice.roomsLeft ?? null,
    is_cyprus: isCyprus,
    is_domestic: isDomestic,
    snapshot_checkin: PRICE_WINDOW.checkin,
    snapshot_checkout: PRICE_WINDOW.checkout,
    rooms,
    reviews,
  };
}
