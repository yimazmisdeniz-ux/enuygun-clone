import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check, Mail, ChevronRight } from "lucide-react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/layout/Container";

export default async function BookingDonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("Booking");
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "ENX00000000";
  const tutar = typeof sp.tutar === "string" ? sp.tutar : "";
  const tip = sp.tip === "arac" ? t("done.carRental") : t("done.hotel");

  return (
    <>
      <Header variant="white" />
      <main className="bg-surface py-10">
        <Container className="max-w-[640px]">
          <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <Check className="h-9 w-9 text-brand" strokeWidth={3} />
            </span>
            <h1 className="mt-4 text-[24px] font-bold text-foreground">
              {t("done.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("done.subtitle")}
            </p>

            <div className="mt-6 divide-y divide-border rounded-lg border border-border text-left text-sm">
              <Row label={t("done.bookingNo")} value={ref} strong />
              <Row label={t("done.transaction")} value={tip} />
              {tutar && <Row label={t("done.paidAmount")} value={`${tutar} TL`} strong />}
              <Row label={t("done.status")} value={t("done.confirmed")} />
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <Mail className="h-4 w-4" />
              {t("done.emailSent")}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                {t("done.backToHome")}
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            {t("done.callCenter", { phone: "0850 811 90 90" })}
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-foreground" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
