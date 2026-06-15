import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { OfferBanner } from "@/components/offer/OfferBanner";
import { SearchResults } from "@/components/search/SearchResults";
import { getHotelResults, searchTitles, formatTrDate, regionDisplayName } from "@/lib/data";
import { localizePlace } from "@/lib/dataLabels";
import { getTranslations, getLocale } from "next-intl/server";

export default async function OtelSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { location } = await params;
  const sp = await searchParams;
  const t = await getTranslations("Search");
  const locale = await getLocale();

  // `location` is the canonical slug (the homepage already slugifies the typed
  // destination into it), so search off that — `dest` is for display only.
  const hotels = await getHotelResults(location, locale);
  const dest = typeof sp.dest === "string" ? sp.dest : undefined;
  const checkin = typeof sp.checkin === "string" ? sp.checkin : undefined;
  const checkout = typeof sp.checkout === "string" ? sp.checkout : undefined;
  const guests = typeof sp.guests === "string" ? sp.guests : undefined;

  const dates =
    checkin && checkout
      ? `${formatTrDate(checkin, locale)} - ${formatTrDate(checkout, locale)}`
      : undefined;

  // `searchTitles` holds fully-Turkish headings, so only use them for tr; en
  // (and any unknown slug) falls back to the localized "{place} Hotels" template.
  const title = dest
    ? t("pageTitle", { place: localizePlace(dest, locale) })
    : locale === "tr" && searchTitles[location]
      ? searchTitles[location]
      : t("pageTitle", { place: localizePlace(regionDisplayName(location), locale) });

  return (
    <>
      <Header variant="white" />
      <main className="bg-surface min-h-screen pb-16">
        <div className="pt-6">
          <OfferBanner />
        </div>
        <SearchResults
          title={title}
          hotels={hotels}
          location={location}
          destination={dest}
          checkin={checkin}
          checkout={checkout}
          dates={dates}
          guests={guests}
        />
      </main>
      <Footer />
    </>
  );
}
