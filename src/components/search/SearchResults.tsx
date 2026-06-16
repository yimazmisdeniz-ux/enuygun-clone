"use client";

import { useMemo, useState } from "react";
import { Share2, Info, SlidersHorizontal, Map as MapIcon, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { ResultsSearchBar } from "./ResultsSearchBar";
import { SortTabs, type SortKey } from "./SortTabs";
import { FiltersSidebar, MapCard } from "./FiltersSidebar";
import { HotelResultCard } from "./HotelResultCard";
import { SearchMapModal } from "./SearchMapModal";
import { nightsBetween, type HotelResult } from "@/lib/data";
import { cn } from "@/lib/utils";

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
  // Live dates mirrored from the search bar so the cards reprice instantly as
  // soon as the calendar changes — before any "search again" navigation.
  const [selCheckIn, setSelCheckIn] = useState(checkin);
  const [selCheckOut, setSelCheckOut] = useState(checkout);
  const selectedNights =
    selCheckIn && selCheckOut ? nightsBetween(selCheckIn, selCheckOut) : undefined;
  const [sort, setSort] = useState<SortKey>("ilgi");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  // Mobile-only: filter panel collapsed by default; desktop always shows it.
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        onDatesChange={(ci, co) => {
          setSelCheckIn(ci);
          setSelCheckOut(co);
        }}
      />

      <Container className="py-5">
        {/* Mobile controls — sit directly above the filter, search-again band is
            just above this. Filter toggles open/closed; map is a compact button. */}
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-bold text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("filters.title")}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                filtersOpen && "rotate-180"
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-white px-3.5 py-2.5 text-sm font-semibold text-foreground"
          >
            <MapIcon className="h-4 w-4 text-brand" />
            {t("map.show")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside
            className={cn(
              "flex-col gap-4 md:flex",
              filtersOpen ? "flex" : "hidden"
            )}
          >
            {/* Big map preview is desktop-only; mobile uses the compact button above. */}
            <div className="hidden md:block">
              <MapCard onClick={() => setMapOpen(true)} />
            </div>

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
                    checkin={selCheckIn ?? checkin}
                    checkout={selCheckOut ?? checkout}
                    guests={guests}
                    selectedNights={selectedNights}
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
        checkin={selCheckIn ?? checkin}
        checkout={selCheckOut ?? checkout}
        guests={guests}
      />
    </>
  );
}
