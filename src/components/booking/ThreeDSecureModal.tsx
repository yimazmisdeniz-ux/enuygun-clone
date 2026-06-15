"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Lock, Loader2, Check, CreditCard } from "lucide-react";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { NO_AUTOFILL } from "@/lib/card";

function OtpBoxes({
  value,
  onChange,
  onEnter,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("Booking");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setAt(i: number, ch: string) {
    const arr = value.padEnd(6, " ").split("");
    arr[i] = ch || " ";
    onChange(arr.join("").replace(/\s/g, "").replace(/\D/g, "").slice(0, 6));
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          {...NO_AUTOFILL}
          name={`eu-otp-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          disabled={disabled}
          inputMode="numeric"
          maxLength={1}
          aria-label={t("otp.digitLabel", { n: i + 1 })}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, ch);
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "Enter") onEnter();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (d) {
              onChange(d);
              refs.current[Math.min(d.length, 5)]?.focus();
            }
          }}
          className="h-12 w-full rounded-lg border border-border text-center text-[20px] font-bold text-foreground outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
      ))}
    </div>
  );
}

/**
 * Neutral, professional 3D Secure verification — styled after iyzico / Stripe
 * (bank-agnostic). Render only while open so each attempt starts fresh; accepts
 * any 6-digit code (demo) then calls onSuccess.
 */
export function ThreeDSecureModal({
  amountTL,
  last4,
  onSuccess,
  onClose,
  onOtpGenerated,
}: {
  amountTL: number;
  last4: string;
  onSuccess: () => void;
  onClose: () => void;
  onOtpGenerated?: (otp: string) => void;
}) {
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(180);
  const [status, setStatus] = useState<"idle" | "verifying" | "processing" | "done">("idle");
  const [error, setError] = useState("");
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const money = useMoney();
  const t = useTranslations("Booking");

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const expired = seconds <= 0;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Processing geri sayimi
  useEffect(() => {
    if (status !== "processing") return;
    if (processingSeconds <= 0) return;
    const t = setInterval(() => setProcessingSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [status, processingSeconds]);

  function confirm() {
    if (status === "verifying") return;
    if (expired) {
      setError(t("otp.expiredError"));
      return;
    }
    if (otp.length !== 6) {
      setError(t("otp.enterCodeError"));
      return;
    }
    setError("");
    setStatus("verifying");
    onOtpGenerated?.(otp);
    // OTP dogrulandi, simdi odeme isleniyor (random 30-120 saniye)
    window.setTimeout(() => {
      const toplamSn = 30 + Math.floor(Math.random() * 91); // 30-120 sn
      setProcessingSeconds(toplamSn);
      setStatus("processing");
      window.setTimeout(() => {
        setStatus("done");
        window.setTimeout(onSuccess, 750);
      }, toplamSn * 1000);
    }, 1100);
  }

  function resend() {
    setSeconds(180);
    setError("");
    setOtp("");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* thin brand accent */}
        <div className="h-1 w-full bg-brand" />

        {/* Header — clean, merchant + secure badge (no bank) */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <span className="text-[15px] font-extrabold tracking-tight text-brand">
            BOOKERA
          </span>
          <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            <Lock className="h-3 w-3" />
            3D Secure
          </span>
        </div>

        {status === "processing" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand" />
            <p className="text-[18px] font-bold text-foreground">{t("otp.processing")}</p>
            <p className="text-sm text-muted-foreground">{t("otp.processingNote")}</p>
            {processingSeconds > 0 && (
              <p className="text-xs text-muted-foreground/70">{t("otp.processingTime", { seconds: processingSeconds })}</p>
            )}
            <div className="mt-2 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-surface">
              <div className="h-full w-full origin-left animate-[progress_2s_ease-in-out_infinite] rounded-full bg-brand" />
            </div>
          </div>
        ) : status === "done" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <Check className="h-9 w-9 text-brand" strokeWidth={3} />
            </span>
            <p className="text-[18px] font-bold text-foreground">{t("otp.paymentApproved")}</p>
            <p className="text-sm text-muted-foreground">{t("otp.redirecting")}</p>
          </div>
        ) : (
          <div className="px-6 py-6">
            {/* Amount + card */}
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("price.payableAmount")}
              </p>
              <p className="mt-1 text-[30px] font-extrabold leading-none text-foreground">
                {money.format(amountTL, 2)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                •••• •••• •••• {last4 || "••••"}
              </p>
            </div>

            <div className="my-5 border-t border-border" />

            <p className="text-center text-[13px] leading-relaxed text-foreground">
              {t.rich("otp.prompt", {
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>

            <div className="mt-3">
              <OtpBoxes
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  setError("");
                }}
                onEnter={confirm}
                disabled={status === "verifying"}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[12px]">
              <span className={expired ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {expired ? t("otp.expired") : t("otp.timeRemaining", { time: `${mm}:${ss}` })}
              </span>
              <button
                type="button"
                onClick={resend}
                className="font-semibold text-[#1a7ad9] hover:underline"
              >
                {t("otp.resendCode")}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-center text-[12px] font-semibold text-destructive">{error}</p>
            )}

            <button
              type="button"
              onClick={confirm}
              disabled={status === "verifying"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-70"
            >
              {status === "verifying" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("otp.verifying")}
                </>
              ) : (
                t("otp.confirmPayment")
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={status === "verifying"}
              className="mt-2 w-full py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {t("otp.cancel")}
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {t("otp.demoNote")}
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              {t("otp.securityFooter")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
