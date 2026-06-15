"use client";

import { createContext, useContext, useMemo } from "react";
import {
  type Currency,
  type FxRates,
  DEFAULT_CURRENCY,
  formatMoney,
} from "@/lib/currency";

type MoneyContext = { currency: Currency; rates: FxRates; locale: string };

const Ctx = createContext<MoneyContext | null>(null);

/**
 * Seeded once per render from the server (cookie currency + DB rates + locale)
 * in the root layout. After a currency change the Header writes the cookie and
 * calls router.refresh(), which re-renders the layout and re-seeds this provider
 * — so the cookie stays the single source of truth.
 */
export function CurrencyProvider({
  currency,
  rates,
  locale,
  children,
}: {
  currency: Currency;
  rates: FxRates;
  locale: string;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ currency, rates, locale }),
    [currency, rates, locale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export type UseMoney = {
  currency: Currency;
  locale: string;
  /** Format a stored TRY amount in the active currency. `decimals` 0 (default) or 2. */
  format: (amountTL: number, decimals?: 0 | 2) => string;
};

export function useMoney(): UseMoney {
  const ctx = useContext(Ctx);
  const currency = ctx?.currency ?? DEFAULT_CURRENCY;
  const rates = ctx?.rates ?? { TRY: 1 };
  const locale = ctx?.locale ?? "tr";
  return {
    currency,
    locale,
    format: (amountTL: number, decimals: 0 | 2 = 0) =>
      formatMoney(amountTL, rates, currency, locale, { decimals }),
  };
}
