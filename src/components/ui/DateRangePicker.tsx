"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatTrDate, nightsBetween } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Date helpers — local-time safe (no UTC drift from toISOString)     */
/* ------------------------------------------------------------------ */

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Monday-first cell grid for a month (leading nulls pad the first week). */
function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  return cells;
}

/* ------------------------------------------------------------------ */
/*  Single month grid                                                  */
/* ------------------------------------------------------------------ */

function MonthGrid({
  view,
  start,
  end,
  hover,
  today,
  weekdays,
  locale,
  onPick,
  onHover,
}: {
  view: Date;
  start: Date | null;
  end: Date | null;
  hover: Date | null;
  today: Date;
  weekdays: string[];
  locale: string;
  onPick: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const cells = monthCells(view.getFullYear(), view.getMonth());
  // Tentative end while the user is mid-selection (start chosen, hovering).
  const provisionalEnd = end ?? (start && hover && hover > start ? hover : null);
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(view);

  return (
    <div className="w-full select-none md:w-[266px] md:shrink-0">
      <p className="mb-3 text-center text-[15px] font-bold capitalize text-foreground">{title}</p>
      <div className="mb-1 grid grid-cols-7">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const past = d < today;
          const isStart = !!start && sameDay(d, start);
          const isEnd = !!provisionalEnd && sameDay(d, provisionalEnd);
          const inRange =
            !!start && !!provisionalEnd && d > start && d < provisionalEnd;
          const isToday = sameDay(d, today);
          const edge = isStart || isEnd;

          return (
            <div
              key={i}
              className={cn(
                "relative flex justify-center",
                inRange && "bg-brand/10",
                isStart && !!provisionalEnd && "rounded-l-full bg-brand/10",
                isEnd && !!start && "rounded-r-full bg-brand/10"
              )}
            >
              <button
                type="button"
                disabled={past}
                onClick={() => onPick(d)}
                onMouseEnter={() => onHover(d)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                  past && "cursor-not-allowed text-muted-foreground/40",
                  !past && !edge && "text-foreground hover:bg-brand/15",
                  edge && "bg-brand font-bold text-white",
                  isToday && !edge && "font-bold text-brand ring-1 ring-brand/40"
                )}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Range calendar panel (dual month on desktop, single on mobile)     */
/* ------------------------------------------------------------------ */

function RangeCalendar({
  checkIn,
  checkOut,
  onChange,
  onClose,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onClose?: () => void;
}) {
  const t = useTranslations("DatePicker");
  const locale = useLocale();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [start, setStart] = useState<Date | null>(checkIn ? fromISO(checkIn) : null);
  const [end, setEnd] = useState<Date | null>(checkOut ? fromISO(checkOut) : null);
  const [hover, setHover] = useState<Date | null>(null);
  const [view, setView] = useState<Date>(() => new Date((checkIn ? fromISO(checkIn) : today).getFullYear(), (checkIn ? fromISO(checkIn) : today).getMonth(), 1));

  const weekdays = useMemo(() => {
    // 2024-01-01 is a Monday — build a localized Mon-first weekday header.
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 1 + i))
    );
  }, [locale]);

  function pick(d: Date) {
    if (!start || (start && end)) {
      // Begin a new range.
      setStart(d);
      setEnd(null);
      return;
    }
    // start set, end not yet chosen
    if (d <= start) {
      setStart(d);
      return;
    }
    setEnd(d);
    onChange(toISO(start), toISO(d));
  }

  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const nights = start && end ? nightsBetween(toISO(start), toISO(end)) : 0;

  return (
    <div className="flex flex-col">
      {/* Nav + months */}
      <div className="relative">
        <button
          type="button"
          aria-label="prev"
          disabled={!canPrev}
          onClick={() => setView((v) => addMonths(v, -1))}
          className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="next"
          onClick={() => setView((v) => addMonths(v, 1))}
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex justify-center gap-8 px-2 md:justify-start md:px-8" onMouseLeave={() => setHover(null)}>
          <MonthGrid
            view={view}
            start={start}
            end={end}
            hover={hover}
            today={today}
            weekdays={weekdays}
            locale={locale}
            onPick={pick}
            onHover={setHover}
          />
          {/* Second month — desktop only */}
          <div className="hidden md:block">
            <MonthGrid
              view={addMonths(view, 1)}
              start={start}
              end={end}
              hover={hover}
              today={today}
              weekdays={weekdays}
              locale={locale}
              onPick={pick}
              onHover={setHover}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">
          {start && end ? (
            <span className="font-semibold text-foreground">
              {formatTrDate(toISO(start), locale)} – {formatTrDate(toISO(end), locale)} · {t("nights", { count: nights })}
            </span>
          ) : start ? (
            t("selectCheckout")
          ) : (
            t("selectDates")
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setStart(null);
              setEnd(null);
              setHover(null);
            }}
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("clear")}
          </button>
          <button
            type="button"
            disabled={!start || !end}
            onClick={() => {
              // Commit the current range on apply too, so a complete selection
              // is never lost even if the incremental onChange was missed.
              if (start && end) onChange(toISO(start), toISO(end));
              onClose?.();
            }}
            className="rounded-md bg-brand px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public field — trigger + responsive popover/sheet                  */
/* ------------------------------------------------------------------ */

export function DateRangeField({
  checkIn,
  checkOut,
  onChange,
  label,
  className,
  align = "left",
}: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  label: string;
  className?: string;
  align?: "left" | "right";
}) {
  const locale = useLocale();
  const t = useTranslations("DatePicker");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Show the picked range, or a "Seçiniz" prompt until both ends are chosen —
  // never auto-display a pre-filled range the user didn't choose.
  const hasRange = !!checkIn && !!checkOut;
  const rangeLabel = hasRange
    ? `${formatTrDate(checkIn, locale)} - ${formatTrDate(checkOut, locale)}`
    : t("placeholder");

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border bg-white px-3.5 py-2.5 text-left transition-colors hover:border-foreground/30",
        className
      )}
    >
      <CalendarIcon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full truncate text-left text-sm font-semibold",
            hasRange ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {rangeLabel}
        </button>
      </div>

      {open && (
        <>
          {/* Desktop: dropdown popover */}
          <div
            className={cn(
              "absolute top-full z-50 mt-2 hidden rounded-xl border border-border bg-white p-4 shadow-2xl md:block",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <RangeCalendar
              key={`${checkIn}-${checkOut}`}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={onChange}
              onClose={() => setOpen(false)}
            />
          </div>

          {/* Mobile: bottom sheet */}
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-bold text-foreground">{label}</span>
                <button
                  type="button"
                  aria-label="close"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <RangeCalendar
                key={`${checkIn}-${checkOut}`}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={onChange}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
