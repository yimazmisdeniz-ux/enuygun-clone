import { Container } from "@/components/layout/Container";
import { whyUsItems } from "@/lib/data";
import { getTranslations } from "next-intl/server";

export async function WhyUs() {
  const t = await getTranslations("Home");
  return (
    <section>
      <Container>
        <h2 className="text-xl font-bold">
          {t("whyUs.title")}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {whyUsItems.map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-white p-5">
              <h3 className="text-base font-bold">{t(`whyUs.items.${i}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`whyUs.items.${i}.desc`)}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
