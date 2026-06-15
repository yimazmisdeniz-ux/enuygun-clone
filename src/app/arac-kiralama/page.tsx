import { getTranslations } from "next-intl/server";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/layout/Container";
import { RentalSearchWidget } from "@/components/rental/RentalSearchWidget";

export default async function RentalLandingPage() {
  const t = await getTranslations("Rental");
  return (
    <>
      <Header variant="transparent" />
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,17,65,0.45), rgba(2,17,65,0.2)), url('/images/hero/hero-bg.webp')",
          minHeight: 520,
        }}
      >
        <Container className="flex flex-col justify-center pt-32 pb-12 md:pt-40">
          <h1 className="text-[26px] font-bold text-white drop-shadow-sm">
            {t("landing.title")}
          </h1>
          <p className="mt-1 text-white/90">
            {t("landing.subtitle")}
          </p>
          <div className="mt-6">
            <RentalSearchWidget />
          </div>
        </Container>
      </section>
      <Footer />
    </>
  );
}
