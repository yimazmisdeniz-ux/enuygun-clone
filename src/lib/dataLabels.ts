/**
 * Localization for DB-sourced content that comes from FINITE / TEMPLATED sets.
 *
 * The catalogue is scraped in Turkish. A lot of it is a small controlled
 * vocabulary (rating labels, board types, review-category labels, AI summary
 * bullets) or a single generated template (hotel descriptions) — those we can
 * translate perfectly and instantly, no machine-translation needed.
 *
 * Free-form scraped text (real guest reviews, long-tail amenity/POI names) is
 * NOT handled here; that needs the MT cache (see content_translations).
 *
 * Pure module (no next/headers) so it is safe on both server and client.
 * `locale` is the active locale code ("tr" | "en"); only "en" triggers translation.
 */

const RATING_LABEL: Record<string, string> = {
  "Olağanüstü": "Exceptional",
  "Mükemmel": "Excellent",
  "Harika": "Wonderful",
  "Çok İyi": "Very Good",
  "İyi": "Good",
  "Memnun Edici": "Satisfactory",
  "Normal": "Average",
  "Değerlendirme": "Rating",
};

const BOARD: Record<string, string> = {
  "Her Şey Dahil": "All Inclusive",
  "Ultra Her Şey Dahil": "Ultra All Inclusive",
  "Kahvaltı Dahil": "Breakfast Included",
  "Sadece Oda": "Room Only",
  "Tam Pansiyon": "Full Board",
  "Yarım Pansiyon": "Half Board",
};

const CATEGORY: Record<string, string> = {
  "Fiyat/Fayda Dengesi": "Price/Value Balance",
  "Fiyat/Performans": "Price/Performance",
  "Hizmet": "Service",
  "Konfor": "Comfort",
  "Konum": "Location",
  "Personel": "Staff",
  "Temizlik": "Cleanliness",
  "Tesisteki Olanaklar": "Facilities",
  "Wi-Fi": "Wi-Fi",
};

// Curated "what guests liked most" bullets. Kept in sync with the same TR list
// in scripts/seed-realism/realism.ts (which assigns them per hotel).
const AI_LIKES: Record<string, string> = {
  "Deniz manzarası ve özel plaj çok beğeniliyor": "Sea view and private beach are highly praised",
  "Misafirler temiz ve ferah odalardan övgüyle bahsediyor": "Guests praise the clean and spacious rooms",
  "Personelin ilgisi sık sık öne çıkarılıyor": "The attentive staff is frequently highlighted",
  "Zengin açık büfe kahvaltı misafirlerin favorisi": "The rich open-buffet breakfast is a guest favorite",
  "Konum ve ulaşım kolaylığı çok beğeniliyor": "Location and ease of transport are highly appreciated",
  "Havuz ve dinlenme alanları keyifli bulunuyor": "The pool and relaxation areas are found enjoyable",
  "Fiyat/performans dengesi sıkça övülüyor": "The price/value balance is often praised",
  "Yemeklerin lezzeti ve çeşitliliği beğeniliyor": "The taste and variety of the food are appreciated",
  "Sessiz ve huzurlu ortam misafirleri memnun ediyor": "The quiet and peaceful atmosphere pleases guests",
  "Spa ve wellness imkânları öne çıkıyor": "The spa and wellness facilities stand out",
  "Çocuklar için aktiviteler aileler tarafından seviliyor": "Activities for children are loved by families",
  "Resepsiyonun hızlı ve güler yüzlü hizmeti vurgulanıyor": "The fast and friendly reception service is emphasized",
  "Odaların konforu ve yatak kalitesi öne çıkıyor": "Room comfort and bed quality stand out",
  "Şehir merkezine yakınlığı avantaj olarak görülüyor": "Proximity to the city center is seen as an advantage",
  "Temizlik standartları yüksek bulunuyor": "Cleanliness standards are found to be high",
  "Otoparkın ücretsiz ve geniş olması memnuniyet yaratıyor": "Free and spacious parking creates satisfaction",
};

// Most common scraped amenities (covers the large majority of displayed values).
const AMENITIES: Record<string, string> = {
  "Saç kurutma makinesi": "Hair dryer",
  "Klima": "Air conditioning",
  "Ücretsiz kablosuz internet": "Free wireless internet",
  "Özel banyo": "Private bathroom",
  "Havlu verilir": "Towels provided",
  "Terlik": "Slippers",
  "Televizyon": "Television",
  "Günlük kat hizmeti": "Daily housekeeping",
  "Sigara İçilmez": "Non-smoking",
  "Minibar": "Minibar",
  "Sigara İçilmeyen Oda": "Non-smoking room",
  "Uydu TV kanalları": "Satellite TV channels",
  "Ücretsiz banyo/kozmetik ürünleri": "Free toiletries",
  "Elektrikli su ısıtıcısı": "Electric kettle",
  "Oda büyüklüğü (m²)": "Room size (m²)",
  "Telefon": "Telephone",
  "Ücretsiz şişe su": "Free bottled water",
  "Masa": "Desk",
  "Çarşaf takımı verilir": "Bed linen provided",
  "Yatak çarşafı verilir": "Bed sheets provided",
  "Odada emanet kasası": "In-room safe",
  "Ses geçirmez odalar": "Soundproof rooms",
  "Gardırop/Dolap": "Wardrobe/Closet",
  "Gardırop veya dolap": "Wardrobe or closet",
  "LCD TV": "LCD TV",
  "Isıtma": "Heating",
  "Kablosuz İnternet": "Wireless internet",
  "Portatif/ilave yatak yok": "No portable/extra bed",
  "Duş": "Shower",
  "Kaliteli yatak takımı": "Quality bedding",
  "Beşik (çocuk yatağı) yok": "No crib (baby bed)",
  "TV ölçüleri": "TV size",
  "TV boyutu": "TV size",
  "Tuvalet kağıdı": "Toilet paper",
  "Odada klima kumandası (klima)": "In-room A/C control",
  "Şampuan": "Shampoo",
  "Sabun": "Soap",
  "Balkon": "Balcony",
  "Oda servisi (24 saat)": "Room service (24 hours)",
  "Çift Kişilik Yatak": "Double bed",
  "Ütü/ütü masası (istek üzerine)": "Iron/ironing board (on request)",
  "Ütü/ütü masası": "Iron/ironing board",
  "Buzdolabı": "Refrigerator",
  "Havlu": "Towel",
  "Dizüstü bilgisayara uygun çalışma alanı": "Laptop-friendly workspace",
  "Işık/gürültü/ısı sızdırmayan perdeler": "Blackout/soundproof/thermal curtains",
  "Bornoz": "Bathrobe",
  "Çay-Kahve Seti": "Tea/Coffee set",
  "Mutfak eşyası, tabak, çatal ve mutfak gereçleri": "Kitchenware, plates, cutlery and utensils",
  "Kaliteli TV kanalları": "Quality TV channels",
};

// Common generic POI names (exact match).
const POI_NAME: Record<string, string> = {
  "Özel Plaj": "Private Beach",
  "Plaj": "Beach",
  "Şehir Merkezi": "City Center",
  "Şehir merkezi": "City center",
};

// Turkish place-noun suffixes → English, for POI names that aren't exact-mapped
// (e.g. "Ercan Havalimanı" → "Ercan Airport", "Girne Limanı" → "Girne Port").
const POI_SUFFIX: [RegExp, string][] = [
  [/\bHavalimanı\b/g, "Airport"],
  [/\bHavaalanı\b/g, "Airport"],
  [/\bLimanı\b/g, "Port"],
  [/\bPlajı\b/g, "Beach"],
  [/\bMeydanı\b/g, "Square"],
  [/\bMüzesi\b/g, "Museum"],
  [/\bParkı\b/g, "Park"],
  [/\bKalesi\b/g, "Castle"],
  [/\bMerkezi\b/g, "Center"],
];

/**
 * Place names (city / region / district). Most Turkish place names are spelled
 * the same in English and pass through unchanged — we only override the handful
 * with an established English exonym (mostly Cyprus, where the original site
 * targets a KKTC audience). Matching is exact on the trimmed value.
 */
const PLACE: Record<string, string> = {
  "Kıbrıs": "Cyprus",
  "Kuzey Kıbrıs": "Northern Cyprus",
  "Girne": "Kyrenia",
  "Lefkoşa": "Nicosia",
  "Gazimağusa": "Famagusta",
  "Mağusa": "Famagusta",
  "Magosa": "Famagusta",
  "Güzelyurt": "Morphou",
  "Türkiye": "Türkiye",
  "Ege": "Aegean",
  "Akdeniz": "Mediterranean",
  "Karadeniz": "Black Sea",
  "Marmara": "Marmara",
  "Kapadokya": "Cappadocia",
};

/** Localize a place name (city/region/district). English keeps the override
 *  map; everything else (and all of tr) passes through. Compound values like
 *  "Karaoğlanoğlu, Girne" are localized component-by-component so an embedded
 *  exonym (Girne → Kyrenia) isn't missed by the whole-string lookup. */
export function localizePlace(v: string, locale: string, cache?: TrCache): string {
  if (locale !== "en" || !v) return v;
  const whole = PLACE[v.trim()] ?? cache?.get(v);
  if (whole) return whole;
  if (v.includes(",")) {
    return v
      .split(",")
      .map((part) => {
        const t = part.trim();
        return PLACE[t] ?? t;
      })
      .join(", ");
  }
  return v;
}

const ROOM_NAME: Record<string, string> = {
  "Standart Oda": "Standard Room",
  "Standard Oda": "Standard Room",
  "Deluxe Oda": "Deluxe Room",
  "Aile Odası": "Family Room",
  "Çift Kişilik Oda": "Double Room",
  "Tek Kişilik Oda": "Single Room",
  "Suit Oda": "Suite Room",
  "Suit": "Suite",
};

/** Translation cache from content_translations (Turkish text → English). */
export type TrCache = Map<string, string> | undefined;

// Order of resolution for en: MT cache → static vocabulary → original.
function lookup(
  map: Record<string, string>,
  v: string,
  locale: string,
  cache?: TrCache,
): string {
  if (locale !== "en" || !v) return v;
  return cache?.get(v) ?? map[v] ?? v;
}

export function localizeRatingLabel(v: string, locale: string, cache?: TrCache): string {
  return lookup(RATING_LABEL, v, locale, cache);
}
export function localizeBoard(v: string, locale: string, cache?: TrCache): string {
  return lookup(BOARD, v, locale, cache);
}
export function localizeCategory(v: string, locale: string, cache?: TrCache): string {
  return lookup(CATEGORY, v, locale, cache);
}
export function localizeAiLike(v: string, locale: string, cache?: TrCache): string {
  return lookup(AI_LIKES, v, locale, cache);
}
export function localizeAmenity(v: string, locale: string, cache?: TrCache): string {
  return lookup(AMENITIES, v, locale, cache);
}
export function localizeRoomName(v: string, locale: string, cache?: TrCache): string {
  return lookup(ROOM_NAME, v, locale, cache);
}

/** Free-form text (reviews) — MT cache only, else original. */
export function localizeText(v: string, locale: string, cache?: TrCache): string {
  if (locale !== "en" || !v) return v;
  return cache?.get(v) ?? v;
}

export function localizePoiName(v: string, locale: string, cache?: TrCache): string {
  if (locale !== "en" || !v) return v;
  if (cache?.get(v)) return cache.get(v)!;
  if (POI_NAME[v]) return POI_NAME[v];
  let out = v;
  for (const [re, en] of POI_SUFFIX) out = out.replace(re, en);
  return out;
}

/**
 * Hotel descriptions are a single generated template:
 *   "{name}, {city} bölgesinde {district} mevkiinde yer alan {rating} puanlı bir
 *    tatil tesisidir. Özel plajı, açık ve kapalı havuzları, spa merkezi ve
 *    zengin yeme-içme seçenekleriyle konforlu bir konaklama sunar."
 * Parse it and rebuild in English. Non-matching (real) descriptions pass through.
 */
const DESC_RE =
  /^(.*?), (.*?) bölgesinde (.*?) mevkiinde yer alan (.*?) puanlı bir tatil tesisidir\..*$/;

export function localizeDescription(desc: string, locale: string, cache?: TrCache): string {
  if (locale !== "en" || !desc) return desc;
  if (cache?.get(desc)) return cache.get(desc)!;
  const m = desc.match(DESC_RE);
  if (!m) return desc;
  const [, name, city, district, ratingWord] = m;
  const ratingEn = (RATING_LABEL[capitalizeTr(ratingWord)] ?? ratingWord).toLowerCase();
  return `${name} is a ${ratingEn}-rated holiday resort located in the ${district} area of ${city}. With its private beach, indoor and outdoor pools, spa center and rich dining options, it offers a comfortable stay.`;
}

// The template lowercases the rating label; map back via a capitalized form.
function capitalizeTr(s: string): string {
  if (!s) return s;
  const first = s.charAt(0);
  const up = first === "i" ? "İ" : first.toLocaleUpperCase("tr-TR");
  return up + s.slice(1);
}
