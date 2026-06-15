"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, Calendar, Clock, ChevronRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";

const TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

export function RentalSearchWidget() {
  const router = useRouter();
  const t = useTranslations("Rental");
  const [monthly, setMonthly] = useState(false);
  const [pickup, setPickup] = useState("Sabiha Gökçen Havalimanı, İstanbul");
  const [pickTime, setPickTime] = useState("10:00");
  const [dropTime, setDropTime] = useState("10:00");
  const [differentDrop, setDifferentDrop] = useState(false);
  const [age, setAge] = useState("30-65");

  function search() {
    const params = new URLSearchParams({
      pickup,
      cin: "06 Haz",
      cinT: pickTime,
      cout: "09 Haz",
      coutT: dropTime,
    });
    router.push(`/arac-kiralama/sonuclar?${params.toString()}`);
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-lg md:p-5">
      {/* Rental type */}
      <div className="mb-4 flex items-center gap-6">
        {[
          { id: "gunluk", label: t("search.daily") },
          { id: "aylik", label: t("search.monthly") },
        ].map((opt) => {
          const checked = monthly === (opt.id === "aylik");
          return (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2"
            >
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                  checked ? "border-brand" : "border-muted-foreground/50"
                }`}
              >
                {checked && (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                )}
              </span>
              <input
                type="radio"
                name="rental-type"
                checked={checked}
                onChange={() => setMonthly(opt.id === "aylik")}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-foreground">
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {/* Pickup location */}
        <div className="flex min-w-0 flex-[2.4] items-center gap-2.5 rounded-md border border-border px-3.5 py-2.5">
          <Car className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t("search.pickupLocation")}
            </p>
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground outline-none"
            />
          </div>
        </div>

        {/* Pickup date */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border px-3.5 py-2.5">
          <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t("search.pickupDate")}
            </p>
            <p className="text-sm font-semibold text-foreground">06 Haz, Cts</p>
          </div>
        </div>

        {/* Pickup time */}
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2.5">
          <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t("search.time")}
            </p>
            <select
              value={pickTime}
              onChange={(e) => setPickTime(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none"
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop date */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border px-3.5 py-2.5">
          <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t("search.dropoffDate")}
            </p>
            <p className="text-sm font-semibold text-foreground">09 Haz, Sal</p>
          </div>
        </div>

        {/* Drop time */}
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2.5">
          <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t("search.time")}
            </p>
            <select
              value={dropTime}
              onChange={(e) => setDropTime(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none"
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={search}
          className="cta-press flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-7 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {t("search.findCar")}
          <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <span
            className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${
              differentDrop
                ? "border-brand bg-brand"
                : "border-muted-foreground/50 bg-white"
            }`}
          >
            {differentDrop && (
              <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                <path
                  d="M2.5 6.5l2.5 2.5 4.5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={differentDrop}
            onChange={() => setDifferentDrop((v) => !v)}
            className="sr-only"
          />
          {t("search.differentDropoff")}
        </label>

        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <span>{t("search.driverAge")}</span>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="cursor-pointer rounded-md border border-border bg-white px-2 py-1 text-sm font-bold text-foreground outline-none"
          >
            <option value="18-29">18-29</option>
            <option value="30-65">30-65</option>
            <option value="65+">65+</option>
          </select>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
