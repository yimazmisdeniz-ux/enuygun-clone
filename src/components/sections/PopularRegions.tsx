"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { popularRegions, type Region } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Tile component                                                      */
/* ------------------------------------------------------------------ */

interface TileProps {
  region: Region;
  sizes: string;
  className?: string;
}

function RegionTile({ region, sizes, className = "" }: TileProps) {
  const t = useTranslations("Home");
  // Localized display name (e.g. "Kıbrıs" → "Cyprus" in en); falls back to the
  // raw data name for any slug without a translation entry.
  const name = t.has(`popularRegions.regions.${region.slug}`)
    ? t(`popularRegions.regions.${region.slug}`)
    : region.name;
  return (
    <Link
      href={`/otel/${region.slug}`}
      className={`group relative block overflow-hidden rounded-lg ${className}`}
    >
      {/* Full-bleed image */}
      <Image
        src={region.image}
        alt={name}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Dark gradient overlay — bottom 60% */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Text + chip */}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-[18px] font-bold leading-tight text-white drop-shadow-sm">
          {name}
        </p>
        <span className="mt-1 inline-block rounded-sm bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {t("popularRegions.hotelChip", { count: region.hotelCount.toLocaleString("tr-TR") })}
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                         */
/* ------------------------------------------------------------------ */

export function PopularRegions() {
  const t = useTranslations("Home");

  return (
    <section>
      <Container>
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[20px] font-bold leading-snug text-foreground">
            {t("popularRegions.title")}
          </h2>
        </div>

        {/* Grid — 5 regions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {popularRegions.map((r) => (
            <RegionTile
              key={r.slug}
              region={r}
              sizes="(max-width: 768px) 50vw, 20vw"
              className="relative aspect-[3/4]"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
