import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { RentalResultsBar } from "@/components/rental/RentalResultsBar";
import { RentalResults } from "@/components/rental/RentalResults";
import { DEFAULT_PICKUP, getCars, filterCarsByPickup, type Car } from "@/lib/rental";

/**
 * Scale a car's total price by the selected rental days.
 * The DB-stored total is a 3-day total by convention; we recompute it as
 * dailyTL * actualDays so the price reflects the user's calendar selection.
 */
function scaleCar(car: Car, days: number): Car {
  return {
    ...car,
    totalTL: Math.round(car.dailyTL * days),
    // dailyTL stays the same — it's the per-day rate
  };
}

export default async function RentalResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pickup = typeof sp.pickup === "string" ? sp.pickup : DEFAULT_PICKUP;
  const cin = typeof sp.cin === "string" ? sp.cin : "06 Haz";
  const cinT = typeof sp.cinT === "string" ? sp.cinT : "10:00";
  const cout = typeof sp.cout === "string" ? sp.cout : "09 Haz";
  const coutT = typeof sp.coutT === "string" ? sp.coutT : "10:00";
  const days = sp.days ? Math.max(1, Number(sp.days)) : 3;
  const dates = `${cin} ${cinT} - ${cout} ${coutT}`;
  const rawCars = filterCarsByPickup(await getCars(), pickup);
  const cars = rawCars.map((car) => scaleCar(car, days));

  return (
    <>
      <Header variant="white" />
      <RentalResultsBar pickup={pickup} dates={dates} />
      <main className="bg-surface pb-16">
        <RentalResults pickup={pickup} cars={cars} days={days} />
      </main>
      <Footer />
    </>
  );
}