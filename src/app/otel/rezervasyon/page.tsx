import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { GuestInfoForm } from "@/components/booking/GuestInfoForm";
import { Container } from "@/components/layout/Container";
import { getBookingContext } from "@/lib/data";
import { getLocale } from "next-intl/server";

function buildQuery(sp: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params.set(k, v);
  }
  const q = params.toString();
  return q ? "?" + q : "";
}

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const ctx = await getBookingContext(sp, locale);
  if (!ctx) notFound();
  const nextHref = "/otel/odeme" + buildQuery(sp);
  return (
    <>
      <Header variant="white" />
      <BookingStepper current={2} />
      <main className="bg-surface py-6">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <GuestInfoForm ctx={ctx} nextHref={nextHref} />
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <BookingSummary ctx={ctx} showPrice />
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
