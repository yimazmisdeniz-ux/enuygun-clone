"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, ChevronDown, ChevronUp, ChevronRight, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { FlagTR } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  lettersOnly,
  digitsOnly,
  formatTrPhone,
  isValidTrPhone,
  formatFlightNo,
} from "@/lib/input-format";
import { rentalSearchParams, type RentalContext } from "@/lib/rental";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { CarInfoCard, FirmDeliveryCard } from "./CarInfoCard";
import { TotalSummary } from "./RentalSummary";

function Field({
  label,
  placeholder,
  type = "text",
  className,
  value,
  onChange,
  error,
  inputMode,
  maxLength,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (v: string) => void;
  error?: boolean;
  inputMode?: "text" | "email" | "numeric" | "tel";
  maxLength?: number;
}) {
  return (
    <div className={cn("relative", className)}>
      <label className="pointer-events-none absolute left-3 top-1.5 text-[11px] font-semibold text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        inputMode={inputMode}
        maxLength={maxLength}
        className={cn(
          "w-full rounded-md border px-3 pb-2 pt-5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand",
          error ? "border-destructive" : "border-border"
        )}
      />
    </div>
  );
}

/* Native <select> styled to sit flush with the floating-label inputs:
   same 50px height, custom chevron, placeholder-gray text until a pick. */
function SelectBox({
  value,
  onChange,
  error,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-[50px] w-full appearance-none rounded-md border bg-white px-2.5 pr-7 text-sm outline-none focus:border-brand",
          value ? "text-foreground" : "text-muted-foreground",
          error ? "border-destructive" : "border-border"
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;
// Fixed reference "now" matching the rest of the app's 2026 snapshot — keeps
// SSR/CSR markup identical (no `new Date()` in render) while tying the youngest
// selectable birth year to the car's minimum-age requirement.
const REFERENCE_YEAR = 2026;

export function DriverStep({ ctx }: { ctx: RentalContext }) {
  const router = useRouter();
  const money = useMoney();
  const t = useTranslations("Rental");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"bireysel" | "kurumsal">(
    "bireysel"
  );
  const [notCitizen, setNotCitizen] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bDay, setBDay] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bYear, setBYear] = useState("");
  const [tc, setTc] = useState("");
  const [flightNo, setFlightNo] = useState("");
  const [invoiceTax, setInvoiceTax] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const maxYear = REFERENCE_YEAR - ctx.car.minAge;
  const years = Array.from({ length: 70 }, (_, i) => String(maxYear - i));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk = isValidTrPhone(phone);
  const firstOk = firstName.trim().length > 0;
  const lastOk = lastName.trim().length > 0;
  const birthOk = !!bDay && !!bMonth && !!bYear;
  const tcOk = notCitizen || /^\d{11}$/.test(tc);
  const valid = emailOk && phoneOk && firstOk && lastOk && birthOk && tcOk;

  function submit() {
    setSubmitted(true);
    if (!valid) {
      document
        .getElementById("surucu-form")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const driver = new URLSearchParams({
      fname: firstName.trim(),
      lname: lastName.trim(),
      email,
      phone,
      birth: `${bDay.padStart(2, "0")}.${bMonth.padStart(2, "0")}.${bYear}`,
    });
    if (!notCitizen) driver.set("tc", tc);
    router.push(`/arac-kiralama/odeme?${rentalSearchParams(ctx)}&${driver.toString()}`);
  }

  return (
    <main className="bg-surface py-6">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <CarInfoCard ctx={ctx} />
            <FirmDeliveryCard ctx={ctx} defaultOpen={false} />

            {/* Ek Bilgiler collapsed */}
            <div className="rounded-lg border border-border bg-brand/5">
              <button
                type="button"
                onClick={() => setExtraOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <span className="text-[15px] font-bold text-foreground">
                  {t("driver.extraInfo")}
                </span>
                {extraOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              {extraOpen && (
                <p className="px-4 pb-4 text-[13px] text-muted-foreground">
                  {t("driver.extraInfoNote")}
                </p>
              )}
            </div>

            {/* Driver form */}
            <div id="surucu-form" className="rounded-lg border border-border bg-white p-4">
              <p className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                <User className="h-5 w-5" />
                {t("driver.title")}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Field
                    label={t("driver.email")}
                    placeholder="ornek@mail.com"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(v) => setEmail(v.replace(/\s+/g, ""))}
                    error={submitted && !emailOk}
                  />
                  <p className="mt-1 text-[11px] text-[#1a7ad9]">
                    {t("driver.emailNote")}
                  </p>
                </div>
                <div className="relative">
                  <label className="pointer-events-none absolute left-3 top-1.5 z-10 text-[11px] font-semibold text-muted-foreground">
                    {t("driver.phone")}
                  </label>
                  <div
                    className={cn(
                      "flex items-stretch overflow-hidden rounded-md border focus-within:border-brand",
                      submitted && !phoneOk ? "border-destructive" : "border-border"
                    )}
                  >
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-border px-3 pb-2 pt-5 text-sm text-foreground">
                      <FlagTR className="h-[13px] w-[19.5px] shrink-0 rounded-[2px]" />
                      +90
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatTrPhone(e.target.value))}
                      maxLength={13}
                      placeholder="5XX XXX XX XX"
                      className="min-w-0 flex-1 px-3 pb-2 pt-5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <Field
                  label={t("driver.firstName")}
                  placeholder={t("driver.firstNamePlaceholder")}
                  value={firstName}
                  onChange={(v) => setFirstName(lettersOnly(v))}
                  error={submitted && !firstOk}
                />
                <Field
                  label={t("driver.lastName")}
                  placeholder={t("driver.lastNamePlaceholder")}
                  value={lastName}
                  onChange={(v) => setLastName(lettersOnly(v))}
                  error={submitted && !lastOk}
                />

                {/* Birth date */}
                <div className="grid grid-cols-3 gap-2">
                  <SelectBox value={bDay} onChange={setBDay} error={submitted && !birthOk}>
                    <option value="">{t("driver.day")}</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </SelectBox>
                  <SelectBox value={bMonth} onChange={setBMonth} error={submitted && !birthOk}>
                    <option value="">{t("driver.month")}</option>
                    {MONTH_KEYS.map((m, i) => (
                      <option key={m} value={String(i + 1)}>{t(`months.${m}`)}</option>
                    ))}
                  </SelectBox>
                  <SelectBox value={bYear} onChange={setBYear} error={submitted && !birthOk}>
                    <option value="">{t("driver.year")}</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </SelectBox>
                </div>

                {/* TC */}
                <div>
                  <Field
                    label={t("driver.tc")}
                    placeholder=""
                    inputMode="numeric"
                    maxLength={11}
                    value={tc}
                    onChange={(v) => setTc(digitsOnly(v, 11))}
                    error={submitted && !tcOk}
                  />
                  <label className="mt-1 flex cursor-pointer items-center gap-2 text-[12px] text-foreground">
                    <input
                      type="checkbox"
                      checked={notCitizen}
                      onChange={() => setNotCitizen((v) => !v)}
                      className="h-3.5 w-3.5 accent-brand"
                    />
                    {t("driver.notCitizen")}
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label={t("driver.flightNumber")}
                    placeholder="TK1234"
                    value={flightNo}
                    onChange={(v) => setFlightNo(formatFlightNo(v))}
                    maxLength={7}
                  />
                  <p className="mt-1 text-[11px] text-[#1a7ad9]">
                    {t("driver.flightNote")}
                  </p>
                </div>
              </div>

              {submitted && !valid && (
                <p className="mt-3 text-[13px] font-semibold text-destructive">
                  {t("driver.validationError")}
                </p>
              )}
            </div>

            {/* Invoice */}
            <div className="rounded-lg border border-border bg-white">
              <button
                type="button"
                onClick={() => setInvoiceOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <span className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                  <FileText className="h-5 w-5" />
                  {t("driver.invoiceTitle")}{" "}
                  <span className="text-[13px] font-normal text-muted-foreground">
                    {t("driver.optional")}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="flex items-center gap-4">
                    {(["bireysel", "kurumsal"] as const).map((it) => (
                      <span
                        key={it}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInvoiceType(it);
                        }}
                        className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground"
                      >
                        <span
                          className={cn(
                            "flex h-[16px] w-[16px] items-center justify-center rounded-full border",
                            invoiceType === it
                              ? "border-brand"
                              : "border-muted-foreground/50"
                          )}
                        >
                          {invoiceType === it && (
                            <span className="h-2 w-2 rounded-full bg-brand" />
                          )}
                        </span>
                        {it === "bireysel"
                          ? t("driver.individual")
                          : t("driver.corporate")}
                      </span>
                    ))}
                  </span>
                  {invoiceOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </span>
              </button>
              {invoiceOpen && (
                <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
                  <Field label={t("driver.invoiceName")} />
                  <Field
                    label={t("driver.invoiceTax")}
                    inputMode="numeric"
                    maxLength={11}
                    value={invoiceTax}
                    onChange={(v) => setInvoiceTax(digitsOnly(v, 11))}
                  />
                  <Field label={t("driver.invoiceAddress")} className="sm:col-span-2" />
                </div>
              )}
            </div>

            {/* Bottom CTA */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-right">
                <p className="text-[12px] text-muted-foreground">{t("totalAmount")}</p>
                <p className="text-[18px] font-bold text-foreground">
                  {money.format(ctx.total, 2)}
                </p>
              </div>
              <button
                type="button"
                onClick={submit}
                className="cta-press flex items-center gap-1 rounded-md bg-brand px-8 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
              >
                {t("driver.proceedToPayment")}
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <TotalSummary
              days={ctx.days}
              dailyTL={ctx.car.dailyTL}
              total={ctx.total}
            />
          </aside>
        </div>
      </Container>
    </main>
  );
}
