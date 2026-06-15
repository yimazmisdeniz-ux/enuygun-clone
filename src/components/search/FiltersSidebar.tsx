"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ArrowRight, Map as MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Option = { name: string; count: number };

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border px-4 py-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[15px] font-bold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function FiltersSidebar({
  regions,
  selectedRegion,
  onSelectRegion,
  boards,
  selectedBoards,
  onToggleBoard,
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
}: {
  regions: Option[];
  selectedRegion: string | null;
  onSelectRegion: (name: string) => void;
  boards: Option[];
  selectedBoards: Set<string>;
  onToggleBoard: (name: string) => void;
  priceMin: string;
  priceMax: string;
  onPriceMin: (v: string) => void;
  onPriceMax: (v: string) => void;
}) {
  const t = useTranslations("Search");
  const [showAllRegions, setShowAllRegions] = useState(false);
  const visibleRegions = showAllRegions ? regions : regions.slice(0, 5);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      {/* Panel header */}
      <div className="px-4 py-3.5">
        <span className="text-[17px] font-bold text-foreground">{t("filters.title")}</span>
      </div>

      {/* Price */}
      <Section title={t("filters.totalRoomPrice")}>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={priceMin}
            onChange={(e) => onPriceMin(e.target.value)}
            placeholder={t("filters.minPrice")}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
          />
          <input
            type="number"
            inputMode="numeric"
            value={priceMax}
            onChange={(e) => onPriceMax(e.target.value)}
            placeholder={t("filters.maxPrice")}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
          />
          <button
            aria-label={t("filters.applyPrice")}
            className="flex items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {t("filters.applyPrice")}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </Section>

      {/* Region — single select */}
      <Section title={t("filters.region")}>
        <ul className="flex flex-col gap-2.5">
          {visibleRegions.map((r) => {
            const checked = selectedRegion === r.name;
            return (
              <li key={r.name}>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                      checked ? "border-brand" : "border-muted-foreground/50"
                    )}
                  >
                    {checked && (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="region"
                    checked={checked}
                    onChange={() => onSelectRegion(r.name)}
                    className="sr-only"
                  />
                  <span className="text-sm text-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground">({r.count})</span>
                </label>
              </li>
            );
          })}
        </ul>
        {regions.length > 5 && (
          <button
            onClick={() => setShowAllRegions((v) => !v)}
            className="mt-3 text-sm font-semibold text-brand hover:underline"
          >
            {showAllRegions
              ? t("filters.showLess")
              : t("filters.showMore", { n: regions.length })}
          </button>
        )}
      </Section>

      {/* Board type — multi select */}
      <Section title={t("filters.boardType")}>
        <ul className="flex flex-col gap-2.5">
          {boards.map((b) => {
            const checked = selectedBoards.has(b.name);
            return (
              <li key={b.name}>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-brand bg-brand"
                        : "border-muted-foreground/50 bg-white"
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                        <path
                          d="M2.5 6.5l2.5 2.5 4.5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleBoard(b.name)}
                    className="sr-only"
                  />
                  <span className="text-sm text-foreground">{b.name}</span>
                  <span className="text-xs text-muted-foreground">({b.count})</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

export function MapCard({
  onClick,
  active,
}: {
  onClick?: () => void;
  active?: boolean;
}) {
  const t = useTranslations("Search");
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block h-[160px] w-full overflow-hidden rounded-lg border border-border"
    >
      {/* Stylised map placeholder */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #dceada 0%, #e8efe4 40%, #cfe0ea 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute left-6 top-8 h-16 w-24 rotate-6 rounded-full bg-[#bcd6e8]/70" />
      <div className="absolute bottom-4 right-5 h-10 w-20 -rotate-12 rounded-full bg-[#c6dcc0]/80" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-2 rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-md">
          <MapIcon className="h-4 w-4" />
          {active ? t("map.hide") : t("map.show")}
        </span>
      </div>
    </button>
  );
}
