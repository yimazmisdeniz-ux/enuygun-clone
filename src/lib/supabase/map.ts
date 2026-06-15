import type {
  Hotel,
  HotelResult,
  HotelDetail,
  Room,
  Review,
  CategoryScore,
  POI,
} from "@/lib/data";
import type { Car } from "@/lib/rental";
import {
  localizeRatingLabel,
  localizeBoard,
  localizeCategory,
  localizeAiLike,
  localizeAmenity,
  localizeRoomName,
  localizePoiName,
  localizeDescription,
  localizeText,
  localizePlace,
  type TrCache,
} from "@/lib/dataLabels";
import { hiResImage } from "@/lib/images";
import { OFFER_PCT, offerPrice, strikePrice } from "@/lib/offer";

/* DB rows are loosely typed; mappers normalize into the app's public types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const FALLBACK_IMG = "/images/hotels/concorde-luxury.webp";

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function rowToHotelRail(r: Row, locale: string = "tr"): Hotel {
  const gallery = arr<string>(r.gallery);
  const base = Number(r.price_tl ?? 0);
  return {
    slug: r.slug,
    name: r.name,
    location: localizePlace(r.location ?? r.region ?? "", locale),
    rating: Number(r.rating ?? 0),
    ratingLabel: localizeRatingLabel(r.rating_label ?? "", locale),
    pension: localizeBoard(r.board ?? "", locale),
    discountPct: OFFER_PCT,
    oldPriceTL: strikePrice(offerPrice(base)),
    priceTL: offerPrice(base),
    image: hiResImage(gallery[0], 720) || FALLBACK_IMG,
    reviewCount: Number(r.review_count ?? 0),
  };
}

export function rowToHotelResult(r: Row, locale: string = "tr"): HotelResult {
  const gallery = arr<string>(r.gallery);
  const reviews = arr<Row>(r.reviews);
  const reviewer =
    reviews[0] && reviews[0].name
      ? { name: reviews[0].name as string, date: (reviews[0].review_date as string) ?? "" }
      : undefined;
  return {
    slug: r.slug,
    name: r.name,
    district: localizePlace(r.district ?? r.region ?? "", locale),
    region: localizePlace(r.region ?? "", locale),
    board: localizeBoard(r.board ?? "", locale),
    rating: Number(r.rating ?? 0),
    ratingLabel: localizeRatingLabel(r.rating_label ?? "", locale),
    reviewCount: Number(r.review_count ?? 0),
    images: gallery.length ? gallery.slice(0, 6).map((u) => hiResImage(u, 720)) : [FALLBACK_IMG],
    discountPct: OFFER_PCT,
    oldPriceTL: strikePrice(offerPrice(Number(r.price_tl ?? 0))),
    priceTL: offerPrice(Number(r.price_tl ?? 0)),
    nights: Number(r.nights ?? 2),
    roomsLeft: r.rooms_left ?? undefined,
    reviewer,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
  };
}

function rowToRoom(r: Row, locale: string = "tr", cache?: TrCache): Room {
  return {
    name: localizeRoomName(r.name, locale, cache),
    sizeM2: Number(r.size_m2 ?? 0),
    amenities: arr<string>(r.amenities).map((a) => localizeAmenity(a, locale, cache)),
    images: arr<string>(r.images).map((u) => hiResImage(u, 1080)),
    option: {
      board: localizeBoard(r.board ?? "", locale, cache),
      cancellable: !!r.cancellable,
      discountPct: OFFER_PCT,
      oldPriceTL: strikePrice(offerPrice(Number(r.price_tl ?? 0))),
      priceTL: offerPrice(Number(r.price_tl ?? 0)),
    },
  };
}

function rowToReview(r: Row, locale: string = "tr", cache?: TrCache): Review {
  return {
    initials: r.initials ?? "",
    name: r.name ?? "",
    date: r.review_date ?? "",
    rating: Number(r.rating ?? 0),
    // Real scraped Turkish — translated via the MT cache when available.
    text: localizeText(r.text ?? "", locale, cache),
    room: localizeRoomName(r.room ?? "", locale, cache),
    stay: r.stay ?? "",
    guestType: r.guest_type ?? "",
  };
}

export function rowToHotelDetail(r: Row, locale: string = "tr", cache?: TrCache): HotelDetail {
  const gallery = arr<string>(r.gallery);
  const rooms = arr<Row>(r.rooms)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((rm) => rowToRoom(rm, locale, cache));
  const pois = arr<POI>(r.pois).map((p) => ({ ...p, name: localizePoiName(p.name, locale, cache) }));
  const categoryScores = arr<CategoryScore>(r.category_scores).map((c) => ({
    ...c,
    label: localizeCategory(c.label, locale, cache),
  }));
  return {
    slug: r.slug,
    name: r.name,
    city: localizePlace(r.city ?? r.region ?? "", locale, cache),
    region: localizePlace(r.region ?? r.city ?? "", locale, cache),
    district: localizePlace(r.district ?? "", locale, cache),
    rating: Number(r.rating ?? 0),
    ratingLabel: localizeRatingLabel(r.rating_label ?? "", locale, cache),
    reviewCount: Number(r.review_count ?? 0),
    board: localizeBoard(r.board ?? "", locale, cache),
    baseNights: Number(r.nights ?? 2) || 2,
    gallery: gallery.length ? gallery.map((u) => hiResImage(u, 1080)) : [FALLBACK_IMG],
    totalPhotos: Number(r.total_photos ?? gallery.length),
    description: localizeDescription(r.description ?? "", locale, cache),
    pois,
    rooms: rooms.length ? rooms : [defaultRoom(r, locale, cache)],
    categoryScores,
    aiLikes: arr<string>(r.ai_likes).map((l) => localizeAiLike(l, locale, cache)),
    reviews: arr<Row>(r.reviews).map((rv) => rowToReview(rv, locale, cache)),
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
  };
}

function defaultRoom(r: Row, locale: string = "tr", cache?: TrCache): Room {
  return {
    name: localizeRoomName("Standart Oda", locale, cache),
    sizeM2: 0,
    amenities: arr<string>(r.amenities).slice(0, 4).map((a) => localizeAmenity(a, locale, cache)),
    images: arr<string>(r.gallery).slice(0, 4).map((u) => hiResImage(u, 1080)),
    option: {
      board: localizeBoard(r.board ?? "Sadece Oda", locale, cache),
      cancellable: false,
      discountPct: OFFER_PCT,
      oldPriceTL: strikePrice(offerPrice(Number(r.price_tl ?? 0))),
      priceTL: offerPrice(Number(r.price_tl ?? 0)),
    },
  };
}

export function rowToCar(r: Row): Car {
  return {
    slug: r.slug,
    name: r.name,
    transmission: r.transmission,
    fuel: r.fuel,
    minAge: Number(r.min_age ?? 21),
    kmLimit: Number(r.km_limit ?? 300),
    depositTL: Number(r.deposit_tl ?? 0),
    delivery: r.delivery ?? "Havalimanı Ofis",
    carClass: r.car_class,
    supplier: r.supplier,
    rating: Number(r.rating ?? 0),
    reviewCount: Number(r.review_count ?? 0),
    location: r.location ?? "",
    dailyTL: Number(r.daily_tl ?? 0),
    totalTL: Number(r.total_tl ?? 0),
    freeCancel: !!r.free_cancel,
    accent: r.accent ?? "#0a7c8a",
    image: hiResImage(r.image, 720),
  };
}
