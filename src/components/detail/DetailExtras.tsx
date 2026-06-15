import {
  Check,
  Landmark,
  Plane,
  Waves,
  Building2,
  LogIn,
  LogOut,
  Ban,
  CreditCard,
  Baby,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import type { POI } from "@/lib/data";
import { getTranslations } from "next-intl/server";

const AMENITY_KEYS = [
  "outdoorPool",
  "indoorPool",
  "aquapark",
  "spaWellness",
  "freeWifi",
  "privateBeach",
  "fitnessCenter",
  "restaurant",
  "bar",
  "kidsClub",
  "roomService",
  "parking",
  "reception24h",
  "airConditioning",
  "meetingRoom",
  "accessible",
] as const;

const POI_ICON = {
  landmark: Landmark,
  airport: Plane,
  beach: Waves,
  center: Building2,
} as const;

export async function DetailExtras({ pois }: { pois: POI[] }) {
  const t = await getTranslations("Detail");

  const RULES = [
    { icon: LogIn, label: t("rules.checkIn"), value: "14:00" },
    { icon: LogOut, label: t("rules.checkOut"), value: "12:00" },
    {
      icon: Baby,
      label: t("rules.childPolicy"),
      value: t("rules.childPolicyValue"),
    },
    { icon: Ban, label: t("rules.pets"), value: t("rules.petsValue") },
    {
      icon: CreditCard,
      label: t("rules.payment"),
      value: t("rules.paymentValue"),
    },
  ];

  return (
    <>
      {/* Otel Özellikleri */}
      <section id="ozellikler" className="scroll-mt-20 bg-white">
        <Container className="py-7">
          <h2 className="text-[22px] font-bold text-foreground">
            {t("features.title")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
            {AMENITY_KEYS.map((key) => (
              <span
                key={key}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Check className="h-4 w-4 shrink-0 text-brand" />
                {t(`amenities.${key}`)}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Ulaşım */}
      <section id="ulasim" className="scroll-mt-20 bg-white">
        <Container className="py-7">
          <h2 className="text-[22px] font-bold text-foreground">{t("transport.title")}</h2>
          <ul className="mt-4 max-w-xl">
            {pois.map((p) => {
              const Icon = POI_ICON[p.type];
              return (
                <li
                  key={p.name}
                  className="flex items-center justify-between border-b border-border py-3 last:border-0"
                >
                  <span className="flex items-center gap-2.5 text-sm text-foreground">
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
        </Container>
      </section>

      {/* Otel Kuralları */}
      <section id="kurallar" className="scroll-mt-20 bg-white">
        <Container className="py-7">
          <h2 className="text-[22px] font-bold text-foreground">{t("rules.title")}</h2>
          <ul className="mt-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
            {RULES.map((r) => (
              <li key={r.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground">
                  <r.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="leading-tight">
                  <p className="text-[12px] text-muted-foreground">{r.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {r.value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
