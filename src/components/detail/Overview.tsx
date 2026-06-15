"use client";

import { useState } from "react";
import { Landmark, Plane, Waves, Building2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { MapCard } from "@/components/search/FiltersSidebar";
import { cn } from "@/lib/utils";
import { useDetailMap } from "./DetailMapContext";
import type { POI } from "@/lib/data";
import { useTranslations } from "next-intl";

const POI_ICON = {
  landmark: Landmark,
  airport: Plane,
  beach: Waves,
  center: Building2,
} as const;

export function Overview({
  description,
  pois,
}: {
  description: string;
  pois: POI[];
}) {
  const t = useTranslations("Detail");
  const [expanded, setExpanded] = useState(false);
  const { open: openMap } = useDetailMap();

  return (
    <section id="otel" className="scroll-mt-20">
      <Container className="py-7">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]">
          {/* Description */}
          <div>
            <p
              className={cn(
                "text-[15px] leading-relaxed text-foreground",
                !expanded && "line-clamp-6"
              )}
            >
              {description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-semibold text-[#1a7ad9] hover:underline"
            >
              {expanded ? t("overview.showLess") : t("overview.readMore")}
            </button>
          </div>

          {/* Map + POIs */}
          <div>
            <MapCard onClick={openMap} />
            <ul className="mt-4 flex flex-col">
              {pois.map((p) => {
                const Icon = POI_ICON[p.type];
                return (
                  <li
                    key={p.name}
                    className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
                  >
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                      {p.name}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {p.distance}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
