import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { DetailNav } from "@/components/detail/DetailNav";
import { Gallery } from "@/components/detail/Gallery";
import { Overview } from "@/components/detail/Overview";
import { RoomsSection } from "@/components/detail/RoomsSection";
import { ReviewsSection } from "@/components/detail/ReviewsSection";
import { DetailExtras } from "@/components/detail/DetailExtras";
import { DetailMapProvider } from "@/components/detail/DetailMapProvider";
import {
  getHotelDetailOrBuild,
  formatTrDate,
  parseGuests,
  nightsBetween,
} from "@/lib/data";

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string; hotel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { location, hotel } = await params;
  const sp = await searchParams;
  const locale = await getLocale();

  const detail = await getHotelDetailOrBuild(hotel, locale);
  if (!detail) notFound();

  const checkin = typeof sp.checkin === "string" ? sp.checkin : undefined;
  const checkout = typeof sp.checkout === "string" ? sp.checkout : undefined;
  const guests = typeof sp.guests === "string" ? sp.guests : undefined;
  const dates =
    checkin && checkout
      ? `${formatTrDate(checkin, locale)} - ${formatTrDate(checkout, locale)}`
      : undefined;

  const { adults, roomCount } = parseGuests(guests);
  const nights = checkin && checkout ? nightsBetween(checkin, checkout) : undefined;

  return (
    <>
      <Header variant="white" />
      <DetailMapProvider detail={detail}>
      <main className="bg-white pb-12">
        <DetailNav detail={detail} location={location} />
        <Gallery
          images={detail.gallery}
          totalPhotos={detail.totalPhotos}
          name={detail.name}
        />
        <Overview description={detail.description} pois={detail.pois} />
        <RoomsSection
          rooms={detail.rooms}
          slug={detail.slug}
          checkin={checkin}
          checkout={checkout}
          dates={dates}
          guests={guests}
          adults={adults}
          roomCount={roomCount}
          nights={nights}
          baseNights={detail.baseNights}
        />
        <ReviewsSection
          rating={detail.rating}
          ratingLabel={detail.ratingLabel}
          reviewCount={detail.reviewCount}
          categoryScores={detail.categoryScores}
          aiLikes={detail.aiLikes}
          reviews={detail.reviews}
        />
        <DetailExtras pois={detail.pois} />
      </main>
      </DetailMapProvider>
      <Footer />
    </>
  );
}
