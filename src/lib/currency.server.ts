import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabase } from "@/lib/supabase/server";
import {
  type Currency,
  type FxRates,
  DEFAULT_CURRENCY,
  isCurrency,
} from "@/lib/currency";
import { CURRENCY_COOKIE } from "@/lib/locale";

/**
 * Read FX rates from our own `fx_rates` table — never an external API at request
 * time. Wrapped in React cache() so multiple price components in one render
 * share a single query. Always returns at least { TRY: 1 } so conversion is safe
 * even before the table is seeded.
 */
export const getFxRates = cache(async (): Promise<FxRates> => {
  const rates: FxRates = { TRY: 1 };
  try {
    const sb = getSupabase();
    const { data } = await sb.from("fx_rates").select("quote,try_per_unit");
    for (const row of data ?? []) {
      const unit = Number(row.try_per_unit);
      if (Number.isFinite(unit) && unit > 0) rates[row.quote] = unit;
    }
  } catch {
    // table missing / network — fall back to TRY-only (prices render in TL).
  }
  return rates;
});

/** Currency the visitor chose (cookie), defaulting to TRY. */
export async function getCurrency(): Promise<Currency> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}
