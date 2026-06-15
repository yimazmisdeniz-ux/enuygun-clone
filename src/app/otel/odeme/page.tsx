import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { PaymentForm } from "@/components/booking/PaymentForm";
import { Container } from "@/components/layout/Container";
import { getBookingContext } from "@/lib/data";
import { getLocale } from "next-intl/server";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const ctx = await getBookingContext(sp, locale);
  if (!ctx) notFound();

  return (
    <>
      <Header variant="white" />
      <BookingStepper current={3} />
      <main className="bg-surface py-6">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <PaymentForm ctx={ctx} guestName={typeof sp.ad === "string" ? sp.ad : undefined} guestPhone={typeof sp.tel === "string" ? sp.tel : undefined} />
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <BookingSummary ctx={ctx} showPrice={false} />
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
