"use client";

import { useRef } from "react";
import { Info, Percent, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { rentalCampaigns } from "@/lib/rental";
import { cn } from "@/lib/utils";

const BRAND_STYLE: Record<string, string> = {
  BOOKERA: "text-brand",
  Europcar: "bg-brand text-white px-1.5 py-0.5 rounded",
  Goldcar: "bg-[#f4c20d] text-black px-1.5 py-0.5 rounded",
  Praticar: "text-[#1a7ad9]",
};

export function CampaignChips() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Rental");

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rentalCampaigns.map((c, i) => (
          <div
            key={i}
            className={cn(
              "flex w-[200px] shrink-0 flex-col rounded-lg border p-3",
              c.highlight
                ? "items-center justify-center border-[#bcd9f5] bg-[#eef6fe] text-center"
                : "border-border bg-white"
            )}
          >
            {c.highlight ? (
              <>
                <Percent className="mb-1 h-5 w-5 text-[#1a7ad9]" />
                <span className="text-[13px] font-bold text-foreground">
                  {c.title}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[12px] font-extrabold",
                      BRAND_STYLE[c.brand] ?? "text-foreground"
                    )}
                  >
                    {c.brand}
                  </span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold text-foreground">
                  {c.title}
                </p>
                <button className="mt-1.5 text-left text-[12px] font-semibold text-[#1a7ad9] hover:underline">
                  {t("campaigns.apply")}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <button
        aria-label={t("campaigns.more")}
        onClick={() =>
          scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })
        }
        className="absolute -right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-md hover:bg-surface"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
