"use client";

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
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { pickupAddress, type RentalContext } from "@/lib/rental";
import { formatCount } from "@/lib/currency";
import { useMoney } from "@/components/providers/CurrencyProvider";

function CarThumb({
  accent,
  image,
  name,
  className,
}: {
  accent: string;
  image?: string;
  name?: string;
  className?: string;
}) {
  const t = useTranslations("Rental");
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-b from-[#f4f6f8] to-[#e9edf1] ${className ?? ""}`}
    >
      {image ? (
        <Image src={image} alt={name ?? t("car")} fill sizes="150px" className="object-contain p-1.5" />
      ) : (
        <CarIcon className="h-16 w-16" style={{ color: accent }} strokeWidth={1.2} />
      )}
    </div>
  );
}

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

export function CarInfoCard({
  ctx,
  showTags = false,
}: {
  ctx: RentalContext;
  showTags?: boolean;
}) {
  const { car } = ctx;
  const money = useMoney();
  const t = useTranslations("Rental");
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="mb-3 text-[13px] font-semibold text-muted-foreground">
        {t("info.title")}
      </p>
      {showTags && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded bg-[#1a7ad9] px-2 py-1 text-[11px] font-semibold text-white">
            {t("info.tagCancel")}
          </span>
          <span className="rounded bg-[#1a7ad9]/10 px-2 py-1 text-[11px] font-semibold text-[#1a7ad9]">
            {t("info.tagHighRated")}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <CarThumb
          accent={car.accent}
          image={car.image}
          name={car.name}
          className="h-[90px] w-full sm:w-[150px]"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-bold leading-tight text-foreground">
            {car.name}
          </h3>
          <p className="text-[13px] text-muted-foreground">{t("card.orSimilar")}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            <Spec icon={<Fuel className="h-4 w-4" />}>{car.fuel}</Spec>
            <Spec icon={<Settings2 className="h-4 w-4" />}>
              {car.transmission}
            </Spec>
            <Spec icon={<User className="h-4 w-4" />}>{t("card.minAge", { age: car.minAge })}</Spec>
            <Spec icon={<Gauge className="h-4 w-4" />}>
              {t("info.km", { count: formatCount(car.kmLimit, money.locale) })}
            </Spec>
            <Spec icon={<Wallet className="h-4 w-4" />}>
              {t("card.deposit", { amount: money.format(car.depositTL) })}
            </Spec>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryColumn({
  title,
  date,
  car,
}: {
  title: string;
  date: string;
  car: RentalContext["car"];
}) {
  const t = useTranslations("Rental");
  return (
    <div className="flex-1">
      <p className="text-[13px] font-bold text-foreground">{title}</p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-foreground">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        {date}
      </p>
      <p className="mt-2 flex items-start gap-2 text-[13px] text-foreground">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          {car.location}
          <br />
          <span className="text-muted-foreground">{pickupAddress()}</span>
        </span>
      </p>
      <p className="mt-2 flex items-start gap-2 text-[13px] text-foreground">
        <CarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          {t("delivery.deliveryLabel", { value: car.delivery })}
          <br />
          <span className="text-muted-foreground">
            {t("delivery.deliveryNote")}
          </span>
        </span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-foreground">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        {t("delivery.workingHours")}
      </p>
    </div>
  );
}

export function FirmDeliveryCard({
  ctx,
  defaultOpen = true,
}: {
  ctx: RentalContext;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { car } = ctx;
  const money = useMoney();
  const t = useTranslations("Rental");
  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <span className="text-[15px] font-bold text-foreground">
          {t("delivery.firmTitle")}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-6 sm:flex-row">
            <DeliveryColumn
              title={t("delivery.pickup")}
              date={`${ctx.checkinDate} ${ctx.checkinTime}`}
              car={car}
            />
            <DeliveryColumn
              title={t("delivery.dropoff")}
              date={`${ctx.checkoutDate} ${ctx.checkoutTime}`}
              car={car}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <span
              className="rounded px-2 py-1 text-[11px] font-bold uppercase text-white"
              style={{ backgroundColor: car.accent }}
            >
              {car.supplier}
            </span>
            <span className="flex h-6 min-w-[34px] items-center justify-center rounded bg-brand-ink px-1.5 text-[12px] font-bold text-white">
              {car.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="h-4 w-4 fill-star text-star" />
              <span className="text-[13px] text-muted-foreground">
                {t("card.reviews", { count: formatCount(car.reviewCount, money.locale) })}
              </span>
            </span>
            <div className="ml-auto flex gap-2">
              <button className="rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-surface">
                {t("delivery.terms")}
              </button>
              <button className="rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-surface">
                {t("delivery.rentalConditions")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CarThumb };
