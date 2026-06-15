"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  BedDouble,
  Moon,
  Users,
  ChevronRight,
  ChevronLeft,
  MoveHorizontal,
  Images,
  Info,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { type Room, nightsBetween } from "@/lib/data";
import { DateRangeField } from "@/components/ui/DateRangePicker";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { useTranslations, useLocale } from "next-intl";
import { InstallmentModal } from "@/components/detail/InstallmentModal";

/* ---------- guest helpers (Turkish/English summary — matches the search/booking flow) ---------- */

function guestSummary(adults: number, children: number, rooms: number, locale: string): string {
  if (locale.startsWith("en")) {
    const parts = [`${adults} ${adults === 1 ? "Adult" : "Adults"}`];
    if (children > 0) parts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
    parts.push(`${rooms} ${rooms === 1 ? "Room" : "Rooms"}`);
    return parts.join(", ");
  }
  const parts = [`${adults} Yetişkin`];
  if (children > 0) parts.push(`${children} Çocuk`);
  parts.push(`${rooms} Oda`);
  return parts.join(", ");
}

function parseGuestParts(s: string | undefined): { adults: number; children: number; rooms: number } {
  const grab = (re: RegExp, fallback: number) => {
    const m = s?.match(re);
    return m ? Number(m[1]) : fallback;
  };
  // Match both Turkish (Yetişkin, Çocuk, Oda) and English (Adult/s, Child/ren, Room/s) patterns
  return {
    adults: grab(/(\d+)\s*(Yetişkin|Adults?)/, 2),
    children: grab(/(\d+)\s*(Çocuk|Children?)/, 0),
    rooms: grab(/(\d+)\s*(Oda|Rooms?)/, 1),
  };
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const t = useTranslations("Search");
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("guests.decrease", { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <span className="w-5 text-center text-sm font-bold text-foreground">{value}</span>
        <button
          type="button"
          aria-label={t("guests.increase", { label })}
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function RoomImage({ room }: { room: Room }) {
  const t = useTranslations("Detail");
  const [i, setI] = useState(0);
  const total = room.images.length;
  return (
    <div className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[230px]">
      <Image
        src={room.images[i]}
        alt={room.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 230px"
      />
      {total > 1 && (
        <>
          <button
            aria-label={t("previous")}
            onClick={() => setI((v) => (v - 1 + total) % total)}
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label={t("next")}
            onClick={() => setI((v) => (v + 1) % total)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
        <Images className="h-3.5 w-3.5" />
        {i + 1}/{total}
      </span>
    </div>
  );
}

function RoomCard({
  room,
  nights,
  baseNights,
  bookHref,
}: {
  room: Room;
  nights: number;
  baseNights: number;
  bookHref: string;
}) {
  const o = room.option;
  const money = useMoney();
  const t = useTranslations("Detail");
  // Stored prices are a per-stay total for `baseNights`; scale to selected nights.
  const factor = baseNights > 0 ? nights / baseNights : 1;
  const totalPrice = Math.round(o.priceTL * factor);
  const totalOld = Math.round(o.oldPriceTL * factor);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const AMENITY_CAP = 10;
  const shownAmenities = showAllAmenities
    ? room.amenities
    : room.amenities.slice(0, AMENITY_CAP);
  const extraAmenities = room.amenities.length - AMENITY_CAP;
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex flex-col md:flex-row">
        <RoomImage room={room} />

        <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[0.9fr_1.3fr_auto]">
          {/* Details */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[16px] font-bold leading-snug text-foreground">
              {room.name}
            </h3>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MoveHorizontal className="h-4 w-4" />
              {room.sizeM2} m²
            </span>
            <div className="flex flex-wrap gap-1.5">
              {shownAmenities.map((a, i) => (
                <span
                  key={`${a}-${i}`}
                  className="rounded-md border border-border px-2.5 py-1 text-[12px] text-foreground"
                >
                  {a}
                </span>
              ))}
              {extraAmenities > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllAmenities((v) => !v)}
                  className="rounded-md border border-border px-2.5 py-1 text-[12px] font-semibold text-[#1a7ad9] hover:bg-surface"
                >
                  {showAllAmenities ? t("overview.showLess") : `+${extraAmenities}`}
                </button>
              )}
            </div>
            <button className="text-left text-sm font-semibold text-[#1a7ad9] hover:underline">
              {t("rooms.moreInfo")}
            </button>
          </div>

          {/* Options */}
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">
              {t("rooms.boardOptions")}
            </p>
            <div className="rounded-lg border border-brand/40 bg-brand/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[3px] border-brand" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{o.board}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                      {o.cancellable ? t("rooms.freeCancellation") : t("rooms.nonRefundable")}
                      <Info className="h-3.5 w-3.5" />
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-brand">
                    {t("rooms.discount", { pct: o.discountPct })}
                  </span>
                  <p className="mt-1 text-[12px] text-destructive line-through">
                    {money.format(totalOld)}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {money.format(totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex shrink-0 flex-col items-end gap-1.5 md:w-[160px]">
            <p className="text-[12px] text-muted-foreground">
              {t("rooms.totalForNights", { nights })}
            </p>
            <p className="text-[13px] text-destructive line-through">
              {money.format(totalOld)}
            </p>
            <p className="text-[22px] font-bold leading-none text-foreground">
              {money.format(totalPrice)}
            </p>
            <Link
              href={bookHref}
              className="mt-1 w-full rounded-md bg-brand px-6 py-2.5 text-center text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              {t("rooms.selectCta")}
            </Link>
            <button
              type="button"
              onClick={() => setInstallmentOpen(true)}
              className="text-sm font-semibold text-[#1a7ad9] hover:underline"
            >
              {t("rooms.installmentOptions")}
            </button>
          </div>
        </div>
      </div>

      <InstallmentModal
        open={installmentOpen}
        onClose={() => setInstallmentOpen(false)}
        priceTL={totalPrice}
      />
    </article>
  );
}

export function RoomsSection({
  rooms,
  slug,
  checkin,
  checkout,
  dates = "06 Haz Cts - 09 Haz Sal",
  guests = "2 Yetişkin, 1 Oda",
  adults = 2,
  roomCount = 1,
  baseNights = 2,
}: {
  rooms: Room[];
  slug: string;
  checkin?: string;
  checkout?: string;
  dates?: string;
  guests?: string;
  adults?: number;
  roomCount?: number;
  nights?: number;
  baseNights?: number;
}) {
  const t = useTranslations("Detail");
  const ts = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Editable search state — seeded from the active URL search params (or the
  // same defaults the page falls back to when none are present).
  const initialGuests = parseGuestParts(guests);
  const [checkIn, setCheckIn] = useState(checkin ?? "2026-06-06");
  const [checkOut, setCheckOut] = useState(checkout ?? "2026-06-09");
  const [adultCount, setAdultCount] = useState(initialGuests.adults);
  const [childCount, setChildCount] = useState(initialGuests.children);
  const [roomQty, setRoomQty] = useState(initialGuests.rooms);
  const [openField, setOpenField] = useState<"dates" | "guests" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenField(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const guestLabel = guestSummary(adultCount, childCount, roomQty, locale);
  // Nights derived from the live calendar selection so room prices update as
  // soon as the dates change (before the "find room" submit re-fetches).
  const localNights = nightsBetween(checkIn, checkOut);

  // Apply the new dates/guests to the current detail URL; the page re-reads them
  // from searchParams and re-renders the summary, nights and booking links.
  function applySearch() {
    const params = new URLSearchParams({
      checkin: checkIn,
      checkout: checkOut,
      guests: guestLabel,
    });
    setOpenField(null);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const bookHref = (roomIndex: number) => {
    const params = new URLSearchParams({ slug, room: String(roomIndex) });
    params.set("checkin", checkIn);
    params.set("checkout", checkOut);
    params.set("adults", String(adultCount));
    params.set("rooms", String(roomQty));
    return `/otel/rezervasyon?${params.toString()}`;
  };

  return (
    <section id="odalar" className="scroll-mt-20 bg-white">
      <Container className="py-7">
        <h2 className="text-[22px] font-bold text-foreground">{t("rooms.title")}</h2>

        {/* Summary line */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-[#1a7ad9]">{dates}</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {adults}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            {roomCount}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Moon className="h-4 w-4" />
            {localNights}
          </span>
        </div>

        {/* Search box */}
        <div ref={panelRef} className="mt-3 rounded-lg border-2 border-brand p-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
            {/* Dates */}
            <DateRangeField
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
              }}
              label={t("rooms.checkInOutDate")}
              className="flex-[2]"
            />

            {/* Guests */}
            <div className="relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border px-3.5 py-2.5 transition-colors hover:border-foreground/30">
              <Users className="h-[18px] w-[18px] text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {t("rooms.guestCount")}
                </p>
                <button
                  type="button"
                  onClick={() => setOpenField((f) => (f === "guests" ? null : "guests"))}
                  className="w-full truncate text-left text-sm font-semibold text-foreground"
                >
                  {guestLabel}
                </button>
              </div>

              {openField === "guests" && (
                <div className="absolute left-0 top-full z-40 mt-2 w-[260px] rounded-lg border border-border bg-white p-4 shadow-xl">
                  <Stepper label={ts("guests.adults")} value={adultCount} min={1} onChange={setAdultCount} />
                  <Stepper label={ts("guests.children")} value={childCount} min={0} onChange={setChildCount} />
                  <Stepper label={ts("guests.rooms")} value={roomQty} min={1} onChange={setRoomQty} />
                  <button
                    type="button"
                    onClick={() => setOpenField(null)}
                    className="mt-2 w-full rounded-md bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                  >
                    {ts("searchBar.done")}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={applySearch}
              disabled={isPending}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-8 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isPending ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2.5} />
              ) : (
                <>
                  {t("rooms.findRoom")}
                  <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room cards */}
        <div className="mt-5 flex flex-col gap-4">
          {rooms.map((r, i) => (
            <RoomCard
              key={r.name}
              room={r}
              nights={localNights}
              baseNights={baseNights}
              bookHref={bookHref(i)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
