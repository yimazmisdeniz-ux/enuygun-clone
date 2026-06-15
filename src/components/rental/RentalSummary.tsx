"use client";

import { Info, ChevronDown, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RentalContext } from "@/lib/rental";
import { formatCount } from "@/lib/currency";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { CarThumb } from "./CarInfoCard";

function DepositNote() {
  const t = useTranslations("Rental");
  return (
    <div className="mt-4 flex gap-2 rounded-md border border-[#e3c97a] bg-[#fdf6e3] p-3 text-[12px] text-[#7a5b00]">
      <Info className="h-4 w-4 shrink-0" />
      <p>
        {t("summary.depositNoteStart")}{" "}
        <strong>
          {t("summary.depositNoteBold")}
        </strong>{" "}
        {t("summary.depositNoteEnd")}
      </p>
    </div>
  );
}

export function TotalSummary({
  days,
  dailyTL,
  total,
}: {
  days: number;
  dailyTL: number;
  total: number;
}) {
  const money = useMoney();
  const t = useTranslations("Rental");
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-[16px] font-bold text-foreground">{t("summary.totalAmount")}</p>

      <div className="mt-3 flex items-center justify-between rounded-md bg-[#eef6fe] px-3 py-2.5">
        <span className="text-[13px] font-semibold text-foreground">
          {t("summary.chargedAmount")}
        </span>
        <span className="text-[15px] font-bold text-foreground">
          {money.format(total, 2)}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">{t("summary.reservationAmount")}</span>
        <span className="font-semibold text-[#1a7ad9]">
          {money.format(total, 2)}
        </span>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-foreground">
            {t("summary.daysTotal", { days })}
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {money.format(total, 2)}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {t("summary.dailyRentalAmount", { amount: money.format(dailyTL) })}
        </p>
      </div>

      <p className="mt-3 text-[13px] text-foreground">
        {t.rich("summary.rentalConditionsLine", {
          link: (chunks) => (
            <span className="font-semibold text-[#1a7ad9]">{chunks}</span>
          ),
        })}
      </p>

      <DepositNote />
    </div>
  );
}

export function PriceSummary({
  days,
  dailyTL,
  total,
}: {
  days: number;
  dailyTL: number;
  total: number;
}) {
  const money = useMoney();
  const t = useTranslations("Rental");
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-[16px] font-bold text-foreground">{t("summary.priceDetails")}</p>

      <button className="mt-3 flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-1 text-[13px] text-foreground">
          {t("summary.chargedAmount")}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">
          {money.format(total, 2)}
        </span>
      </button>

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-foreground">
            {t("summary.daysTotal", { days })}
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {money.format(total, 2)}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {t("summary.dailyFee", { amount: money.format(dailyTL, 2) })}
        </p>
      </div>
    </div>
  );
}

export function DeliveryCard({ ctx }: { ctx: RentalContext }) {
  const { car } = ctx;
  const money = useMoney();
  const t = useTranslations("Rental");
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-foreground">
          {t("summary.carAndDelivery")}
        </p>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
          style={{ backgroundColor: car.accent }}
        >
          {car.supplier}
        </span>
      </div>

      <p className="mt-3 text-[15px] font-bold text-foreground">{car.name}</p>
      <p className="text-[12px] text-muted-foreground">{t("card.orSimilar")}</p>

      <CarThumb
        accent={car.accent}
        image={car.image}
        name={car.name}
        className="mt-2 h-[90px] w-full"
      />

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-foreground">
        <span>{car.fuel}</span>
        <span>{car.transmission}</span>
        <span>{t("card.minAge", { age: car.minAge })}</span>
        <span>{t("info.km", { count: formatCount(car.kmLimit, money.locale) })}</span>
        <span>{t("card.deposit", { amount: money.format(car.depositTL) })}</span>
      </div>
      <button className="mt-1 text-[13px] font-semibold text-[#1a7ad9] hover:underline">
        {t("summary.details")}
      </button>

      <div className="mt-3 space-y-3 border-t border-border pt-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {t("delivery.pickup")}
          </p>
          <p className="ml-5 text-[12px] text-muted-foreground">
            {ctx.checkinDate} {ctx.checkinTime}
          </p>
          <p className="ml-5 text-[13px] font-semibold text-[#1a7ad9]">
            {car.location}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {t("delivery.dropoff")}
          </p>
          <p className="ml-5 text-[12px] text-muted-foreground">
            {ctx.checkoutDate} {ctx.checkoutTime}
          </p>
          <p className="ml-5 text-[13px] font-semibold text-[#1a7ad9]">
            {car.location}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-foreground">
        {t("summary.viewConditionsPrefix")}{" "}
        <span className="font-semibold text-[#1a7ad9]">{t("summary.click")}</span>
      </p>

      <DepositNote />
    </div>
  );
}
