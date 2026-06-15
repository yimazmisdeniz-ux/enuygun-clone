import { formatTL, formatTL2, foldTr } from "@/lib/data";
import { getSupabase } from "@/lib/supabase/server";
import { rowToCar } from "@/lib/supabase/map";
import { hiResImage } from "@/lib/images";

export type Transmission = "Otomatik" | "Manuel";
export type Fuel = "Benzin" | "Dizel" | "Elektrik" | "Hibrit";
export type CarClass = "Ekonomik" | "Orta" | "Lüks" | "Üst" | "SUV";

export type Car = {
  slug: string;
  name: string;
  transmission: Transmission;
  fuel: Fuel;
  minAge: number;
  kmLimit: number;
  depositTL: number;
  delivery: string;
  carClass: CarClass;
  supplier: string;
  rating: number;
  reviewCount: number;
  location: string;
  dailyTL: number;
  totalTL: number;
  freeCancel: boolean;
  accent: string;
  image: string;
};

/** All cars from Supabase, ordered by daily price. */
export async function getCars(): Promise<Car[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("cars")
    .select("*")
    .order("daily_tl", { ascending: true })
    .limit(1000);
  if (error || !data) return [];
  return data.map(rowToCar);
}

/**
 * Narrow a car list to a chosen pickup location (exact, diacritic-insensitive
 * match on `location`). Falls back to the full list when nothing matches —
 * e.g. a free-typed or default pickup — so results never come back empty.
 */
export function filterCarsByPickup(cars: Car[], pickup: string): Car[] {
  const p = foldTr(pickup);
  if (!p) return cars;
  const matched = cars.filter((c) => foldTr(c.location) === p);
  return matched.length ? matched : cars;
}

export type Facet<T extends string = string> = { name: T; count: number };

/** Compute sidebar facet counts from a car list. */
export function computeCarFacets(cars: Car[]) {
  const tally = <T extends string>(key: (c: Car) => T) => {
    const m = new Map<T, number>();
    for (const c of cars) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  return {
    transmissions: tally((c) => c.transmission) as Facet<Transmission>[],
    suppliers: tally((c) => c.supplier),
    classes: tally((c) => c.carClass) as Facet<CarClass>[],
  };
}

export type RentalCampaign = {
  brand: string;
  title: string;
  highlight?: boolean;
};

export const rentalCampaigns: RentalCampaign[] = [
  { brand: "", title: "Tüm kampanyaları uygula", highlight: true },
  { brand: "BOOKERA", title: "BOOKERA'da %50'ye varan indirim!" },
  { brand: "Europcar", title: "Europcar'da %20 indirim!" },
  { brand: "Goldcar", title: "Goldcar'da %20 indirim!" },
  { brand: "Praticar", title: "Praticar'da %5 indirim!" },
];

export type Extra = {
  slug: string;
  name: string;
  priceTL: number;
  desc: string;
};

export const rentalExtras: Extra[] = [
  {
    slug: "musteri-onceligi",
    name: "Müşteri Hizmetleri Önceliği",
    priceTL: 24.99,
    desc: "Çağrı merkezinde öncelikli destek.",
  },
  {
    slug: "ek-surucu",
    name: "Ek Sürücü",
    priceTL: 597,
    desc: "İkinci bir sürücü ekleyin.",
  },
  {
    slug: "bebek-koltugu",
    name: "Bebek Koltuğu",
    priceTL: 897,
    desc: "0-4 yaş için güvenli koltuk.",
  },
  {
    slug: "lastik-cam-far",
    name: "Lastik, Cam, Far Güvencesi",
    priceTL: 897,
    desc: "Lastik, cam ve far hasarlarına karşı koruma.",
  },
];

export type Upgrade = {
  name: string;
  spec: string;
  extraPerDayTL: number;
  /** Real car slug this upgrade switches the booking to. */
  targetSlug: string;
};

export const rentalUpgrades: Upgrade[] = [
  { name: "Toyota Corolla", spec: "(Hibrit/Otomatik) veya benzeri", extraPerDayTL: 480, targetSlug: "toyota-corolla" },
  { name: "Peugeot 2008", spec: "(Dizel/Otomatik) SUV veya benzeri", extraPerDayTL: 730, targetSlug: "peugeot-2008" },
  { name: "BMW 220i", spec: "(Benzin/Otomatik) veya benzeri", extraPerDayTL: 2580, targetSlug: "bmw-220i-eser-rent-a-car" },
];

/** An upgrade option resolved with its target car's photo + brand accent. */
export type UpgradeOption = Upgrade & { image?: string; accent: string };

/**
 * Resolve the upgrade upsell cards with real car photos from the catalogue.
 * The static `rentalUpgrades` only carry a `targetSlug`; here we look up each
 * target car's image + accent so the cards show the actual vehicle instead of
 * a generic silhouette. Cars without a stored image fall back to the silhouette.
 */
export async function getUpgradeOptions(): Promise<UpgradeOption[]> {
  const slugs = rentalUpgrades.map((u) => u.targetSlug);
  const sb = getSupabase();
  const { data } = await sb.from("cars").select("slug,image,accent").in("slug", slugs);
  const bySlug = new Map(
    (data ?? []).map((c) => [c.slug as string, c as { image: string | null; accent: string | null }]),
  );
  return rentalUpgrades.map((u) => {
    const c = bySlug.get(u.targetSlug);
    return {
      ...u,
      // The car CDN only serves preset heights (720/1080 work, 600 → 404).
      image: c?.image ? hiResImage(c.image, 720) : undefined,
      accent: c?.accent ?? "#90a4ae",
    };
  });
}

export const DEFAULT_PICKUP = "Sabiha Gökçen Havalimanı, İstanbul";

export type RentalContext = {
  car: Car;
  pickup: string;
  dropoff: string;
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  checkoutTime: string;
  days: number;
  extras: Extra[];
  extrasTotal: number;
  total: number;
};

export type RentalDriver = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birth: string;
  tc: string;
};

/** Extract driver details carried through the URL from the driver step. */
export function parseDriver(
  sp: Record<string, string | string[] | undefined>,
): RentalDriver {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  return {
    firstName: s("fname"),
    lastName: s("lname"),
    email: s("email"),
    phone: s("phone"),
    birth: s("birth"),
    tc: s("tc"),
  };
}

export async function getCar(slug: string): Promise<Car | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from("cars").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return rowToCar(data);
}

/**
 * Serialize a rental booking context to query params so each step of the flow
 * (extras → driver → payment) carries the full selection forward instead of
 * resetting dates/days/extras to their defaults.
 */
export function rentalSearchParams(
  ctx: RentalContext,
  overrides?: { car?: string; extras?: string[] },
): string {
  const p = new URLSearchParams();
  p.set("car", overrides?.car ?? ctx.car.slug);
  p.set("pickup", ctx.pickup);
  if (ctx.dropoff && ctx.dropoff !== ctx.pickup) p.set("dropoff", ctx.dropoff);
  p.set("cin", ctx.checkinDate);
  p.set("cinT", ctx.checkinTime);
  p.set("cout", ctx.checkoutDate);
  p.set("coutT", ctx.checkoutTime);
  p.set("days", String(ctx.days));
  const extras = overrides?.extras ?? ctx.extras.map((e) => e.slug);
  if (extras.length) p.set("extras", extras.join(","));
  return p.toString();
}

function pickupAddress(): string {
  return "İstanbul Sabiha Gökçen Havalimanı, Sanayi, 34906";
}

export { pickupAddress };

/** Build the booking context from search params for the rental flow. */
export async function getRentalContext(
  sp: Record<string, string | string[] | undefined>
): Promise<RentalContext | null> {
  const slug = typeof sp.car === "string" ? sp.car : undefined;
  // Fall back to the cheapest car when no slug — or when a stale/typo slug
  // doesn't resolve — so the flow degrades gracefully instead of 404ing.
  const car = (slug ? await getCar(slug) : null) ?? (await getCars())[0] ?? null;
  if (!car) return null;

  const pickup =
    typeof sp.pickup === "string" ? sp.pickup : DEFAULT_PICKUP;
  const dropoff = typeof sp.dropoff === "string" ? sp.dropoff : pickup;
  const checkinDate = typeof sp.cin === "string" ? sp.cin : "06 Haziran 2026";
  const checkinTime = typeof sp.cinT === "string" ? sp.cinT : "10:00";
  const checkoutDate = typeof sp.cout === "string" ? sp.cout : "09 Haziran 2026";
  const checkoutTime = typeof sp.coutT === "string" ? sp.coutT : "10:00";
  const days = sp.days ? Math.max(1, Number(sp.days)) : 3;

  const selected =
    typeof sp.extras === "string" && sp.extras.length
      ? sp.extras.split(",")
      : [];
  const extras = rentalExtras.filter((e) => selected.includes(e.slug));
  const extrasTotal = extras.reduce((s, e) => s + e.priceTL, 0);
  // Scale by the selected number of days rather than the car's fixed 3-day total.
  const total = car.dailyTL * days + extrasTotal;

  return {
    car,
    pickup,
    dropoff,
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    days,
    extras,
    extrasTotal,
    total,
  };
}

export { formatTL, formatTL2 };
