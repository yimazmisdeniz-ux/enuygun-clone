"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X, MapPin, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { MapView } from "@/components/map/MapView";
import { getHotelCoords, buildHotelHref, type HotelResult } from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";
import type { LatLng, MapPoint } from "@/components/map/types";

const FALLBACK_CENTER: LatLng = { lat: 35.3416, lng: 33.3192 };

export function SearchMapModal({
  open,
  onClose,
  hotels,
  title,
  location,
  checkin,
  checkout,
  guests,
}: {
  open: boolean;
  onClose: () => void;
  hotels: HotelResult[];
  title: string;
  location: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panToId, setPanToId] = useState<string | null>(null);
  const money = useMoney();
  const t = useTranslations("Search");

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

  const rawPoints = hotels.map((h) => {
    const c = h.lat != null && h.lng != null ? { lat: h.lat, lng: h.lng } : getHotelCoords(h.slug);
    const popup = (
      <div className="w-[240px] overflow-hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md">
          <Image src={h.images[0]} alt={h.name} fill className="object-cover" sizes="240px" />
          <span className="absolute left-2 top-2 flex h-7 min-w-[34px] items-center justify-center rounded-md bg-brand-ink px-1.5 text-sm font-bold text-white">
            {h.rating.toFixed(1)}
          </span>
        </div>
        <h3 className="mt-2 text-[14px] font-bold leading-snug text-foreground">{h.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#1a7ad9]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {h.district}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground">
              {t("map.totalForNights", { n: h.nights })}
            </p>
            <p className="text-[18px] font-bold leading-none text-foreground">
              {money.format(h.priceTL)}
            </p>
          </div>
          <Link
            href={buildHotelHref(location, h.slug, { checkin, checkout, guests })}
            className="cta-press flex items-center gap-1 rounded-md bg-brand px-4 py-1.5 text-[13px] font-bold !text-white no-underline transition-colors hover:bg-brand-hover"
          >
            {t("card.select")}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
    return { id: h.slug, lat: c.lat, lng: c.lng, label: money.format(h.priceTL), popup };
  });

  // De-stack markers that share the same coordinate (e.g. hotels missing real
  // coords all fall back to a single center). Fan duplicates onto a small ring
  // so every hotel stays individually clickable instead of hiding in a cluster.
  const seen = new Map<string, number>();
  const points: MapPoint[] = rawPoints.map((p) => {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n === 0) return { ...p, kind: "hotel" as const };
    const radius = 0.0018 * (1 + Math.floor((n - 1) / 8));
    const angle = (n % 8) * (Math.PI / 4);
    return {
      ...p,
      lat: p.lat + radius * Math.cos(angle),
      lng: p.lng + radius * Math.sin(angle),
      kind: "hotel" as const,
    };
  });

  const center: LatLng = points.length
    ? {
        lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
        lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
      }
    : FALLBACK_CENTER;

  return (
    <div className="fixed inset-0 z-50 bg-black/85" onClick={onClose}>
      {/* Top bar */}
      <div
        className="absolute inset-x-0 top-0 z-[60] flex h-14 items-center justify-between bg-white px-4 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-[15px] font-bold text-foreground">
          {title}{" "}
          <span className="font-normal text-muted-foreground">
            · {t("map.hotelCount", { n: hotels.length })}
          </span>
        </span>
        <button
          aria-label={t("map.close")}
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
        <MapView
          points={points}
          center={center}
          cluster
          fitToPoints
          activeId={activeId}
          panToId={panToId}
          onMarkerClick={(id) => {
            setActiveId(id);
            setPanToId(id);
          }}
          onMarkerHover={(id) => id && setActiveId(id)}
        />
      </div>
    </div>
  );
}
