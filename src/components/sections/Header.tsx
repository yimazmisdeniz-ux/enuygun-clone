"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { FlagTR, FlagGB } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useMoney } from "@/components/providers/CurrencyProvider";
import { CURRENCIES } from "@/lib/currency";
import { LOCALES, LANG_COOKIE, CURRENCY_COOKIE } from "@/lib/locale";

type Variant = "transparent" | "solid" | "white";

type Option = {
  value: string;
  short: string;
  label: string;
  flag?: React.ReactNode;
};

const CURRENCY_SYMBOL: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const FLAG_CLS = "h-[13px] w-[19.5px] shrink-0 rounded-[2px]";
const LANG_FLAG: Record<string, React.ReactNode> = {
  tr: <FlagTR className={FLAG_CLS} />,
  en: <FlagGB className={FLAG_CLS} />,
};

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persist a preference to a cookie the server can read on the next render. */
function setPrefCookie(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax${secure}`;
}

/** A header dropdown (currency / language) — opens a menu, persists the pick. */
function HeaderMenu({
  light,
  value,
  options,
  onSelect,
  ariaLabel,
}: {
  light: boolean;
  value: string;
  options: Option[];
  onSelect: (v: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 text-sm transition-opacity",
          light ? "text-foreground hover:opacity-70" : "text-white opacity-85 hover:opacity-100"
        )}
      >
        {current.flag && <span>{current.flag}</span>}
        <span className="font-semibold">{current.short}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-white py-1 text-foreground shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onSelect(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-surface",
                o.value === value ? "font-semibold text-brand" : "text-foreground"
              )}
            >
              {o.flag && <span>{o.flag}</span>}
              <span className="flex-1">{o.label}</span>
              {o.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({ variant = "transparent" }: { variant?: Variant }) {
  const light = variant === "white";
  // Intrinsic PNG dimensions — display size comes from the className (h-6 w-auto)
  const logo = light
    ? { src: "/bookera-navy.png", width: 569, height: 120 }
    : { src: "/bookera-white.png", width: 557, height: 120 };

  const router = useRouter();
  const t = useTranslations("Header");
  const tCur = useTranslations("Currency");
  const tLang = useTranslations("Language");

  // Single source of truth = cookies, exposed via the providers seeded server-side.
  const { currency } = useMoney();
  const locale = useLocale();

  const currencyOptions: Option[] = CURRENCIES.map((c) => ({
    value: c,
    short: c,
    label: `${CURRENCY_SYMBOL[c]} ${tCur(c)}`,
  }));

  const languageOptions: Option[] = LOCALES.map((l) => ({
    value: l,
    short: l.toUpperCase(),
    flag: LANG_FLAG[l],
    label: tLang(l),
  }));

  function chooseCurrency(v: string) {
    setPrefCookie(CURRENCY_COOKIE, v);
    router.refresh();
  }
  function chooseLang(v: string) {
    setPrefCookie(LANG_COOKIE, v);
    router.refresh();
  }

  const navLinks = [
    { href: "/otel/kibris-45", label: t("nav.hotels") },
    { href: "/arac-kiralama", label: t("nav.cars") },
  ];

  return (
    <>
      <header
        className={cn(
          "z-30",
          variant === "transparent" && "absolute inset-x-0 top-0 text-white",
          variant === "solid" && "relative bg-brand-ink text-white",
          variant === "white" &&
            "relative border-b border-border bg-white text-foreground"
        )}
      >
        <Container className="flex h-14 items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label={t("homeAria")}>
            <Image
              src={logo.src}
              alt="Bookera"
              width={logo.width}
              height={logo.height}
              priority
              unoptimized
              className="h-6 w-auto"
            />
          </Link>

          {/* Primary nav — desktop only */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  light
                    ? "text-foreground hover:bg-surface"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            {/* Currency */}
            <HeaderMenu
              light={light}
              value={currency}
              options={currencyOptions}
              onSelect={chooseCurrency}
              ariaLabel={t("currencyAria")}
            />

            {/* Language */}
            <HeaderMenu
              light={light}
              value={locale}
              options={languageOptions}
              onSelect={chooseLang}
              ariaLabel={t("languageAria")}
            />

          </div>
        </Container>
      </header>
    </>
  );
}
