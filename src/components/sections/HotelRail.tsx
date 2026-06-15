"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { buildHotelHref, type Hotel } from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";

export function HotelRail({
  title,
  hotels,
  seeAllHref,
}: {
  title: string;
  hotels: Hotel[];
  seeAllHref: string;
}) {
  const t = useTranslations("Common");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Listing slug for this rail (e.g. "/otel/kibris-45" → "kibris-45"), used as
  // the [location] segment when linking each card to its detail page.
  const location = seeAllHref.replace(/^\/otel\//, "").split("?")[0];

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  return (
    <section>
      <Container>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="min-w-0 text-[17px] sm:text-[20px] font-bold leading-tight text-foreground">
            {title}
          </h2>
          <Link
            href={seeAllHref}
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm font-semibold text-brand hover:underline"
          >
            {t("seeAll")}
            <ChevronRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Carousel wrapper */}
        <div className="relative group">
          {/* Prev button — hidden on mobile */}
          <button
            onClick={() => scroll("left")}
            aria-label={t("prev")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-border text-foreground hover:shadow-lg transition-shadow"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory -mx-1 px-1 sm:mx-0 sm:px-0"
          >
            {hotels.map((h) => (
              <HotelCard key={h.slug} hotel={h} location={location} />
            ))}
          </div>

          {/* Next button — hidden on mobile */}
          <button
            onClick={() => scroll("right")}
            aria-label={t("next")}
            className="hidden md:flex absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-border text-foreground hover:shadow-lg transition-shadow"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </Container>
    </section>
  );
}

function HotelCard({ hotel, location }: { hotel: Hotel; location: string }) {
  const t = useTranslations("Common");
  const money = useMoney();
  return (
    <Link
      href={buildHotelHref(location, hotel.slug)}
      className="group/card block w-[78vw] max-w-[280px] sm:w-[260px] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={hotel.image}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 78vw, 260px"
        />
        {/* Exclusive offer badge — top-left of image */}
        <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-1 text-[11px] font-extrabold leading-none text-white shadow-sm">
          {t("hotelCard.discountBadge", { pct: hotel.discountPct })}
        </span>
        {/* Stacked rating badge — top-right of image */}
        <div className="absolute right-2 top-2 flex flex-col items-center">
          {/* Navy box: big rating number */}
          <div className="bg-rating flex items-center justify-center rounded-t-sm px-2 py-1 min-w-[36px]">
            <span className="text-[15px] font-bold leading-none text-white">{hotel.rating}</span>
          </div>
          {/* White box: descriptor label */}
          <div className="bg-white flex items-center justify-center rounded-b-sm px-1.5 py-0.5 min-w-[36px]">
            <span className="text-[10px] font-bold leading-none text-foreground whitespace-nowrap">
              {hotel.ratingLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-1">
        {/* Hotel name */}
        <h3 className="line-clamp-1 text-[15px] font-bold leading-snug text-foreground">
          {hotel.name}
        </h3>

        {/* Location */}
        <p className="line-clamp-1 text-[12px] font-normal text-muted-foreground leading-tight">
          {hotel.location}
        </p>

        {/* Pension type */}
        <p className="mt-1 text-[13px] font-semibold leading-tight text-foreground">
          {hotel.pension}
        </p>

        {/* Price section */}
        <div className="mt-1.5">
          <p className="text-[11px] font-normal text-muted-foreground leading-tight mb-0.5">
            {t("hotelCard.priceNote")}
          </p>
          <p className="flex items-baseline gap-1 leading-none text-[11px] font-normal text-muted-foreground">
            <span className="text-[13px] font-medium text-destructive line-through">
              {money.format(hotel.oldPriceTL)}
            </span>
            {t.rich("hotelCard.fromPrice", {
              value: money.format(hotel.priceTL),
              price: (chunks) => (
                <span className="text-[20px] font-bold text-foreground">{chunks}</span>
              ),
            })}
          </p>
        </div>

        {/* CTA Button — visual only; the whole card is the link */}
        <span className="mt-2 block w-full rounded bg-brand py-2 text-center text-[14px] font-bold text-white transition-colors group-hover/card:bg-brand-hover">
          {t("selectCta")}
        </span>
      </div>
    </Link>
  );
}
