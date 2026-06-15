import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RentalStepper } from "@/components/rental/RentalStepper";
import { DriverStep } from "@/components/rental/DriverStep";
import { getRentalContext } from "@/lib/rental";

export default async function RentalDriverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ctx = await getRentalContext(sp);
  if (!ctx) notFound();

  return (
    <>
      <Header variant="white" />
      <RentalStepper current={3} />
      <DriverStep ctx={ctx} />
      <Footer />
    </>
  );
}
