"use client";

import { useMemo, useState } from "react";
import { Share2, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ResultsSearchBar } from "./ResultsSearchBar";
import { SortTabs, type SortKey } from "./SortTabs";
import { FiltersSidebar, MapCard } from "./FiltersSidebar";
import { HotelResultCard } from "./HotelResultCard";
import { SearchMapModal } from "./SearchMapModal";
import type { HotelResult } from "@/lib/data";

/** Hero hotel pinned to the top of the recommended sort and badged "best choice". */
const PINNED_SLUG = "nirvana-mediterranean-excellence-all-inclusive-351301";

function countBy(list: HotelResult[], key: (h: HotelResult) => string) {
  const map = new Map<string, number>();
  for (const h of list) {
    const k = key(h);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map, ([name, count]) => ({ name, count }));
}

function sortHotels(list: HotelResult[], sort: SortKey): HotelResult[] {
  const arr = [...list];
  switch (sort) {
    case "fiyat-artan":
      return arr.sort((a, b) => a.priceTL - b.priceTL);
    case "fiyat-azalan":
      return arr.sort((a, b) => b.priceTL - a.priceTL);
    case "puan-azalan":
      return arr.sort((a, b) => b.rating - a.rating);
    case "puan-fiyat":
      return arr.sort((a, b) => b.rating - a.rating || a.priceTL - b.priceTL);
    case "ilgi":
    default:
      // Pinned hero first, then most-reviewed; rating then price as tie-breakers.
      return arr.sort(
        (a, b) =>
          Number(b.slug === PINNED_SLUG) - Number(a.slug === PINNED_SLUG) ||
          b.reviewCount - a.reviewCount ||
          b.rating - a.rating ||
          a.priceTL - b.priceTL
      );
  }
}

export function SearchResults({
  title,
  hotels,
  location,
  destination,
  checkin,
  checkout,
  dates,
  guests,
}: {
  title: string;
  hotels: HotelResult[];
  location: string;
  destination?: string;
  checkin?: string;
  checkout?: string;
  dates?: string;
  guests?: string;
}) {
  const t = useTranslations("Search");
  const [sort, setSort] = useState<SortKey>("ilgi");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  const regionOptions = useMemo(
    () =>
      countBy(hotels, (h) => h.region).sort((a, b) => b.count - a.count),
    [hotels]
  );
  const boardOptions = useMemo(
    () => countBy(hotels, (h) => h.board).sort((a, b) => b.count - a.count),
    [hotels]
  );

  const visible = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    const filtered = hotels.filter((h) => {
      if (selectedRegion && h.region !== selectedRegion) return false;
      if (selectedBoards.size && !selectedBoards.has(h.board)) return false;
      if (min !== null && h.priceTL < min) return false;
      if (max !== null && h.priceTL > max) return false;
      return true;
    });
    return sortHotels(filtered, sort);
  }, [hotels, selectedRegion, selectedBoards, priceMin, priceMax, sort]);

  function selectRegion(name: string) {
    setSelectedRegion((cur) => (cur === name ? null : name));
  }
  function toggleBoard(name: string) {
    setSelectedBoards((cur) => {
      const next = new Set(cur);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <>
      <ResultsSearchBar
        destination={destination}
        dates={dates}
        checkin={checkin}
        checkout={checkout}
        guests={guests}
      />

      <Container className="py-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <MapCard onClick={() => setMapOpen(true)} />

            <FiltersSidebar
              regions={regionOptions}
              selectedRegion={selectedRegion}
              onSelectRegion={selectRegion}
              boards={boardOptions}
              selectedBoards={selectedBoards}
              onToggleBoard={toggleBoard}
              priceMin={priceMin}
              priceMax={priceMax}
              onPriceMin={setPriceMin}
              onPriceMax={setPriceMax}
            />
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-foreground">{title}</h1>
                <button
                  aria-label={t("share")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
                >
                  <Share2 className="h-[18px] w-[18px]" />
                </button>
              </div>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {t("sortCriteria")}
                <Info className="h-4 w-4" />
              </button>
            </div>

            {/* Sort tabs */}
            <div className="mt-4">
              <SortTabs active={sort} onChange={setSort} />
            </div>

            {/* Results */}
            <div className="mt-5 flex flex-col gap-4">
              {visible.length === 0 ? (
                <div className="rounded-lg border border-border bg-white p-10 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </div>
              ) : (
                visible.map((h) => (
                  <HotelResultCard
                    key={h.slug}
                    hotel={h}
                    location={location}
                    checkin={checkin}
                    checkout={checkout}
                    guests={guests}
                    bestOption={h.slug === PINNED_SLUG}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </Container>

      <SearchMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        hotels={visible}
        title={title}
        location={location}
        checkin={checkin}
        checkout={checkout}
        guests={guests}
      />
    </>
  );
}
