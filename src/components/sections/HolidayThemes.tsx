import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { holidayThemes } from "@/lib/data";
import { getTranslations } from "next-intl/server";

export async function HolidayThemes() {
  const t = await getTranslations("Home");
  return (
    <section>
      <Container>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">{t("holidayThemes.title")}</h2>
          <Link href="/otel/temalar" className="text-sm font-semibold text-brand hover:underline">
            {t("seeAll")}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
          {holidayThemes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/otel/${theme.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white p-4 transition hover:bg-surface"
            >
              <Image src={theme.icon} alt={t(`holidayThemes.items.${theme.slug}`)} width={48} height={48} />
              <span className="text-center text-xs font-medium">{t(`holidayThemes.items.${theme.slug}`)}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
