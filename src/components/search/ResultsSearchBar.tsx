"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronRight, MapPin, Minus, Plus } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/layout/Container";
import { slugifyTr, fallbackStay } from "@/lib/data";
import { DateRangeField } from "@/components/ui/DateRangePicker";
import { searchDestinations, destinationCountrySuffix, type Destination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

/* ---------- helpers ---------- */

function guestSummary(adults: number, children: number, rooms: number, t: (key: string) => string): string {
  const adultLabel = t("guests.adults");
  const childLabel = t("guests.children");
  const roomLabel = t("guests.rooms");
  const parts = [`${adults} ${adultLabel}`];
  if (children > 0) parts.push(`${children} ${childLabel}`);
  parts.push(`${rooms} ${roomLabel}`);
  return parts.join(", ");
}

/** Parse a translated guest summary like "2 Adults, 1 Child, 1 Room" back into counts. */
function parseGuests(s: string | undefined): { adults: number; children: number; rooms: number } {
  const grab = (re: RegExp, fallback: number) => {
    const m = s?.match(re);
    return m ? Number(m[1]) : fallback;
  };
  return {
    adults: grab(/(\d+)\s*\w+/, 2),
    children: grab(/(\d+)\s*\w+/, 0),
    rooms: grab(/(\d+)\s*\w+/, 1),
  };
}

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

/* ---------- main ---------- */

export function ResultsSearchBar({
  destination: initialDest = "",
  checkin = "",
  checkout = "",
  guests,
  onDatesChange,
}: {
  destination?: string;
  dates?: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  /** Bubble live date picks up so the listing can reprice instantly. */
  onDatesChange?: (checkIn: string, checkOut: string) => void;
}) {
  const router = useRouter();
  const t = useTranslations("Search");
  const locale = useLocale();
  const initialGuests = useMemo(() => parseGuests(guests), [guests]);

  const [destination, setDestination] = useState(initialDest);
  // Route slug of a picked suggestion; null while free-typing.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(checkin);
  const [checkOut, setCheckOut] = useState(checkout);
  const [adults, setAdults] = useState(initialGuests.adults);
  const [children, setChildren] = useState(initialGuests.children);
  const [rooms, setRooms] = useState(initialGuests.rooms);

  const [openField, setOpenField] = useState<"dates" | "guests" | null>(null);
  const [destOpen, setDestOpen] = useState(false);
  const [destActive, setDestActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenField(null);
        setDestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const destSuggestions = useMemo(() => searchDestinations(destination, 8), [destination]);

  function pickDest(d: Destination) {
    const suffix = destinationCountrySuffix(d, locale);
    setDestination(suffix ? `${d.name}, ${suffix}` : d.name);
    setSelectedSlug(d.slug);
    setDestOpen(false);
  }

  function runSearch() {
    // Fall back to a near-future stay if the user searches without picking.
    const stay = checkIn && checkOut ? { checkin: checkIn, checkout: checkOut } : fallbackStay();
    const params = new URLSearchParams({
      dest: destination || "Kıbrıs",
      checkin: stay.checkin,
      checkout: stay.checkout,
      guests: guestSummary(adults, children, rooms, t),
    });
    const slug = selectedSlug ?? slugifyTr(destination);
    const target = !slug || slug === "kibris" ? "kibris-45" : slug;
    router.push(`/otel/${target}?${params.toString()}`);
  }

  const guestLabel = guestSummary(adults, children, rooms, t);

  return (
    <div className="border-b border-border bg-white">
      <Container className="py-4">
        <div ref={panelRef} className="flex flex-col gap-2 md:flex-row md:items-stretch">
          {/* Destination */}
          <FieldBox icon={<Search className="h-[18px] w-[18px]" />} label={t("searchBar.destinationLabel")}>
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
                  setDestActive((i) => (i - 1 + destSuggestions.length) % destSuggestions.length);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pickDest(destSuggestions[destActive] ?? destSuggestions[0]);
                } else if (e.key === "Escape") {
                  setDestOpen(false);
                }
              }}
              placeholder={t("searchBar.destinationPlaceholder")}
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
                    <span className="shrink-0 text-[12px] text-muted-foreground">{t("searchBar.hotelCount", { n: d.count })}</span>
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
              onDatesChange?.(ci, co);
            }}
            label={t("searchBar.datesLabel")}
          />

          {/* Guests */}
          <FieldBox
            icon={<Users className="h-[18px] w-[18px]" />}
            label={t("searchBar.guestsLabel")}
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
                <Stepper label={t("guests.adults")} value={adults} min={1} onChange={setAdults} />
                <Stepper label={t("guests.children")} value={children} min={0} onChange={setChildren} />
                <Stepper label={t("guests.rooms")} value={rooms} min={1} onChange={setRooms} />
                <button
                  type="button"
                  onClick={() => setOpenField(null)}
                  className="mt-2 w-full rounded-md bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                >
                  {t("searchBar.done")}
                </button>
              </div>
            )}
          </FieldBox>

          <button
            type="button"
            onClick={runSearch}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {t("searchBar.searchAgain")}
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </Container>
    </div>
  );
}
