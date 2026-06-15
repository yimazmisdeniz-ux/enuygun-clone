import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RentalStepper } from "@/components/rental/RentalStepper";
import { PaymentStep } from "@/components/rental/PaymentStep";
import { getRentalContext, parseDriver } from "@/lib/rental";

export default async function RentalPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ctx = await getRentalContext(sp);
  if (!ctx) notFound();
  const driver = parseDriver(sp);

  return (
    <>
      <Header variant="white" />
      <RentalStepper current={4} />
      <PaymentStep ctx={ctx} driver={driver} />
      <Footer />
    </>
  );
}
