import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RentalStepper } from "@/components/rental/RentalStepper";
import { ExtrasStep } from "@/components/rental/ExtrasStep";
import { getRentalContext, getUpgradeOptions } from "@/lib/rental";

export default async function RentalExtrasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ctx = await getRentalContext(sp);
  if (!ctx) notFound();
  const upgrades = await getUpgradeOptions();

  return (
    <>
      <Header variant="white" />
      <RentalStepper current={2} />
      <ExtrasStep ctx={ctx} upgrades={upgrades} />
      <Footer />
    </>
  );
}
