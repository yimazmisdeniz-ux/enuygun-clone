"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Award,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { buildHotelHref, type HotelResult } from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";

export function HotelResultCard({
  hotel,
  location,
  checkin,
  checkout,
  guests,
  selectedNights,
  active = false,
  bestOption = false,
  onHover,
  onSelect,
}: {
  hotel: HotelResult;
  location: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  /** Live nights from the search bar — rescales the stored price instantly. */
  selectedNights?: number;
  active?: boolean;
  bestOption?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = hotel.images.length;
  const href = buildHotelHref(location, hotel.slug, { checkin, checkout, guests });
  const money = useMoney();
  const t = useTranslations("Search");

  // Stored price is a per-stay total for `hotel.nights`; rescale to the nights
  // currently picked in the search bar so the listing reprices instantly.
  const baseNights = hotel.nights > 0 ? hotel.nights : 1;
  const nights = selectedNights && selectedNights > 0 ? selectedNights : hotel.nights;
  const factor = nights / baseNights;
  const priceTL = Math.round(hotel.priceTL * factor);
  const oldPriceTL = Math.round(hotel.oldPriceTL * factor);

  function move(dir: 1 | -1) {
    setIndex((i) => (i + dir + total) % total);
  }

  return (
    <article
      onMouseEnter={() => onHover?.(hotel.slug)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(hotel.slug)}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md md:flex-row",
        active
          ? "border-brand ring-2 ring-brand"
          : bestOption
            ? "border-brand ring-1 ring-brand"
            : "border-border"
      )}
    >
      {/* Image carousel */}
      <div className="group relative aspect-[4/3] w-full shrink-0 md:aspect-auto md:h-auto md:w-[256px]">
        <Image
          src={hotel.images[index]}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 256px"
        />

        {/* Best-choice badge */}
        {bestOption && (
          <span className="absolute left-0 top-2.5 z-10 flex items-center gap-1 rounded-r-full bg-brand px-2.5 py-1 text-[12px] font-bold text-white shadow-md">
            <Award className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t("card.bestOption")}
          </span>
        )}

        {/* Arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => move(-1)}
              aria-label={t("card.prevPhoto")}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => move(1)}
              aria-label={t("card.nextPhoto")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {hotel.images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === index ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:justify-between">
        {/* Details */}
        <div className="flex min-w-0 flex-col">
          <Link
            href={href}
            className="text-[18px] font-bold leading-snug text-foreground hover:text-brand"
          >
            {hotel.name}
          </Link>

          <div className="mt-1.5 flex items-center gap-1.5 text-[#1a7ad9]">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{hotel.district}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-foreground">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{hotel.board}</span>
          </div>
        </div>

        {/* Price column */}
        <div className="flex shrink-0 flex-col items-end gap-1.5 md:w-[190px]">
          {/* Rating — hidden on mobile, shown on desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="text-right leading-tight">
              <p className="text-[13px] font-bold text-foreground">
                {hotel.ratingLabel}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {t("card.reviews", { n: hotel.reviewCount })}
              </p>
            </div>
            <span className="flex h-8 min-w-[34px] items-center justify-center rounded-md bg-brand-ink px-1.5 text-sm font-bold text-white">
              {hotel.rating.toFixed(1)}
            </span>
          </div>

          {/* Discount */}
          <span className="mt-1 rounded bg-brand/10 px-2 py-1 text-[12px] font-bold text-brand">
            {t("card.discount", { pct: hotel.discountPct })}
          </span>

          <p className="mt-1 text-[12px] text-muted-foreground">
            {t("card.totalForNights", { n: nights })}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-destructive line-through">
              {money.format(oldPriceTL)}
            </span>
            <span className="text-[22px] font-bold leading-none text-foreground">
              {money.format(priceTL)}
            </span>
          </div>

          <Link
            href={href}
            className="cta-press flex items-center justify-center gap-1 rounded bg-brand px-7 py-2 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            {t("card.select")}
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>

          {hotel.roomsLeft !== undefined && (
            <p className="mt-1 text-[12px] font-semibold text-destructive">
              {t("card.roomsLeft", { n: hotel.roomsLeft })}
            </p>
          )}
        </div>

        {/* Rating — mobile only, bottom row: left side */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="flex h-8 min-w-[34px] items-center justify-center rounded-md bg-brand-ink px-1.5 text-sm font-bold text-white">
            {hotel.rating.toFixed(1)}
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-foreground">
              {hotel.ratingLabel}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {t("card.reviews", { n: hotel.reviewCount })}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
