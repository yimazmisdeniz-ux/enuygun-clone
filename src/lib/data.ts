import { getSupabase } from "@/lib/supabase/server";
import {
  rowToHotelRail,
  rowToHotelResult,
  rowToHotelDetail,
} from "@/lib/supabase/map";

export type Hotel = {
  slug: string;
  discountPct: number;
  oldPriceTL: number;
  name: string;
  location: string;
  rating: number;
  ratingLabel: string;
  pension: string;
  priceTL: number;
  image: string;
  reviewCount: number;
};

/** Hotels hidden everywhere — broken/placeholder media (e.g. dead CDN images). */
export const EXCLUDED_HOTEL_SLUGS = ["merit-park", "merit-park-hotel-547506"];

const RAIL_COLS =
  "slug,name,location,region,rating,rating_label,board,price_tl,gallery,review_count";

/**
 * Homepage "recommended" rail — diversified instead of Cyprus-only: top-rated
 * Antalya hotels (the bulk) interleaved with top-rated Cyprus hotels, so the
 * homepage isn't dominated by a single region.
 */
export async function getHotelRail(limit = 12, locale: string = "tr"): Promise<Hotel[]> {
  const sb = getSupabase();
  // ~60% Antalya, remainder Cyprus. Over-fetch a little to absorb excluded slugs.
  const antalyaTake = Math.ceil(limit * 0.6);
  const cyprusTake = limit - antalyaTake;
  const [antalya, cyprus] = await Promise.all([
    sb
      .from("hotels")
      .select(RAIL_COLS)
      .eq("region", "Antalya")
      .order("review_count", { ascending: false })
      .limit(antalyaTake + EXCLUDED_HOTEL_SLUGS.length),
    sb
      .from("hotels")
      .select(RAIL_COLS)
      .eq("is_cyprus", true)
      .order("review_count", { ascending: false })
      .limit(cyprusTake + EXCLUDED_HOTEL_SLUGS.length),
  ]);

  const keep = (rows: { slug: string }[] | null) =>
    (rows ?? []).filter((r) => !EXCLUDED_HOTEL_SLUGS.includes(r.slug));
  const a = keep(antalya.data).slice(0, antalyaTake).map((r) => rowToHotelRail(r, locale));
  const c = keep(cyprus.data).slice(0, cyprusTake).map((r) => rowToHotelRail(r, locale));

  // Interleave, Antalya first, so both regions surface near the top.
  const out: Hotel[] = [];
  for (let i = 0; i < Math.max(a.length, c.length); i++) {
    if (a[i]) out.push(a[i]);
    if (c[i]) out.push(c[i]);
  }
  // Most-reviewed hotels first; rating as tie-breaker.
  out.sort((x, y) => y.reviewCount - x.reviewCount || y.rating - x.rating);
  return out.slice(0, limit);
}

export function formatTL(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 0,
  });
}

/** Two-decimal TL like bookera shows on checkout: "49.500,00" */
export function formatTL2(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** BCP-47 tag for date formatting. Day-month order is preserved for both. */
function dateTag(locale: string): string {
  return locale === "en" ? "en-GB" : "tr-TR";
}

/** "09 Haz Pzt" (tr) / "09 Jun Mon" (en) — day + short month + short weekday. */
export function formatTrDate(iso: string, locale = "tr"): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  const tag = dateTag(locale);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = new Intl.DateTimeFormat(tag, { month: "short" }).format(d);
  const wd = new Intl.DateTimeFormat(tag, { weekday: "short" }).format(d);
  return `${day} ${mon} ${wd}`;
}

/** "06 Haziran 2026" (tr) / "06 June 2026" (en) */
export function formatTrDateLong(iso: string, locale = "tr"): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(dateTag(locale), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "Cumartesi" (tr) / "Saturday" (en) */
export function formatTrWeekday(iso: string, locale = "tr"): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(dateTag(locale), { weekday: "long" }).format(d);
}

/** Whole nights between two ISO dates (min 1). */
export function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(checkin + "T00:00:00").getTime();
  const b = new Date(checkout + "T00:00:00").getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

/**
 * Parse the guest summary display string (e.g. "2 Yetişkin, 1 Çocuk, 2 Oda")
 * back into numeric counts. Falls back to 2 adults / 1 room when absent or
 * unparseable, matching the search form defaults.
 */
export function parseGuests(guests?: string): { adults: number; roomCount: number } {
  const adults = guests?.match(/(\d+)\s*Yetişkin/)?.[1];
  const rooms = guests?.match(/(\d+)\s*Oda/)?.[1];
  return {
    adults: adults ? Math.max(1, Number(adults)) : DEFAULTS.adults,
    roomCount: rooms ? Math.max(1, Number(rooms)) : DEFAULTS.roomCount,
  };
}

/**
 * Build a hotel-detail URL under the current listing location, forwarding the
 * active search context (dates + guests) so the detail and booking pages can
 * honour the user's selection instead of falling back to defaults.
 */
export function buildHotelHref(
  location: string,
  slug: string,
  opts?: { checkin?: string; checkout?: string; guests?: string },
): string {
  const params = new URLSearchParams();
  if (opts?.checkin) params.set("checkin", opts.checkin);
  if (opts?.checkout) params.set("checkout", opts.checkout);
  if (opts?.guests) params.set("guests", opts.guests);
  const qs = params.toString();
  return `/otel/${location}/${slug}${qs ? `?${qs}` : ""}`;
}

export type HotelResult = {
  slug: string;
  name: string;
  district: string;
  region: string;
  board: string;
  rating: number;
  ratingLabel: string;
  reviewCount: number;
  images: string[];
  discountPct: number;
  oldPriceTL: number;
  priceTL: number;
  nights: number;
  roomsLeft?: number;
  reviewer?: { name: string; date: string };
  lat?: number;
  lng?: number;
};

export type LatLng = { lat: number; lng: number };

/** Approx KKTC coordinates per hotel slug — used for map markers. */
export const HOTEL_COORDS: Record<string, LatLng> = {
  "salamis-bay-conti": { lat: 35.1235, lng: 33.942 },
  "concorde-aria": { lat: 35.3402, lng: 33.3185 },
  "merit-royal-diamond": { lat: 35.3475, lng: 33.298 },
  "concorde-luxury-resort": { lat: 35.401, lng: 34.002 },
  "merit-park": { lat: 35.356, lng: 33.2705 },
  "grand-pasha-kyrenia": { lat: 35.336, lng: 33.319 },
  "vuni-palace": { lat: 35.3415, lng: 33.3055 },
  acapulco: { lat: 35.3705, lng: 33.364 },
  "pia-bella": { lat: 35.3348, lng: 33.3225 },
  "riverside-garden": { lat: 35.33, lng: 33.251 },
  "karpaz-gate-marina": { lat: 35.599, lng: 34.376 },
  "merit-lefkosa": { lat: 35.1905, lng: 33.364 },
  "bahceli-beach": { lat: 35.345, lng: 33.215 },
};

const GIRNE_CENTER: LatLng = { lat: 35.3416, lng: 33.3192 };

export function getHotelCoords(slug: string): LatLng {
  return HOTEL_COORDS[slug] ?? GIRNE_CENTER;
}

export function priceLabel(n: number): string {
  return formatTL(n) + " TL";
}

/** Fold Turkish letters to ASCII, lowercase, dash-join — for route slugs. */
const TR_FOLD: Record<string, string> = {
  İ: "i", I: "i", ı: "i", Ş: "s", ş: "s", Ğ: "g", ğ: "g",
  Ç: "c", ç: "c", Ö: "o", ö: "o", Ü: "u", ü: "u",
};
export function slugifyTr(s: string): string {
  return s
    .trim()
    .replace(/[İIıŞşĞğÇçÖöÜü]/g, (c) => TR_FOLD[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lowercase + strip Turkish diacritics, keeping spaces — for fuzzy matching. */
export function foldTr(s: string): string {
  return s
    .replace(/[İIıŞşĞğÇçÖöÜü]/g, (c) => TR_FOLD[c] ?? c)
    .toLowerCase()
    .trim();
}

/**
 * ASCII route slug → real Turkish region/city name, for regions whose Turkish
 * characters (İ, ş, ğ, ç…) won't match an ASCII `ilike`. Pure-ASCII regions
 * (Antalya, Bodrum…) already match directly, so they're intentionally omitted.
 */
const TR_SLUG_TO_NAME: Record<string, string> = {
  istanbul: "İstanbul", izmir: "İzmir", mugla: "Muğla", canakkale: "Çanakkale",
  nevsehir: "Nevşehir", balikesir: "Balıkesir", alacati: "Alaçatı", sisli: "Şişli",
  kas: "Kaş", aydin: "Aydın", cankaya: "Çankaya", oludeniz: "Ölüdeniz",
  cesme: "Çeşme", kusadasi: "Kuşadası", ayvalik: "Ayvalık", muratpasa: "Muratpaşa",
  beyoglu: "Beyoğlu", gumbet: "Gümbet", eskisehir: "Eskişehir", konyaalti: "Konyaaltı",
  tekirdag: "Tekirdağ", karabuk: "Karabük", goreme: "Göreme", sanliurfa: "Şanlıurfa",
  kaleici: "Kaleiçi", "marmaris-icmeler": "Marmaris İçmeler", iskele: "İskele",
  besiktas: "Beşiktaş", bartin: "Bartın", datca: "Datça", urgup: "Ürgüp",
  bakirkoy: "Bakırköy", kadikoy: "Kadıköy", altinkum: "Altınkum", yalikavak: "Yalıkavak",
  diyarbakir: "Diyarbakır", cirali: "Çıralı", turkiye: "Türkiye", konakli: "Konaklı",
  selcuk: "Selçuk",
};

/** Human display name for a route slug — real Turkish name when known,
 *  else a title-cased version of the slug ("antalya" → "Antalya"). */
export function regionDisplayName(slug: string): string {
  const base = slugifyTr(slug).replace(/-\d+$/, "").replace(/-otelleri$/, "");
  if (TR_SLUG_TO_NAME[base]) return TR_SLUG_TO_NAME[base];
  return base
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Search results for a listing page. `location` is the route segment
 * (e.g. "kibris-45", "antalya", "balayi-otelleri"). Falls back to top-rated
 * Cyprus hotels so the page always renders meaningful results.
 */
export async function getHotelResults(location?: string, locale: string = "tr"): Promise<HotelResult[]> {
  const sb = getSupabase();
  const cols =
    "slug,name,district,region,board,rating,rating_label,review_count,gallery,discount_pct,old_price_tl,price_tl,nights,rooms_left,lat,lng,reviews(name,review_date)";
  let q = sb.from("hotels").select(cols).order("review_count", { ascending: false }).limit(60);

  // Normalise whatever we're given (route slug OR raw typed text like
  // "İstanbul") to a clean ASCII slug so Turkish input matches consistently.
  const loc = slugifyTr(location ?? "");
  const baseSlug = loc.replace(/-\d+$/, "").replace(/-otelleri$/, "");
  const term = baseSlug.replace(/-/g, " ").trim();

  if (!loc || loc.includes("kibris")) {
    q = q.eq("is_cyprus", true);
  } else if (baseSlug === "turkiye" || baseSlug === "turkey") {
    // Country-wide search: "Türkiye" isn't a region in the data, so match every
    // domestic hotel (everything that isn't the separate Cyprus listing).
    q = q.eq("is_cyprus", false);
  } else if (term) {
    // search_text is ASCII-folded (İstanbul→istanbul, Çıralı→cirali), so the
    // ASCII slug term matches every region/city/district — including the
    // long-tail Turkish-character ones a static map would miss.
    q = q.ilike("search_text", `%${term}%`);
  }

  let { data } = await q;
  if (!data || data.length === 0) {
    // fallback: top-rated Cyprus hotels
    ({ data } = await sb
      .from("hotels")
      .select(cols)
      .eq("is_cyprus", true)
      .order("review_count", { ascending: false })
      .limit(40));
  }
  return (data ?? [])
    .filter((r) => !EXCLUDED_HOTEL_SLUGS.includes(r.slug))
    .map((r) => rowToHotelResult(r, locale));
}

export const searchTitles: Record<string, string> = {
  "kibris-45": "Kıbrıs Otelleri",
  "erken-rezervasyon": "Erken Rezervasyon Otelleri",
  "balayi-otelleri": "Balayı Otelleri",
  "her-sey-dahil-antalya-otelleri": "Her Şey Dahil Antalya Otelleri",
};

export type Region = {
  slug: string;
  name: string;
  hotelCount: number;
  image: string;
};

export const domesticRegions: Region[] = [
  { slug: "istanbul", name: "İstanbul", hotelCount: 2392, image: "/images/regions/istanbul.jpg" },
  { slug: "mugla", name: "Muğla", hotelCount: 1616, image: "/images/regions/mugla.webp" },
  { slug: "ankara", name: "Ankara", hotelCount: 282, image: "/images/regions/ankara.jpg" },
  { slug: "antalya", name: "Antalya", hotelCount: 1904, image: "/images/regions/antalya.jpeg" },
  { slug: "izmir", name: "İzmir", hotelCount: 1264, image: "/images/regions/izmir.webp" },
  { slug: "bursa", name: "Bursa", hotelCount: 196, image: "/images/regions/bursa.webp" },
  { slug: "samsun", name: "Samsun", hotelCount: 71, image: "/images/regions/samsun.jpeg" },
  { slug: "balikesir", name: "Balıkesir", hotelCount: 532, image: "/images/regions/balikesir.webp" },
];

/** Display name + ASCII route slug (Turkish chars transliterated). */
export const microRegions: { name: string; slug: string }[] = [
  { name: "Muratpaşa", slug: "muratpasa" },
  { name: "Bodrum", slug: "bodrum" },
  { name: "Marmaris", slug: "marmaris" },
  { name: "Çeşme", slug: "cesme" },
  { name: "Alanya", slug: "alanya" },
  { name: "Alaçatı", slug: "alacati" },
  { name: "Fethiye", slug: "fethiye" },
  { name: "Lara", slug: "lara" },
  { name: "Ayvalık", slug: "ayvalik" },
  { name: "Sapanca", slug: "sapanca" },
  { name: "Ölüdeniz", slug: "oludeniz" },
  { name: "Şile", slug: "sile" },
  { name: "Kemer", slug: "kemer" },
  { name: "Kuşadası", slug: "kusadasi" },
];

export const internationalRegions: Region[] = [
  { slug: "kibris", name: "Kıbrıs", hotelCount: 312, image: "/images/regions/kibris.webp" },
  { slug: "batum", name: "Batum", hotelCount: 187, image: "/images/regions/batum.webp" },
  { slug: "dubai", name: "Dubai", hotelCount: 421, image: "/images/regions/dubai.webp" },
  { slug: "paris", name: "Paris", hotelCount: 285, image: "/images/regions/paris.webp" },
];

/** Popular Regions section — flat list shown on the homepage.
 *  Only regions that actually resolve to hotels in the DB (turkiye→domestic,
 *  kibris→cyprus, antalya/mugla/izmir→search_text). Dubai/Paris/Batum removed:
 *  no matching hotels, so their listing fell back to unrelated Cyprus results. */
export const popularRegions: Region[] = [
  { slug: "turkiye", name: "Türkiye", hotelCount: 8542, image: "/images/regions/istanbul.jpg" },
  { slug: "antalya", name: "Antalya", hotelCount: 1904, image: "/images/regions/antalya.jpeg" },
  { slug: "mugla", name: "Muğla", hotelCount: 1616, image: "/images/regions/mugla.webp" },
  { slug: "bodrum", name: "Bodrum", hotelCount: 1187, image: "/images/regions/bodrum.jpg" },
  { slug: "izmir", name: "İzmir", hotelCount: 1264, image: "/images/regions/izmir.webp" },
  { slug: "kibris", name: "Kıbrıs", hotelCount: 312, image: "/images/regions/kibris.webp" },
];

export type HolidayTheme = {
  slug: string;
  name: string;
  icon: string;
};

export const holidayThemes: HolidayTheme[] = [
  { slug: "bungalov", name: "Bungalov oteller", icon: "/images/themes/bungalov.svg" },
  { slug: "termal", name: "Termal oteller", icon: "/images/themes/termal.svg" },
  { slug: "tatil-koyu", name: "Tatil köyleri", icon: "/images/themes/tatil-koyu.svg" },
  { slug: "pansiyon", name: "Pansiyonlar", icon: "/images/themes/pansiyon.svg" },
  { slug: "butik", name: "Butik oteller", icon: "/images/themes/butik.svg" },
  { slug: "5-yildiz", name: "5 yıldızlı oteller", icon: "/images/themes/5-yildiz.svg" },
  { slug: "hersey-dahil", name: "Her şey dahil oteller", icon: "/images/themes/hersey-dahil.svg" },
  { slug: "islami", name: "Muhafazakar oteller", icon: "/images/themes/islami.svg" },
  { slug: "balayi", name: "Balayı otelleri", icon: "/images/themes/balayi-ciftlerine-uygun.svg" },
  { slug: "cocuk-dostu", name: "Çocuk dostu oteller", icon: "/images/themes/cocuk-dostu.svg" },
  { slug: "denize-sifir", name: "Denize sıfır oteller", icon: "/images/themes/denize-sifir.svg" },
  { slug: "aquapark", name: "Aquaparklı oteller", icon: "/images/themes/aquapark.svg" },
];

export type FAQItem = { q: string; a: string };

export const faqItems: FAQItem[] = [
  {
    q: "BOOKERA en uygun otel fiyatlarını nasıl sunuyor?",
    a: "Türkiye'nin seyahat sitesi BOOKERA, her bütçeye uygun otel fiyatları ile konaklama yapmak istediğiniz destinasyon ve tarihe göre binlerce otel seçeneğini karşılaştırır ve listeler. Listelenen otelleri fiyata göre artan ya da azalan, puan, merkeze yakınlık ve ilgiye göre sıralayabilirsiniz. Konuk değerlendirmesi, pansiyon tipi, rezervasyon iptali, tema gibi birçok filtreden yararlanarak kendinize en uygun oteli seçebilirsiniz.",
  },
  {
    q: "BOOKERA'da otel rezervasyonumu nasıl yapabilirim?",
    a: "BOOKERA'dan otel rezervasyonu yapmak için web sitemizi veya mobil uygulamamızı kullanabilirsiniz. Konaklamak istediğiniz yeri ve tarihi seçerek binlerce tesisi karşılaştırabilir, size en uygun oteli ve odayı seçerek güvenle rezervasyon yapabilirsiniz. BOOKERA'a üye olarak saniyeler içinde işleminizi tamamlayabilirsiniz.",
  },
  {
    q: "BOOKERA'da yurt dışı otel rezervasyonu yapabilir miyim?",
    a: "BOOKERA'dan dünyanın dört bir yanında hizmet veren binlerce yurt dışı otelini konaklama yapacağınız yer ve tarihe göre listeleyebilirsiniz. Çok sayıda tema seçeneği içinden size uygun oteli tercih ederek kolay ve güvenilir şekilde rezervasyon yaptırabilirsiniz.",
  },
  {
    q: "Tesis ve oda bilgileri hakkında daha fazla bilgi alabilir miyim?",
    a: "Seçtiğiniz tesis ve oda hakkında daha fazla bilgi almak isterseniz 0850 811 90 90 numaralı çağrı merkezimiz üzerinden seyahat danışmanlarımızla iletişime geçebilirsiniz.",
  },
  {
    q: "Otel rezervasyonu yaparken nelere dikkat etmeliyim?",
    a: "Otel rezervasyonu yaparken konaklama sırasında herhangi bir sıkıntı yaşamamak için dikkat etmeniz gereken bazı noktalar bulunur. Otelin konumu ve yıldızı seçim yaparken etkili olan kriterlerin başında gelir. Ayrıca ek ücretler, evcil hayvan politikası, transfer ve restoran gibi hizmetler rezervasyon sırasında göz önünde bulundurmanız gerekenler arasında yer alır.",
  },
  {
    q: "BOOKERA'da otel rezervasyonumu iptal edebilir miyim?",
    a: "BOOKERA'dan otel rezervasyonu yaparken filtre kısmında yer alan rezervasyon koşulları bölümünde ücretsiz iptal seçeneği bulunur. Bu filtreyi seçerek yapacağınız ücretsiz iptal kapsamındaki otel rezervasyonlarınızı iptal edebilirsiniz. Bunun dışındaki tüm iptal ve değişiklik işlemleriniz için 0850 811 90 90 numaralı ücretsiz çağrı merkezimizi arayabilirsiniz.",
  },
  {
    q: "BOOKERA işlemlerimin güvenliğini nasıl sağlıyor?",
    a: "BOOKERA üzerinden yaptığınız işlemlerin tamamı SSL sertifikası ile güvence altında. Ayrıca otel rezervasyonu yaparken ödeme adımında 3D Security güvencesi sunulur. Tüm ödeme işlemleriniz dünyanın önde gelen güvenlik sertifikası şirketi DigiCert ile koruma altına alınır.",
  },
];

export const whyUsItems = [
  { title: "Sayısız seçenek", desc: "Bookera ile 1000'lerce otel tercihlerine göre filtreleyerek saniyeler içinde sana en uygun oteli bulabilirsin." },
  { title: "En uygun otel", desc: "Kafanızı karıştıran fiyat ve hizmet seçenekleri arasında kaybolmayın, tercihlerinizi belirleyip size en uygun otelde odanızı hemen ayırtın." },
  { title: "Hızlı ve kolay", desc: "Bookera sayesinde aradığın oteli bulmak için sadece birkaç saniyeye ihtiyacın var." },
  { title: "Güvenle al", desc: "Tüm ödeme işlemlerin, dünyanın önde gelen güvenlik sertifikası şirketi GlobalSign koruması altındadır." },
];

export const themedRails = [
  { title: "En iyi spa otelleri BOOKERA'da", slug: "spa" },
  { title: "En iyi erken rezervasyon otelleri BOOKERA'da", slug: "erken-rezervasyon" },
  { title: "En iyi çocuk dostu oteller BOOKERA'da", slug: "cocuk-dostu" },
  { title: "En iyi muhafazakar oteller BOOKERA'da", slug: "muhafazakar" },
  { title: "En iyi balayı otelleri BOOKERA'da", slug: "balayi" },
  { title: "En iyi bungalov oteller BOOKERA'da", slug: "bungalov" },
];

/* Footer link grid — only verticals that exist on this site. Labels come from
 * the `Home.footer.columns.{key}` messages; entries here are the hrefs. */
export const footerColumns = [
  {
    key: "hotel",
    links: [
      "/otel/kibris-45",
      "/otel/istanbul",
      "/otel/antalya",
      "/otel/bodrum",
      "/otel/izmir",
      "/otel/marmaris",
      "/otel/fethiye",
    ],
  },
  {
    key: "car",
    links: ["/arac-kiralama"],
  },
];

/* Listing-page slugs; labels come from `Home.footer.regions/themes.{i}`. */
export const footerTopRegions = ["alanya-otelleri", "cesme-otelleri", "kemer-otelleri", "side-otelleri", "didim-otelleri", "kibris-45", "uludag-otelleri", "agva-otelleri"];
export const footerTopThemes = ["balayi-otelleri", "termal-otelleri", "erken-rezervasyon", "muhafazakar-otelleri", "spa-otelleri", "cocuk-dostu-otelleri", "bungalov-otelleri", "kayak-otelleri"];

export const topNavLinks = [
  { label: "Uçak Bileti", href: "/ucak-bileti" },
  { label: "Otel", href: "/otel" },
  { label: "Otobüs", href: "/otobus-bileti" },
  { label: "Araç", href: "/arac-kiralama" },
  { label: "Transfer", href: "/transfer" },
];

export const popularSearchChips = [
  { label: "Erken Rezervasyon Otelleri", href: "/otel/erken-rezervasyon" },
  { label: "Kıbrıs Otelleri", href: "/otel/kibris-45" },
  { label: "Balayı Otelleri", href: "/otel/balayi-otelleri" },
  { label: "Her Şey Dahil Antalya Otelleri", href: "/otel/her-sey-dahil-antalya-otelleri" },
];

/* ---------------- Hotel detail ---------------- */

export type RoomOption = {
  board: string;
  cancellable: boolean;
  discountPct: number;
  oldPriceTL: number;
  priceTL: number;
};

export type Room = {
  name: string;
  sizeM2: number;
  amenities: string[];
  images: string[];
  option: RoomOption;
};

export type Review = {
  initials: string;
  name: string;
  date: string;
  rating: number;
  text: string;
  room: string;
  stay: string;
  guestType: string;
};

export type CategoryScore = { label: string; score: number };

export type POI = {
  type: "landmark" | "airport" | "beach" | "center";
  name: string;
  distance: string;
};

const POI_OFFSETS: Record<POI["type"], LatLng> = {
  airport: { lat: -0.02, lng: -0.06 },
  beach: { lat: -0.012, lng: 0.012 },
  center: { lat: 0.015, lng: -0.01 },
  landmark: { lat: 0.01, lng: 0.022 },
};

/** Deterministic nearby coord for a POI relative to the hotel center. */
export function poiCoords(center: LatLng, type: POI["type"]): LatLng {
  const o = POI_OFFSETS[type];
  return { lat: center.lat + o.lat, lng: center.lng + o.lng };
}

export type HotelDetail = {
  slug: string;
  name: string;
  city: string;
  region: string;
  district: string;
  rating: number;
  ratingLabel: string;
  reviewCount: number;
  board: string;
  /** Number of nights the stored room prices represent (price baseline). */
  baseNights: number;
  gallery: string[];
  totalPhotos: number;
  description: string;
  pois: POI[];
  rooms: Room[];
  categoryScores: CategoryScore[];
  aiLikes: string[];
  reviews: Review[];
  lat?: number;
  lng?: number;
};

/** Full hotel detail (info + rooms + reviews) from Supabase. */
/**
 * Load EN translations for a set of Turkish strings from the MT cache. Reads
 * only our own table (never an external API at request time). Returns an empty
 * map for locale=tr or when the cache is empty, so callers fall back to the
 * static vocabulary / original text.
 */
async function getTranslationMap(
  texts: (string | undefined | null)[],
  locale: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (locale !== "en") return map;
  const uniq = [...new Set(texts.filter((t): t is string => !!t))];
  if (uniq.length === 0) return map;
  try {
    const sb = getSupabase();
    const CHUNK = 300;
    for (let i = 0; i < uniq.length; i += CHUNK) {
      const { data } = await sb
        .from("content_translations")
        .select("source_text,translated")
        .eq("locale", "en")
        .in("source_text", uniq.slice(i, i + CHUNK));
      for (const row of data ?? []) map.set(row.source_text, row.translated);
    }
  } catch {
    // table missing / network — fall through to static + original text.
  }
  return map;
}

export async function getHotelDetail(slug: string, locale: string = "tr"): Promise<HotelDetail | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("hotels")
    .select("*, rooms(*), reviews(*)")
    .eq("slug", slug)
    .maybeSingle();
  // Surface real DB errors instead of silently masking them as a 404.
  if (error) console.error(`getHotelDetail(${slug}) failed:`, error.message);
  if (error || !data) return null;

  // Preload MT translations for the free-form strings on this page (en only).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const strings: (string | undefined)[] = [
    d.description,
    ...arrField(d.reviews).map((rv) => rv?.text),
    ...arrField(d.reviews).map((rv) => rv?.room),
    ...arrField(d.rooms).flatMap((rm) => [rm?.name, ...arrField(rm?.amenities)]),
    ...arrField(d.pois).map((p) => p?.name),
  ];
  const cache = await getTranslationMap(strings, locale);
  return rowToHotelDetail(data, locale, cache);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrField(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

/** Back-compat alias for the previous loader name. */
export const getHotelDetailOrBuild = getHotelDetail;

/* ---------------- Booking / checkout ---------------- */

export type BookingContext = {
  hotel: HotelDetail;
  room: Room;
  gallery: string[];
  checkin: string;
  checkout: string;
  nights: number;
  adults: number;
  roomCount: number;
  /** Pre-discount total (Konaklama) */
  oldPriceTL: number;
  /** Discount amount (positive) */
  discountTL: number;
  /** Payable total (Ödenecek Tutar) */
  priceTL: number;
};

const DEFAULTS = {
  checkin: "2026-06-06",
  checkout: "2026-06-09",
  adults: 2,
  roomCount: 1,
};

type RawParams = Record<string, string | string[] | undefined>;

function pick(sp: RawParams, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Resolves checkout state from URL search params, falling back to the
 * Salamis Bay Conti default so the page always renders something faithful.
 */
export async function getBookingContext(sp: RawParams, locale: string = "tr"): Promise<BookingContext | null> {
  let slug = pick(sp, "slug");
  if (!slug) {
    const top = await getHotelResults(undefined, locale);
    slug = top[0]?.slug;
  }
  const hotel = slug ? await getHotelDetail(slug, locale) : null;
  if (!hotel) return null;

  const roomIndex = Number(pick(sp, "room") ?? 0);
  const room = hotel.rooms[roomIndex] ?? hotel.rooms[0];

  const checkin = pick(sp, "checkin") ?? DEFAULTS.checkin;
  const checkout = pick(sp, "checkout") ?? DEFAULTS.checkout;
  const adultsRaw = Number(pick(sp, "adults") ?? DEFAULTS.adults);
  const roomCountRaw = Number(pick(sp, "rooms") ?? DEFAULTS.roomCount);
  const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 ? adultsRaw : DEFAULTS.adults;
  const roomCount =
    Number.isFinite(roomCountRaw) && roomCountRaw > 0 ? roomCountRaw : DEFAULTS.roomCount;

  // Stored room prices are a per-stay total for the hotel's baseline night count
  // (hotel.baseNights). Scale by the selected nights and the number of rooms so
  // the payable amount tracks the calendar selection.
  const o = room.option;
  const nights = nightsBetween(checkin, checkout);
  const factor = (hotel.baseNights > 0 ? nights / hotel.baseNights : 1) * roomCount;
  return {
    hotel,
    room,
    gallery: hotel.gallery,
    checkin,
    checkout,
    nights,
    adults,
    roomCount,
    oldPriceTL: Math.round(o.oldPriceTL * factor),
    discountTL: Math.round((o.oldPriceTL - o.priceTL) * factor),
    priceTL: Math.round(o.priceTL * factor),
  };
}
