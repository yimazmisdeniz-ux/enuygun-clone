"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { MapCard } from "@/components/search/FiltersSidebar";
import { MapView } from "@/components/map/MapView";
import type { LatLng, MapPoint } from "@/components/map/types";
import { useTranslations } from "next-intl";
import { computeCarFacets, type Car } from "@/lib/rental";
import { formatCount } from "@/lib/currency";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { RentalFilters } from "./RentalFilters";
import { CarCard } from "./CarCard";

type SortKey = "onerilen" | "fiyat-artan" | "fiyat-azalan";

const SABIHA: LatLng = { lat: 40.8986, lng: 29.3092 };

function toggle(set: Set<string>, name: string): Set<string> {
  const next = new Set(set);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return next;
}

export function RentalResults({ pickup, cars, days }: { pickup: string; cars: Car[]; days?: number }) {
  const [selTransmissions, setT] = useState<Set<string>>(new Set());
  const [selSuppliers, setS] = useState<Set<string>>(new Set());
  const [selClasses, setC] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("onerilen");
  const [mapOpen, setMapOpen] = useState(false);
  const money = useMoney();
  const t = useTranslations("Rental");

  const { transmissions: transmissionFacets, suppliers: supplierFacets, classes: classFacets } =
    useMemo(() => computeCarFacets(cars), [cars]);

  const anyFilter =
    selTransmissions.size > 0 || selSuppliers.size > 0 || selClasses.size > 0;

  const visible = useMemo(() => {
    const list = cars.filter((c) => {
      if (selTransmissions.size && !selTransmissions.has(c.transmission))
        return false;
      if (selSuppliers.size && !selSuppliers.has(c.supplier)) return false;
      if (selClasses.size && !selClasses.has(c.carClass)) return false;
      return true;
    });
    if (sort === "fiyat-artan")
      return [...list].sort((a, b) => a.totalTL - b.totalTL);
    if (sort === "fiyat-azalan")
      return [...list].sort((a, b) => b.totalTL - a.totalTL);
    return list;
  }, [cars, selTransmissions, selSuppliers, selClasses, sort]);

  const count = anyFilter ? visible.length : cars.length;

  function bookHref(slug: string) {
    const params = new URLSearchParams({ car: slug, pickup });
    if (days) params.set("days", String(days));
    return `/arac-kiralama/kiralama?${params.toString()}`;
  }

  return (
    <Container className="py-5">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <MapCard onClick={() => setMapOpen(true)} />
          <RentalFilters
            transmissions={transmissionFacets}
            suppliers={supplierFacets}
            classes={classFacets}
            selTransmissions={selTransmissions}
            selSuppliers={selSuppliers}
            selClasses={selClasses}
            onToggleTransmission={(n) => setT((s) => toggle(s, n))}
            onToggleSupplier={(n) => setS((s) => toggle(s, n))}
            onToggleClass={(n) => setC((s) => toggle(s, n))}
            onClear={() => {
              setT(new Set());
              setS(new Set());
              setC(new Set());
            }}
          />
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Count + sort */}
          <div className="flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-foreground">
              {t("results.found", { count: formatCount(count, money.locale) })}
            </h1>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {t("results.sort")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer rounded-md border border-border bg-white px-2 py-1.5 text-sm font-semibold text-foreground outline-none"
              >
                <option value="onerilen">{t("results.sortRecommended")}</option>
                <option value="fiyat-artan">{t("results.sortPriceAsc")}</option>
                <option value="fiyat-azalan">{t("results.sortPriceDesc")}</option>
              </select>
              <Info className="h-4 w-4" />
            </label>
          </div>

          {/* Cars */}
          <div className="mt-5 flex flex-col gap-4">
            {visible.length === 0 ? (
              <div className="rounded-lg border border-border bg-white p-10 text-center text-sm text-muted-foreground">
                {t("results.empty")}
              </div>
            ) : (
              visible.map((c, i) => (
                <div key={c.slug} className="flex flex-col gap-4">
                  <CarCard car={c} bookHref={bookHref(c.slug)} days={days} />
                  {i === 1 && (
                    <div className="flex items-center justify-between rounded-md border border-[#f4c20d] bg-white px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">
                        {t("results.axessBanner")}
                      </span>
                      <span className="text-[15px] font-extrabold italic text-foreground">
                        a<span className="text-[#e2001a]">i</span>xess
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {mapOpen && (
        <RentalMapModal pickup={pickup} onClose={() => setMapOpen(false)} />
      )}
    </Container>
  );
}

function RentalMapModal({
  pickup,
  onClose,
}: {
  pickup: string;
  onClose: () => void;
}) {
  const t = useTranslations("Rental");
  useEffect(() => {
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
  }, [onClose]);

  const points: MapPoint[] = [
    {
      id: "pickup",
      lat: SABIHA.lat,
      lng: SABIHA.lng,
      label: t("results.deliveryPoint"),
      kind: "hotel",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85" onClick={onClose}>
      <div
        className="absolute inset-x-0 top-0 z-[60] flex h-14 items-center justify-between bg-white px-4 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-[15px] font-bold text-foreground">
          {pickup}
        </span>
        <button
          aria-label={t("results.close")}
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 top-14"
        onClick={(e) => e.stopPropagation()}
      >
        <MapView points={points} center={SABIHA} zoom={13} />
      </div>
    </div>
  );
}
