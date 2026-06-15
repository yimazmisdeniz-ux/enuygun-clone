"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  BedDouble,
  Users,
  Moon,
  Ban,
} from "lucide-react";
import {
  formatTrDateLong,
  formatTrWeekday,
  type BookingContext,
} from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { Modal } from "@/components/ui/Modal";
import { PaymentLogos } from "./PaymentLogos";

function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("Booking");
  const [i, setI] = useState(0);
  const total = images.length;
  return (
    <div className="group relative h-[150px] w-full overflow-hidden rounded-t-lg">
      <Image
        src={images[i]}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 360px"
      />
      {total > 1 && (
        <>
          <button
            aria-label={t("summary.prev")}
            onClick={() => setI((v) => (v - 1 + total) % total)}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label={t("summary.next")}
            onClick={() => setI((v) => (v + 1) % total)}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function DateCol({ label, iso, time }: { label: string; iso: string; time: string }) {
  const locale = useLocale();
  return (
    <div className="flex-1">
      <p className="text-[12px] font-bold text-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-foreground">
        {formatTrDateLong(iso, locale)}
      </p>
      <p className="text-[12px] text-muted-foreground">{formatTrWeekday(iso, locale)}</p>
      <p className="text-[12px] text-muted-foreground">{time}</p>
    </div>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function PriceBreakdown({ ctx }: { ctx: BookingContext }) {
  const money = useMoney();
  const t = useTranslations("Booking");
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h3 className="text-[15px] font-bold text-foreground">{t("price.totalAmount")}</h3>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-brand">{t("price.accommodation")}</dt>
          <dd className="text-muted-foreground">{money.format(ctx.oldPriceTL, 2)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-brand">
            {t("price.discount", { pct: ctx.room.option.discountPct })}
          </dt>
          <dd className="font-semibold text-brand">
            -{money.format(ctx.discountTL, 2)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-end justify-between rounded-md bg-surface px-3 py-2.5">
        <span className="text-[13px] font-bold text-foreground">
          {t("price.payableAmount")}
        </span>
        <span className="text-right">
          <span className="block text-[11px] text-muted-foreground line-through">
            {money.format(ctx.oldPriceTL, 2)}
          </span>
          <span className="text-[18px] font-bold text-foreground">
            {money.format(ctx.priceTL, 2)}
          </span>
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {t("price.taxesIncluded")}
      </p>
    </div>
  );
}

export function BookingSummary({
  ctx,
  showPrice = true,
}: {
  ctx: BookingContext;
  showPrice?: boolean;
}) {
  const { hotel, room } = ctx;
  const t = useTranslations("Booking");
  const [rulesOpen, setRulesOpen] = useState(false);
  const hotelRules = [
    { title: t("rules.checkInOut.title"), body: t("rules.checkInOut.body") },
    { title: t("rules.childExtraBed.title"), body: t("rules.childExtraBed.body") },
    { title: t("rules.pets.title"), body: t("rules.pets.body") },
    { title: t("rules.payment.title"), body: t("rules.payment.body") },
    { title: t("rules.cancellation.title"), body: t("rules.cancellation.body") },
  ];
  return (
    <div className="space-y-4">
      {/* Hotel info card */}
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Carousel images={ctx.gallery} alt={hotel.name} />
        <div className="p-4">
          <h2 className="text-[15px] font-bold leading-snug text-foreground">
            {hotel.name}
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {hotel.district}
          </p>

          <div className="mt-3 flex gap-3 rounded-md border border-border p-3">
            <DateCol label={t("summary.checkIn")} iso={ctx.checkin} time="14:00" />
            <div className="w-px self-stretch bg-border" />
            <DateCol label={t("summary.checkOut")} iso={ctx.checkout} time="12:00" />
          </div>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <InfoRow icon={<UtensilsCrossed className="h-4 w-4" />}>
              {room.option.board}
            </InfoRow>
            <InfoRow icon={<BedDouble className="h-4 w-4" />}>
              {t("summary.roomCountWithName", { count: ctx.roomCount, name: room.name })}
            </InfoRow>
            <InfoRow icon={<Users className="h-4 w-4" />}>
              {t("summary.adults", { count: ctx.adults })}
              <Moon className="mx-1 inline h-3.5 w-3.5 text-muted-foreground" />
              {t("summary.roomsNights", { rooms: ctx.roomCount, nights: ctx.nights })}
            </InfoRow>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[13px] font-semibold text-foreground">
            <Ban className="h-4 w-4 text-muted-foreground" />
            {room.option.cancellable ? t("summary.freeCancellation") : t("summary.nonRefundable")}
          </div>

          <p className="mt-3 text-[12px] text-muted-foreground">
            {t("summary.hotelRulesPrefix")}{" "}
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="font-semibold text-[#1a7ad9] hover:underline"
            >
              {t("summary.hotelRulesLink")}
            </button>
          </p>
        </div>
      </div>

      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title={t("rules.title")}>
        <p className="text-[13px] font-semibold text-foreground">{hotel.name}</p>
        <dl className="mt-3 space-y-3">
          {hotelRules.map((r) => (
            <div key={r.title}>
              <dt className="text-[13px] font-bold text-foreground">{r.title}</dt>
              <dd className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {r.body}
              </dd>
            </div>
          ))}
        </dl>
      </Modal>

      {showPrice && <PriceBreakdown ctx={ctx} />}

      {showPrice && (
        <div className="rounded-lg border border-border bg-white p-4">
          <PaymentLogos withSecure />
        </div>
      )}
    </div>
  );
}
