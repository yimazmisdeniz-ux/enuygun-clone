"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Car as CarIcon,
  Fuel,
  Settings2,
  User,
  Gauge,
  Wallet,
  MapPin,
  ChevronRight,
  ChevronDown,
  Star,
  CircleCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type Car } from "@/lib/rental";
import { formatCount } from "@/lib/currency";
import { useMoney } from "@/components/providers/CurrencyProvider";

function Spec({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block h-3.5 w-3.5">
            <Star className="absolute inset-0 h-3.5 w-3.5 text-star/40" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-star text-star" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function CarCard({ car, bookHref, days }: { car: Car; bookHref: string; days?: number }) {
  const [open, setOpen] = useState(false);
  const money = useMoney();
  const t = useTranslations("Rental");

  return (
    <article className="rounded-lg border border-border bg-white">
      <div className="flex flex-col gap-4 p-4 md:flex-row">
        {/* Car image (falls back to a generic icon if missing) */}
        <div className="relative flex h-[140px] w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-b from-[#f4f6f8] to-[#e9edf1] md:w-[210px]">
          {car.image ? (
            <Image
              src={car.image}
              alt={car.name}
              fill
              sizes="210px"
              className="object-contain p-2"
            />
          ) : (
            <CarIcon
              className="h-20 w-20"
              style={{ color: car.accent }}
              strokeWidth={1.2}
            />
          )}
        </div>

        {/* Middle */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-bold leading-tight text-foreground">
            {car.name}
          </h3>
          <p className="text-[13px] text-muted-foreground">{t("card.orSimilar")}</p>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <Spec icon={<Fuel className="h-4 w-4" />}>{car.fuel}</Spec>
            <Spec icon={<Settings2 className="h-4 w-4" />}>
              {car.transmission}
            </Spec>
            <Spec icon={<User className="h-4 w-4" />}>{t("card.minAge", { age: car.minAge })}</Spec>
            <Spec icon={<Gauge className="h-4 w-4" />}>
              {t("card.km", { count: formatCount(car.kmLimit, money.locale) })}
            </Spec>
            <Spec icon={<Wallet className="h-4 w-4" />}>
              {t("card.deposit", { amount: money.format(car.depositTL) })}
            </Spec>
            <Spec icon={<MapPin className="h-4 w-4" />}>{car.delivery}</Spec>
          </div>
        </div>

        {/* Price */}
        <div className="flex shrink-0 flex-col items-end md:w-[170px]">
          <p className="text-[13px] text-muted-foreground">
            {days && days !== 3
              ? t("card.daysPrice", { days })
              : t("card.threeDayPrice")}
          </p>
          <p className="leading-none">
            <span className="text-[26px] font-bold text-foreground">
              {money.format(car.totalTL)}
            </span>
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {t("card.dailyPrice", { amount: money.format(car.dailyTL) })}
          </p>
          {car.freeCancel && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-brand">
              <CircleCheck className="h-3.5 w-3.5" />
              {t("card.freeCancel")}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
        <span
          className="rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: car.accent }}
        >
          {car.supplier}
        </span>

        <span className="flex items-center gap-1.5">
          <span className="flex h-6 min-w-[34px] items-center justify-center rounded bg-brand-ink px-1.5 text-[12px] font-bold text-white">
            {car.rating.toFixed(1)}
          </span>
          <Stars value={car.rating} />
        </span>

        <button className="text-[13px] font-semibold text-[#1a7ad9] hover:underline">
          {t("card.reviews", { count: formatCount(car.reviewCount, money.locale) })}
        </button>

        <span className="flex items-center gap-1 text-[13px] font-semibold text-[#1a7ad9]">
          <MapPin className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{car.location}</span>
        </span>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-0.5 text-[13px] font-semibold text-foreground hover:text-[#1a7ad9]"
        >
          {t("card.detail")}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <Link
          href={bookHref}
          className="cta-press ml-auto flex items-center gap-1 rounded-md bg-brand px-6 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {t("card.bookNow")}
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 text-[13px] text-muted-foreground">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <p>{t("card.kmLimit", { count: formatCount(car.kmLimit, money.locale) })}</p>
            <p>{t("card.fuelPolicy")}</p>
            <p>{t("card.minDriverAge", { age: car.minAge })}</p>
            <p>
              {t("card.cancellation", {
                value: car.freeCancel ? t("card.freeCancelValue") : t("card.nonRefundable"),
              })}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
