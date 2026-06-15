import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { footerColumns, footerTopRegions, footerTopThemes } from "@/lib/data";
import { legalFooterLinks } from "@/lib/legal";
import { getTranslations } from "next-intl/server";

const paymentMethods = [
  { name: "Visa", src: "/images/payment/visa.svg", w: 48 },
  { name: "Mastercard", src: "/images/payment/mastercard.svg", w: 48 },
  { name: "Troy", src: "/images/payment/troy.svg", w: 48 },
  { name: "Axess", src: "/images/payment/axess.svg", w: 54 },
  { name: "Maximum", src: "/images/payment/maximum.svg", w: 70 },
  { name: "BKM Express", src: "/images/payment/bkm-express.svg", w: 84 },
  { name: "3D Secure", src: "/images/payment/3d-secure.svg", w: 72 },
];

export async function Footer() {
  const t = await getTranslations("Home");
  return (
    <footer className="mt-16 bg-brand-ink text-white/70">
      {/* Section A — Popular Regions & Themes */}
      <Container className="py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-bold leading-[21px] text-white">
              {t("footer.popularRegions")}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {footerTopRegions.map((slug, i) => (
                <li key={slug} className="flex items-center gap-3">
                  <Link
                    href={`/otel/${slug}`}
                    className="text-[13px] text-white/65 transition-colors hover:text-white"
                  >
                    {t(`footer.regions.${i}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[14px] font-bold leading-[21px] text-white">
              {t("footer.popularThemes")}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {footerTopThemes.map((slug, i) => (
                <li key={slug} className="flex items-center gap-3">
                  <Link
                    href={`/otel/${slug}`}
                    className="text-[13px] text-white/65 transition-colors hover:text-white"
                  >
                    {t(`footer.themes.${i}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* Section C — Main link grid */}
      <Container className="pb-10">
        <div className="border-t border-white/10 pt-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            {footerColumns.map((col) => (
              <div key={col.key}>
                <h3 className="text-[14px] font-bold leading-[21px] text-white">
                  {t(`footer.columns.${col.key}.title`)}
                </h3>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {col.links.map((href, li) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[13px] leading-tight text-white/65 transition-colors hover:text-white"
                      >
                        {t(`footer.columns.${col.key}.links.${li}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Section D — Bottom strip */}
      <div className="border-t border-white/10">
        <Container className="py-6">
          {/* Row 1: Logo + tagline */}
          <div className="flex flex-col gap-1">
            <Image
              src="/bookera-white.png"
              alt="Bookera"
              width={557}
              height={120}
              unoptimized
              className="h-5 w-auto self-start"
            />
            <p className="text-[13px] text-white/55">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Row 2: Payment methods — on white chips for contrast on navy */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method.name}
                className="flex items-center rounded-md bg-white px-2 py-1"
              >
                <Image
                  src={method.src}
                  alt={method.name}
                  width={method.w}
                  height={30}
                  unoptimized
                  className="h-[22px] w-auto"
                />
              </span>
            ))}
          </div>

          {/* Row 3: Legal links */}
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4">
            {legalFooterLinks.map(({ key, slug }) => (
              <Link
                key={key}
                href={`/${slug}`}
                className="text-[12px] text-white/55 transition-colors hover:text-white"
              >
                {t(`footer.legal.${key}`)}
              </Link>
            ))}
          </nav>

          {/* Row 4: Copyright */}
          <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 text-[12px] text-white/50 md:flex-row md:items-center md:justify-between">
            <p>{t("footer.copyright")}</p>
            <p>{t("footer.ssl")}</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
