"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Headphones,
  UserPlus,
  Baby,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import {
  rentalExtras,
  rentalSearchParams,
  type RentalContext,
  type UpgradeOption,
} from "@/lib/rental";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { CarInfoCard, FirmDeliveryCard, CarThumb } from "./CarInfoCard";
import { TotalSummary } from "./RentalSummary";

const EXTRA_ICON: Record<string, React.ReactNode> = {
  "musteri-onceligi": <Headphones className="h-6 w-6" />,
  "ek-surucu": <UserPlus className="h-6 w-6" />,
  "bebek-koltugu": <Baby className="h-6 w-6" />,
  "lastik-cam-far": <ShieldCheck className="h-6 w-6" />,
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-brand" : "bg-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function ExtrasStep({
  ctx,
  upgrades,
}: {
  ctx: RentalContext;
  upgrades: UpgradeOption[];
}) {
  // Seed from the context so extras chosen earlier survive back-navigation.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ctx.extras.map((e) => e.slug))
  );
  const money = useMoney();
  const t = useTranslations("Rental");

  const extrasTotal = rentalExtras
    .filter((e) => selected.has(e.slug))
    .reduce((s, e) => s + e.priceTL, 0);
  const total = ctx.car.dailyTL * ctx.days + extrasTotal;

  function toggle(slug: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const nextHref = `/arac-kiralama/surucu?${rentalSearchParams(ctx, {
    extras: Array.from(selected),
  })}`;

  return (
    <main className="bg-surface py-6">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <CarInfoCard ctx={ctx} showTags />
            <FirmDeliveryCard ctx={ctx} />

            {/* Extras */}
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-[15px] font-bold text-foreground">
                {t("extras.title")}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {rentalExtras.map((e) => {
                  const on = selected.has(e.slug);
                  return (
                    <div
                      key={e.slug}
                      className={cn(
                        "flex flex-col rounded-lg border p-3 transition-colors",
                        on ? "border-brand bg-brand/5" : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-muted-foreground">
                          {EXTRA_ICON[e.slug]}
                        </span>
                        <Toggle on={on} onClick={() => toggle(e.slug)} />
                      </div>
                      <p className="mt-2 text-[13px] font-semibold leading-snug text-foreground">
                        {e.name}
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-foreground">
                        {money.format(e.priceTL, 2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade */}
            <div className="rounded-lg border-2 border-[#bcd9f5] bg-[#f6fbff] p-4">
              <p className="text-[15px] font-bold text-foreground">
                {t("extras.upgradeTitle")}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {t("extras.upgradeSubtitle")}
              </p>
              <div className="relative mt-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {upgrades.map((u) => {
                    return (
                      <div
                        key={u.name}
                        className="flex flex-col rounded-lg border border-border bg-white p-3"
                      >
                        <CarThumb
                          accent={u.accent}
                          image={u.image}
                          name={u.name}
                          className="h-[70px] w-full"
                        />
                        <p className="mt-2 text-[14px] font-bold text-foreground">
                          {u.name}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {u.spec}
                        </p>
                        <p className="mt-1 text-[13px] font-semibold text-foreground">
                          {t("extras.upgradePricePrefix")}{" "}
                          <span className="text-brand">
                            {money.format(u.extraPerDayTL)}
                          </span>{" "}
                          {t("extras.upgradePriceSuffix")}
                        </p>
                        <Link
                          href={`/arac-kiralama/kiralama?${rentalSearchParams(ctx, {
                            car: u.targetSlug,
                          })}`}
                          className="cta-press mt-2 rounded-md bg-[#1a7ad9] py-2 text-center text-[13px] font-bold text-white transition-colors hover:bg-[#1668b8]"
                        >
                          {t("extras.upgradeNow")}
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <button
                  aria-label={t("extras.previous")}
                  className="absolute -left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow sm:flex"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  aria-label={t("extras.next")}
                  className="absolute -right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow sm:flex"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-right">
                <p className="text-[12px] text-muted-foreground">{t("totalAmount")}</p>
                <p className="text-[18px] font-bold text-foreground">
                  {money.format(total, 2)}
                </p>
              </div>
              <Link
                href={nextHref}
                className="cta-press flex items-center gap-1 rounded-md bg-brand px-8 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                {t("extras.continue")}
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <TotalSummary
              days={ctx.days}
              dailyTL={ctx.car.dailyTL}
              total={total}
            />
          </aside>
        </div>
      </Container>
    </main>
  );
}
