import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { OfferBanner } from "@/components/offer/OfferBanner";
import { HotelRail } from "@/components/sections/HotelRail";
import { PopularRegions } from "@/components/sections/PopularRegions";
import { ThemedRails } from "@/components/sections/ThemedRails";
import { HolidayThemes } from "@/components/sections/HolidayThemes";
import { WhyUs } from "@/components/sections/WhyUs";
import { FAQ } from "@/components/sections/FAQ";
import { Footer } from "@/components/sections/Footer";
import { getHotelRail } from "@/lib/data";
import { getTranslations, getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  const railHotels = await getHotelRail(12, locale);
  const t = await getTranslations("Home");
  return (
    <>
      <Header />
      <Hero />
      <main className="flex flex-col gap-16 py-12">
        <OfferBanner />
        <HotelRail
          title={t("recommendedRailTitle")}
          hotels={railHotels}
          seeAllHref="/otel/antalya"
        />
        <PopularRegions />
        <ThemedRails />
        <HolidayThemes />
        <WhyUs />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
