import { HotelRail } from "./HotelRail";
import { getHotelRail, themedRails } from "@/lib/data";
import { getTranslations, getLocale } from "next-intl/server";

export async function ThemedRails() {
  const locale = await getLocale();
  const hotels = await getHotelRail(8, locale);
  const t = await getTranslations("Home");
  return (
    <div className="flex flex-col gap-12">
      {themedRails.map((r) => (
        <HotelRail
          key={r.slug}
          title={t(`themedRails.${r.slug}`)}
          hotels={hotels}
          seeAllHref={`/otel/${r.slug}`}
        />
      ))}
    </div>
  );
}
