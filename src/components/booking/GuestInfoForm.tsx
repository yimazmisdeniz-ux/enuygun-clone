"use client";

import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, ChevronUp, ChevronLeft, MessageSquareText } from "lucide-react";
import { FlagTR, FlagGB, FlagUS, FlagDE, FlagFR } from "@/components/icons";
import { cn } from "@/lib/utils";
import { lettersOnly, formatTrPhone, digitsOnly } from "@/lib/input-format";
import type { BookingContext } from "@/lib/data";

// ---------------------------------------------------------------------------
// Country metadata for the phone code selector
// ---------------------------------------------------------------------------
interface Country {
  code: string;   // ISO 3166-1 alpha-2
  dial: string;   // international dial code
  label: string;  // display name (untranslated — shown as-is)
  flag: (props: { className?: string }) => React.ReactNode;
  /** Format the raw user input into a display phone mask */
  format: (v: string) => string;
  /** Maximum visible characters for the phone input */
  maxLen: number;
  /** Placeholder hint */
  placeholder: string;
}

const COUNTRIES: Country[] = [
  {
    code: "TR",
    dial: "90",
    label: "Türkiye",
    flag: FlagTR,
    format: formatTrPhone,
    maxLen: 13,
    placeholder: "5",
  },
  {
    code: "GB",
    dial: "44",
    label: "United Kingdom",
    flag: FlagGB,
    format: (v: string) => {
      const d = digitsOnly(v);
      if (d.startsWith("44") && d.length > 2) return "0" + d.slice(2, 11);
      return d.slice(0, 11);
    },
    maxLen: 14,
    placeholder: "7",
  },
  {
    code: "US",
    dial: "1",
    label: "United States",
    flag: FlagUS,
    format: (v: string) => {
      const d = digitsOnly(v);
      if (d.length === 0) return "";
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    },
    maxLen: 14,
    placeholder: "(555) 123-4567",
  },
  {
    code: "DE",
    dial: "49",
    label: "Germany",
    flag: FlagDE,
    format: (v: string) => {
      const d = digitsOnly(v);
      return d.slice(0, 11);
    },
    maxLen: 13,
    placeholder: "170 123 4567",
  },
  {
    code: "FR",
    dial: "33",
    label: "France",
    flag: FlagFR,
    format: (v: string) => {
      const d = digitsOnly(v);
      if (d.length === 0) return "";
      if (d.length <= 1) return `0${d}`;
      // group by 2 after leading 0
      const groups: string[] = [];
      const rest = d.slice(1, 10);
      for (let i = 0; i < rest.length; i += 2) {
        groups.push(rest.slice(i, i + 2));
      }
      return `0${groups.length ? " " + groups.join(" ") : ""}`;
    },
    maxLen: 14,
    placeholder: "6 12 34 56 78",
  },
];

/** Get ISO code from locale string (e.g. "en" → "GB") */
function defaultCountryCode(locale: string): string {
  return locale === "tr" ? "TR" : "GB";
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-white p-4 md:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-tab-inactive focus:border-brand";

function Radio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border",
          checked ? "border-[5px] border-brand" : "border-tab-inactive"
        )}
      />
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          checked ? "border-brand bg-brand" : "border-tab-inactive"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
            <path
              d="M2.5 6.2 4.7 8.4 9.5 3.6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  );
}

export function GuestInfoForm({
  ctx,
  nextHref,
}: {
  ctx: BookingContext;
  nextHref: string;
}) {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const pathname = usePathname();

  // Country selector state — default depends on locale
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((c) => c.code === defaultCountryCode(locale)) ?? COUNTRIES[0]
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondFirstName, setSecondFirstName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"erkek" | "kadin" | null>(null);
  const [foreign, setForeign] = useState(locale === "en");
  const [touchedGender, setTouchedGender] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email !== "" && emailRegex.test(email);
  const emailError = touchedEmail && !isEmailValid;
  const genderError = touchedGender && gender === null;
  const [secondGuest, setSecondGuest] = useState(false);
  const [requestOpen, setRequestOpen] = useState(true);
  const [note, setNote] = useState("");
  const [bedType, setBedType] = useState<"ayri" | "cift" | null>(null);
  const [honeymoon, setHoneymoon] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"bireysel" | "kurumsal">(
    "bireysel"
  );
  const [termsOpen, setTermsOpen] = useState(false);

  const FlagIcon = country.flag;

  return (
    <div className="space-y-4">
      {/* Iletisim Bilgileri */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-foreground">
            {t("guest.contactTitle")}
          </h2>
          <span className="rounded-md bg-surface px-2 py-1 text-[11px] font-semibold text-brand">
            {t("guest.freeSms")}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t("guest.emailLabel")}>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.replace(/\s+/g, ""));
                if (!touchedEmail) setTouchedEmail(true);
              }}
              onBlur={() => setTouchedEmail(true)}
              placeholder={t("guest.emailPlaceholder")}
              className={cn(inputCls, emailError && "border-destructive focus:border-destructive")}
              required
            />
            {emailError && (
              <p className="mt-1 text-[12px] text-destructive">{t("guest.emailInvalid")}</p>
            )}
          </Field>
          <Field label={t("guest.phoneLabel")}>
            <div className="flex items-center rounded-md border border-border bg-white focus-within:border-brand">
              {/* Country selector dropdown trigger */}
              <div className="relative" ref={countryRef}>
                <button
                  type="button"
                  onClick={() => setCountryOpen((v) => !v)}
                  className="flex items-center gap-1.5 border-r border-border px-3 py-2.5 text-sm hover:bg-surface"
                >
                  <FlagIcon className="h-[13px] w-[19.5px] shrink-0 rounded-[2px]" />
                  <span className="font-semibold text-muted-foreground">+{country.dial}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {/* Dropdown */}
                {countryOpen && (
                  <div className="absolute bottom-full left-0 z-50 mb-1 max-h-[240px] w-[220px] overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                    {COUNTRIES.map((c) => {
                      const CFlag = c.flag;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCountry(c);
                            setCountryOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface",
                            c.code === country.code && "bg-surface font-semibold"
                          )}
                        >
                          <CFlag className="h-[13px] w-[19.5px] shrink-0 rounded-[2px]" />
                          <span className="flex-1">{c.label}</span>
                          <span className="text-muted-foreground">+{c.dial}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(country.format(e.target.value))}
                maxLength={country.maxLen}
                placeholder={country.placeholder}
                className="w-full rounded-r-md bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-tab-inactive"
              />
            </div>
          </Field>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          {t("guest.contactNote")}
        </p>
      </Card>

      {/* Oda 1 - Konuk Bilgileri */}
      <Card>
        <h2 className="text-[16px] font-bold text-foreground">
          {t("guest.roomLabel", { n: 1 })}{" "}
          <span className="text-[13px] font-semibold text-muted-foreground">
            ({t("summary.adults", { count: ctx.adults })})
          </span>
        </h2>

        {/* 1. Yetiskin */}
        <div className="mt-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="text-muted-foreground">👤</span> {t("guest.adultN", { n: 1 })}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(lettersOnly(e.target.value))}
              placeholder={t("guest.firstName")}
              className={inputCls}
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(lettersOnly(e.target.value))}
              placeholder={t("guest.lastName")}
              className={inputCls}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Check
              label={t("guest.notTrCitizen")}
              checked={foreign}
              onChange={() => setForeign((v) => !v)}
            />
            <div className="flex items-center gap-5">
              <span className="text-sm text-muted-foreground">
                {t("guest.gender")}
                <span className="ml-0.5 text-destructive">*</span>
              </span>
              <Radio
                name="gender"
                label={t("guest.male")}
                checked={gender === "erkek"}
                onChange={() => { setGender("erkek"); setTouchedGender(true); }}
              />
              <Radio
                name="gender"
                label={t("guest.female")}
                checked={gender === "kadin"}
                onChange={() => { setGender("kadin"); setTouchedGender(true); }}
              />
            </div>
          </div>
        </div>

        {/* 2. Yetiskin */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="text-muted-foreground">👤</span> {t("guest.adultN", { n: 2 })}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("guest.optional")})
            </span>
          </p>
          {secondGuest ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={secondFirstName}
                onChange={(e) => setSecondFirstName(lettersOnly(e.target.value))}
                placeholder={t("guest.firstName")}
                className={inputCls}
              />
              <input
                value={secondLastName}
                onChange={(e) => setSecondLastName(lettersOnly(e.target.value))}
                placeholder={t("guest.lastName")}
                className={inputCls}
              />
            </div>
          ) : (
            <button
              onClick={() => setSecondGuest(true)}
              className="text-sm font-semibold text-[#1a7ad9] hover:underline"
            >
              {t("guest.fillGuestInfo")}
            </button>
          )}
        </div>

        {/* Special request */}
        <div className="mt-5 border-t border-border pt-4">
          <button
            onClick={() => setRequestOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-foreground">
              {t("guest.specialRequestQuestion")}
            </span>
            {requestOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {requestOpen && (
            <div className="mt-3">
              <p className="text-[12px] text-brand">
                {t("guest.specialRequestNote")}
              </p>
              <div className="relative mt-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder={t("guest.notePlaceholder")}
                  className={cn(inputCls, "resize-none")}
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-tab-inactive">
                  {note.length}/500
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("guest.maxChars", { n: 500 })}
              </p>
              <div className="mt-3 flex flex-wrap gap-6">
                <Radio
                  name="bed"
                  label={t("guest.twinBeds")}
                  checked={bedType === "ayri"}
                  onChange={() => setBedType("ayri")}
                />
                <Radio
                  name="bed"
                  label={t("guest.doubleBed")}
                  checked={bedType === "cift"}
                  onChange={() => setBedType("cift")}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Balayi */}
      <Card>
        <Check
          label={t("guest.honeymoonQuestion")}
          checked={honeymoon}
          onChange={() => setHoneymoon((v) => !v)}
        />
      </Card>

      {/* Fatura Bilgileri */}
      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <h2 className="text-[16px] font-bold text-foreground">
            {t("guest.invoiceTitle")}
          </h2>
          <Radio
            name="invoice"
            label={t("guest.individual")}
            checked={invoiceType === "bireysel"}
            onChange={() => setInvoiceType("bireysel")}
          />
          <Radio
            name="invoice"
            label={t("guest.corporate")}
            checked={invoiceType === "kurumsal"}
            onChange={() => setInvoiceType("kurumsal")}
          />
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          {t("guest.invoiceNote")}
        </p>
      </Card>

      {/* Rezervasyon Kosullari */}
      <Card>
        <button
          onClick={() => setTermsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[16px] font-bold text-foreground">
            {t("guest.termsTitle")}
          </span>
          {termsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {termsOpen && (
          <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />
            {t("guest.termsBody")}
          </p>
        )}
      </Card>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setTouchedEmail(true);
            setTouchedGender(true);
            if (!email || !emailRegex.test(email) || gender === null) return;
            const params = new URLSearchParams(nextHref.replace("/otel/odeme?", ""));
            if (firstName) params.set("ad", firstName + " " + lastName);
            if (phone) params.set("tel", phone);
            window.location.href = "/otel/odeme?" + params.toString();
          }}
          className="rounded-md bg-brand px-7 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          {t("guest.proceedToPayment")}
        </button>
      </div>
    </div>
  );
}