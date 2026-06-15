"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, MapPin, Images } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import {
  getHotelCoords,
  poiCoords,
  type HotelDetail,
} from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";
import type { MapPoint } from "@/components/map/types";
import { useTranslations } from "next-intl";

export function DetailMapModal({
  open,
  onClose,
  detail,
}: {
  open: boolean;
  onClose: () => void;
  detail: HotelDetail;
}) {
  const t = useTranslations("Detail");
  const [imgIndex, setImgIndex] = useState(0);
  const money = useMoney();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const center =
    detail.lat != null && detail.lng != null
      ? { lat: detail.lat, lng: detail.lng }
      : getHotelCoords(detail.slug);
  const cheapest = detail.rooms.length
    ? Math.min(...detail.rooms.map((r) => r.option.priceTL))
    : 0;
  const gallery = detail.gallery.length ? detail.gallery : [""];
  const amenities = detail.rooms[0]?.amenities ?? [];

  const points: MapPoint[] = [
    {
      id: detail.slug,
      lat: center.lat,
      lng: center.lng,
      label: cheapest ? money.format(cheapest) : detail.name,
      kind: "hotel",
    },
    ...detail.pois.map((p, i) => {
      const c = poiCoords(center, p.type);
      return {
        id: `poi-${i}`,
        lat: c.lat,
        lng: c.lng,
        label: p.name,
        kind: "poi" as const,
        poiType: p.type,
      };
    }),
  ];

  function bookNow() {
    onClose();
    const el = document.getElementById("odalar");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85" onClick={onClose}>
      {/* Top bar */}
      <div
        className="absolute inset-x-0 top-0 z-[60] flex h-14 items-center justify-between bg-white px-4 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-[15px] font-bold text-foreground">
          {detail.name}
        </span>
        <button
          aria-label={t("close")}
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Map area */}
      <div
        className="absolute inset-x-0 bottom-0 top-14"
        onClick={(e) => e.stopPropagation()}
      >
        <MapView points={points} center={center} zoom={14} />

        {/* Overlay card */}
        <div className="absolute left-3 top-3 z-[60] w-[330px] max-w-[calc(100%-24px)] overflow-hidden rounded-lg bg-white shadow-xl">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={gallery[imgIndex]}
              alt={detail.name}
              fill
              className="object-cover"
              sizes="330px"
            />
            {gallery.length > 1 && (
              <>
                <button
                  aria-label={t("previous")}
                  onClick={() =>
                    setImgIndex((i) => (i - 1 + gallery.length) % gallery.length)
                  }
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  aria-label={t("next")}
                  onClick={() =>
                    setImgIndex((i) => (i + 1) % gallery.length)
                  }
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Images className="h-3.5 w-3.5" />
                  {imgIndex + 1}/{gallery.length}
                </span>
              </>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-[16px] font-bold leading-snug text-foreground">
              {detail.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#1a7ad9]">
              <MapPin className="h-4 w-4 shrink-0" />
              {detail.district}
            </p>
            {amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-md border border-border px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            {cheapest > 0 && (
              <>
                <p className="mt-3 text-[12px] text-muted-foreground">
                  {t("map.totalForThreeNights")}
                </p>
                <p className="text-[22px] font-bold leading-none text-foreground">
                  {money.format(cheapest)}
                </p>
              </>
            )}
            <button
              onClick={bookNow}
              className="cta-press mt-3 w-full rounded-md bg-brand py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              {t("map.bookNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
