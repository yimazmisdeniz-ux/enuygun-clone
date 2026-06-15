"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Bed,
  Car,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/layout/Container";
import { popularSearchChips, formatTrDate, slugifyTr, nightsBetween } from "@/lib/data";
import { DateRangeField } from "@/components/ui/DateRangePicker";
import { searchDestinations, destinationCountrySuffix, type Destination } from "@/lib/destinations";
import { searchPickups, type Pickup } from "@/lib/pickups";
import { cn } from "@/lib/utils";

type TabId = "otel" | "arac" | "rezervasyon";

/** Half-hourly pickup/drop-off times for the car search. */
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

/* ---------- helpers ---------- */

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

/* ---------- field primitives ---------- */

function FieldBox({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border bg-white px-3.5 py-2.5 text-left transition-colors hover:border-foreground/30",
        className
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
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
  const t = useTranslations("Home");
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("hero.guests.decrease", { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <span className="w-5 text-center text-sm font-bold text-foreground">
          {value}
        </span>
        <button
          type="button"
          aria-label={t("hero.guests.increase", { label })}
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ---------- reservation lookup ---------- */

function RezervasyonForm() {
  const t = useTranslations("Home");
  const [pnr, setPnr] = useState("");
  const [surname, setSurname] = useState("");
  const [result, setResult] = useState<null | "empty" | "notfound">(null);

  const inputCls =
    "w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground";

  function query() {
    if (!pnr.trim() || !surname.trim()) {
      setResult("empty");
      return;
    }
    // The clone has no bookings backend, so — exactly like bookera for an
    // unknown reference — we report that no reservation was found.
    setResult("notfound");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
        <FieldBox icon={<Search className="h-[18px] w-[18px]" />} label={t("hero.reservation.pnrLabel")}>
          <input
            value={pnr}
            onChange={(e) => {
              setPnr(e.target.value);
              setResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && query()}
            placeholder={t("hero.reservation.pnrPlaceholder")}
            className={inputCls}
          />
        </FieldBox>
        <FieldBox icon={<Users className="h-[18px] w-[18px]" />} label={t("hero.reservation.surnameLabel")}>
          <input
            value={surname}
            onChange={(e) => {
              setSurname(e.target.value);
              setResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && query()}
            placeholder={t("hero.reservation.surnamePlaceholder")}
            className={inputCls}
          />
        </FieldBox>
        <button
          type="button"
          onClick={query}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {t("hero.reservation.submit")}
          <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
      </div>

      {result === "empty" && (
        <p className="text-sm font-semibold text-destructive">
          {t("hero.reservation.errorEmpty")}
        </p>
      )}
      {result === "notfound" && (
        <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {t.rich("hero.reservation.notFound", {
            phone: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- main Hero ---------- */

export function Hero() {
  const router = useRouter();
  const t = useTranslations("Home");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("otel");

  const [destination, setDestination] = useState("Antalya");
  // Route slug of the picked suggestion; null while the user free-types. Lets
  // the input show a friendly "Antalya, Turkey" label without breaking routing.
  const [selectedSlug, setSelectedSlug] = useState<string | null>("antalya");
  const [pickup, setPickup] = useState("Sabiha Gökçen Havalimanı, İstanbul");
  const [checkIn, setCheckIn] = useState("2026-06-06");
  const [checkOut, setCheckOut] = useState("2026-06-09");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const [carInTime, setCarInTime] = useState("10:00");
  const [carOutTime, setCarOutTime] = useState("10:00");

  const [openField, setOpenField] = useState<
    "dates" | "guests" | "carIn" | "carOut" | null
  >(null);
  const [destOpen, setDestOpen] = useState(false);
  const [destActive, setDestActive] = useState(0);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupActive, setPickupActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenField(null);
        setDestOpen(false);
        setPickupOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function runSearch() {
    const params = new URLSearchParams({
      dest: destination || "Antalya",
      checkin: checkIn,
      checkout: checkOut,
      guests: guestSummary(adults, children, rooms, locale),
    });
    // Route to the picked suggestion's slug, or slugify free-typed text
    // (İstanbul → /otel/istanbul). Cyprus keeps its themed listing slug; empty
    // input falls back to the Antalya default.
    const slug = selectedSlug ?? slugifyTr(destination);
    const target = !slug ? "antalya" : slug === "kibris" ? "kibris-45" : slug;
    router.push(`/otel/${target}?${params.toString()}`);
  }

  function runCarSearch() {
    const params = new URLSearchParams({
      pickup: pickup || "Sabiha Gökçen Havalimanı, İstanbul",
      cin: formatTrDate(checkIn, locale),
      cinT: carInTime,
      cout: formatTrDate(checkOut, locale),
      coutT: carOutTime,
      days: String(nightsBetween(checkIn, checkOut)),
    });
    router.push(`/arac-kiralama/sonuclar?${params.toString()}`);
  }

  const destSuggestions = useMemo(
    () => searchDestinations(destination, 8),
    [destination]
  );
  function pickDest(d: Destination) {
    const suffix = destinationCountrySuffix(d, locale);
    setDestination(suffix ? `${d.name}, ${suffix}` : d.name);
    setSelectedSlug(d.slug);
    setDestOpen(false);
  }

  const pickupSuggestions = useMemo(
    () => (pickupOpen ? searchPickups(pickup, 8) : []),
    [pickup, pickupOpen]
  );
  function pickPickup(p: Pickup) {
    setPickup(p.name);
    setPickupOpen(false);
  }

  const guestLabel = t("hero.guests.summary", { adults, children, rooms });

  return (
    <section
      className="relative bg-cover bg-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(2,17,65,0.55), rgba(2,17,65,0.2), rgba(2,17,65,0.15)), url('/images/hero/hero-bg.webp')",
        minHeight: 500,
      }}
    >
      <Container className="flex flex-col justify-center pt-32 pb-10 md:pt-40 md:pb-12">
        {/* Heading */}
        <h1 className="text-[26px] font-bold text-white drop-shadow-sm">
          {t("hero.title")}
        </h1>

        {/* Tab strip */}
        <div className="mt-6 flex items-end gap-0.5">
          {/* Otel */}
          <button
            onClick={() => setActiveTab("otel")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-bold transition-colors",
              activeTab === "otel"
                ? "bg-white text-foreground"
                : "bg-tab-inactive/90 text-white hover:bg-tab-inactive"
            )}
          >
            <Bed className="h-[18px] w-[18px]" />
            {t("hero.tabs.hotel")}
          </button>

          {/* Araç */}
          <button
            onClick={() => setActiveTab("arac")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-bold transition-colors",
              activeTab === "arac"
                ? "bg-white text-foreground"
                : "bg-tab-inactive/90 text-white hover:bg-tab-inactive"
            )}
          >
            <Car className="h-[18px] w-[18px]" />
            {t("hero.tabs.car")}
          </button>

          {/* Rezervasyon Sorgula — pushed right */}
          <button
            onClick={() => setActiveTab("rezervasyon")}
            className={cn(
              "ml-auto shrink-0 px-2 py-2 text-sm font-bold text-white transition-opacity",
              activeTab === "rezervasyon"
                ? "underline underline-offset-4 opacity-100"
                : "opacity-90 hover:opacity-100"
            )}
          >
            {t("hero.tabs.reservation")}
          </button>
        </div>

        {/* Search panel */}
        <div
          ref={panelRef}
          className="rounded-lg rounded-tl-none bg-white p-4 text-foreground shadow-lg md:p-5"
        >
          <p className="mb-3 text-[15px] font-bold text-brand">
            {activeTab === "rezervasyon"
              ? t("hero.tagline.reservation")
              : activeTab === "arac"
                ? t("hero.tagline.car")
                : t("hero.tagline.hotel")}
          </p>

          {activeTab === "otel" && (
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              {/* Destination */}
              <FieldBox
                icon={<Search className="h-[18px] w-[18px]" />}
                label={t("hero.hotel.destLabel")}
              >
                <input
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setSelectedSlug(null);
                    setDestOpen(true);
                    setDestActive(0);
                  }}
                  onFocus={() => {
                    setOpenField(null);
                    setDestOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (!destOpen || destSuggestions.length === 0) {
                      if (e.key === "Enter") runSearch();
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setDestActive((i) => (i + 1) % destSuggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setDestActive(
                        (i) => (i - 1 + destSuggestions.length) % destSuggestions.length
                      );
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      pickDest(destSuggestions[destActive] ?? destSuggestions[0]);
                    } else if (e.key === "Escape") {
                      setDestOpen(false);
                    }
                  }}
                  placeholder={t("hero.hotel.destPlaceholder")}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />

                {destOpen && destSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-2 max-h-[340px] w-[320px] overflow-auto rounded-lg border border-border bg-white py-1.5 shadow-xl">
                    {destSuggestions.map((d, i) => (
                      <button
                        key={d.slug}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickDest(d);
                        }}
                        onMouseEnter={() => setDestActive(i)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                          i === destActive ? "bg-surface" : "hover:bg-surface"
                        )}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-brand" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {d.name}
                          {destinationCountrySuffix(d, locale) && (
                            <span className="font-normal text-muted-foreground">
                              , {destinationCountrySuffix(d, locale)}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[12px] text-muted-foreground">
                          {t("hero.hotel.hotelCount", { count: d.count })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </FieldBox>

              {/* Dates */}
              <DateRangeField
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(ci, co) => {
                  setCheckIn(ci);
                  setCheckOut(co);
                }}
                label={t("hero.hotel.datesLabel")}
              />

              {/* Guests */}
              <FieldBox
                icon={<Users className="h-[18px] w-[18px]" />}
                label={t("hero.hotel.guestsLabel")}
                className="cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDestOpen(false);
                    setOpenField((f) => (f === "guests" ? null : "guests"));
                  }}
                  className="w-full truncate text-left text-sm font-semibold text-foreground"
                >
                  {guestLabel}
                </button>

                {openField === "guests" && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-[260px] rounded-lg border border-border bg-white p-4 shadow-xl">
                    <Stepper label={t("hero.guests.adults")} value={adults} min={1} onChange={setAdults} />
                    <Stepper label={t("hero.guests.children")} value={children} min={0} onChange={setChildren} />
                    <Stepper label={t("hero.guests.rooms")} value={rooms} min={1} onChange={setRooms} />
                    <button
                      type="button"
                      onClick={() => setOpenField(null)}
                      className="mt-2 w-full rounded-md bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                    >
                      {t("hero.done")}
                    </button>
                  </div>
                )}
              </FieldBox>

              {/* CTA */}
              <button
                type="button"
                onClick={runSearch}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                {t("hero.hotel.search")}
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          )}


          {activeTab === "arac" && (
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <FieldBox
                icon={<Car className="h-[18px] w-[18px]" />}
                label={t("hero.car.pickupLabel")}
              >
                <input
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setPickupOpen(true);
                    setPickupActive(0);
                  }}
                  onFocus={() => {
                    setOpenField(null);
                    setDestOpen(false);
                    setPickupOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (!pickupOpen || pickupSuggestions.length === 0) {
                      if (e.key === "Enter") runCarSearch();
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setPickupActive((i) => (i + 1) % pickupSuggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setPickupActive(
                        (i) => (i - 1 + pickupSuggestions.length) % pickupSuggestions.length
                      );
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      pickPickup(pickupSuggestions[pickupActive] ?? pickupSuggestions[0]);
                    } else if (e.key === "Escape") {
                      setPickupOpen(false);
                    }
                  }}
                  placeholder={t("hero.car.pickupPlaceholder")}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />

                {pickupOpen && pickupSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-2 max-h-[340px] w-[320px] overflow-auto rounded-lg border border-border bg-white py-1.5 shadow-xl">
                    {pickupSuggestions.map((p, i) => (
                      <button
                        key={p.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickPickup(p);
                        }}
                        onMouseEnter={() => setPickupActive(i)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                          i === pickupActive ? "bg-surface" : "hover:bg-surface"
                        )}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-brand" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {p.name}
                        </span>
                        <span className="shrink-0 text-[12px] text-muted-foreground">
                          {t("hero.car.carCount", { count: p.count })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </FieldBox>
              {/* Pickup date + time */}
              <FieldBox
                icon={<Calendar className="h-[18px] w-[18px]" />}
                label={t("hero.car.pickupDateLabel")}
                className="cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDestOpen(false);
                    setPickupOpen(false);
                    setOpenField((f) => (f === "carIn" ? null : "carIn"));
                  }}
                  className="w-full truncate text-left text-sm font-semibold text-foreground"
                >
                  {formatTrDate(checkIn, locale)} {carInTime}
                </button>
                {openField === "carIn" && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-[260px] rounded-lg border border-border bg-white p-4 shadow-xl">
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {t("hero.car.pickupDateLabel")}
                        </span>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCheckIn(v);
                            if (v >= checkOut) {
                              const next = new Date(v + "T00:00:00");
                              next.setDate(next.getDate() + 1);
                              setCheckOut(next.toISOString().slice(0, 10));
                            }
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {t("hero.car.time")}
                        </span>
                        <select
                          value={carInTime}
                          onChange={(e) => setCarInTime(e.target.value)}
                          className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-brand"
                        >
                          {TIMES.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenField(null)}
                        className="mt-1 rounded-md bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                      >
                        {t("hero.done")}
                      </button>
                    </div>
                  </div>
                )}
              </FieldBox>

              {/* Drop-off date + time */}
              <FieldBox
                icon={<Calendar className="h-[18px] w-[18px]" />}
                label={t("hero.car.dropoffDateLabel")}
                className="cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDestOpen(false);
                    setPickupOpen(false);
                    setOpenField((f) => (f === "carOut" ? null : "carOut"));
                  }}
                  className="w-full truncate text-left text-sm font-semibold text-foreground"
                >
                  {formatTrDate(checkOut, locale)} {carOutTime}
                </button>
                {openField === "carOut" && (
                  <div className="absolute left-0 top-full z-40 mt-2 w-[260px] rounded-lg border border-border bg-white p-4 shadow-xl">
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {t("hero.car.dropoffDateLabel")}
                        </span>
                        <input
                          type="date"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="rounded-md border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {t("hero.car.time")}
                        </span>
                        <select
                          value={carOutTime}
                          onChange={(e) => setCarOutTime(e.target.value)}
                          className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-brand"
                        >
                          {TIMES.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenField(null)}
                        className="mt-1 rounded-md bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                      >
                        {t("hero.done")}
                      </button>
                    </div>
                  </div>
                )}
              </FieldBox>
              <button
                type="button"
                onClick={runCarSearch}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                {t("hero.car.search")}
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          )}

          {activeTab === "rezervasyon" && <RezervasyonForm />}
        </div>

        {/* Popular searches */}
        <div className="mt-5">
          <p className="text-base font-semibold text-white">{t("hero.popularSearches")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {popularSearchChips.map((chip, i) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {t(`hero.searchChips.${i}`)}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
