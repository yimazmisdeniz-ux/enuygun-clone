"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  Share2,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import { useDetailMap } from "./DetailMapContext";
import type { HotelDetail } from "@/lib/data";
import { useTranslations } from "next-intl";

const TAB_IDS = ["otel", "odalar", "yorumlar", "ozellikler", "ulasim", "kurallar"] as const;

export function DetailNav({
  detail,
  location,
}: {
  detail: HotelDetail;
  location: string;
}) {
  const t = useTranslations("Detail");
  const [active, setActive] = useState("otel");
  const { open: openMap } = useDetailMap();
  const listingHref = `/otel/${location}`;

  const TABS = [
    { id: "otel", label: t("nav.hotel") },
    { id: "odalar", label: t("nav.rooms") },
    { id: "yorumlar", label: t("nav.reviews") },
    { id: "ozellikler", label: t("nav.features") },
    { id: "ulasim", label: t("nav.transport") },
    { id: "kurallar", label: t("nav.rules") },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const id of TAB_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function scrollToId(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="bg-white">
      <Container className="pt-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Link href="/" className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/otel" className="hover:text-foreground">
            {t("breadcrumb.hotel")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={listingHref} className="hover:text-foreground">
            {detail.region}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={listingHref} className="hover:text-foreground">
            {detail.city}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-brand-ink">{detail.name}</span>
        </nav>

        {/* Back pill */}
        <Link
          href={listingHref}
          className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#1a7ad9]/40 px-3 py-1 text-[13px] font-semibold text-[#1a7ad9] transition-colors hover:bg-[#1a7ad9]/5"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("allCityHotels", { city: detail.city })}
        </Link>

        {/* Title block */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 min-w-[34px] items-center justify-center rounded-md bg-brand-ink px-1.5 text-sm font-bold text-white">
                {detail.rating.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-foreground">
                {detail.ratingLabel}
              </span>
              <span className="text-sm text-muted-foreground">,</span>
              <a
                href="#yorumlar"
                onClick={(e) => scrollToId(e, "yorumlar")}
                className="text-sm font-semibold text-[#1a7ad9] hover:underline"
              >
                {t("reviewCountInline", { count: detail.reviewCount })}
              </a>
            </div>

            <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-foreground">
              {detail.name}
            </h1>

            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-sm text-foreground">{detail.district}</span>
              <button
                onClick={openMap}
                className="flex items-center gap-1 text-sm font-semibold text-[#1a7ad9] hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {t("showOnMap")}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface">
                <Share2 className="h-[18px] w-[18px]" />
                {t("share")}
              </button>
            </div>
            <a
              href="#odalar"
              onClick={(e) => scrollToId(e, "odalar")}
              className="cta-press rounded-md bg-brand px-10 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              {t("makeReservation")}
            </a>
          </div>
        </div>
      </Container>

      {/* Sub-nav tabs */}
      <div className="mt-4 border-b border-border">
        <Container>
          <div className="flex gap-7 overflow-x-auto">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => scrollToId(e, t.id)}
                className={cn(
                  "relative shrink-0 py-3 text-sm font-semibold transition-colors",
                  active === t.id
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-brand"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </a>
            ))}
          </div>
        </Container>
      </div>
    </div>
  );
}
