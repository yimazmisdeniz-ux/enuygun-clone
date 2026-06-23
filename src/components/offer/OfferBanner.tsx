"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import { OFFER_PCT, OFFER_DEADLINE } from "@/lib/offer";

const DEADLINE_MS = new Date(OFFER_DEADLINE).getTime();

/** Counts down to the fixed campaign deadline (end of July). */
function useOfferCountdown() {
  const [msLeft, setMsLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMsLeft(Math.max(0, DEADLINE_MS - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return msLeft;
}

function TimeUnit({
  value,
  label,
  tick = false,
}: {
  value: string;
  label: string;
  tick?: boolean;
}) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      {/* Boxed digit — subtle inner navy chip with a hairline edge */}
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-white/[0.06] ring-1 ring-inset ring-white/10">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.07] to-transparent"
        />
        {/* Re-keying on each new value restarts the tick-pop animation */}
        <span
          key={tick ? value : undefined}
          className={cn(
            "font-mono text-[21px] font-semibold leading-none text-white tabular-nums",
            tick && "motion-safe:animate-[offer-tick_400ms_ease-out]"
          )}
        >
          {value}
        </span>
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
    </span>
  );
}

export function OfferBanner() {
  const t = useTranslations("Offer");
  const msLeft = useOfferCountdown();

  const total = msLeft === null ? null : Math.max(0, Math.floor(msLeft / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const days = total === null ? "--" : pad(Math.floor(total / 86400));
  const hours = total === null ? "--" : pad(Math.floor((total % 86400) / 3600));
  const minutes = total === null ? "--" : pad(Math.floor((total % 3600) / 60));
  const seconds = total === null ? "--" : pad(total % 60);

  return (
    <Container>
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-gradient-to-br from-brand-ink to-brand-ink-dark px-6 py-6 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8">
        {/* Top hairline accent bar */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
        {/* Periodic light sweep across the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent motion-safe:animate-[offer-sheen_5s_ease-in-out_infinite]"
        />
        <div className="min-w-0">
          <p className="text-[20px] font-semibold leading-tight tracking-tight text-white sm:text-[22px]">
            {t.rich("title", {
              pct: OFFER_PCT,
              strong: (chunks) => (
                <span className="font-extrabold text-white">{chunks}</span>
              ),
            })}
          </p>
          <p className="mt-2 text-[13px] font-normal leading-snug text-white/55">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {t("endsIn")}
          </span>
          <div className="flex items-start gap-2">
            <TimeUnit value={days} label={t("daysShort")} />
            <span className="mt-2.5 text-[20px] font-light leading-none text-white/30">:</span>
            <TimeUnit value={hours} label={t("hoursShort")} />
            <span className="mt-2.5 text-[20px] font-light leading-none text-white/30">:</span>
            <TimeUnit value={minutes} label={t("minutesShort")} />
            <span className="mt-2.5 text-[20px] font-light leading-none text-white/30">:</span>
            <TimeUnit value={seconds} label={t("secondsShort")} tick />
          </div>
        </div>
      </div>
    </Container>
  );
}
