"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type SortKey =
  | "fiyat-artan"
  | "fiyat-azalan"
  | "ilgi"
  | "puan-azalan"
  | "puan-fiyat";

const sortOrder: { key: SortKey; labelKey: string }[] = [
  { key: "fiyat-artan", labelKey: "priceAsc" },
  { key: "fiyat-azalan", labelKey: "priceDesc" },
  { key: "ilgi", labelKey: "recommended" },
  { key: "puan-azalan", labelKey: "ratingDesc" },
  { key: "puan-fiyat", labelKey: "ratingPrice" },
];

export function SortTabs({
  active,
  onChange,
}: {
  active: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const t = useTranslations("Search");
  return (
    <div className="flex flex-wrap gap-2">
      {sortOrder.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            active === opt.key
              ? "bg-surface text-foreground ring-1 ring-inset ring-border"
              : "text-brand-ink hover:bg-surface"
          )}
        >
          {t(`sort.${opt.labelKey}`)}
        </button>
      ))}
    </div>
  );
}
