// fx-refresh — refresh TRY exchange rates into public.fx_rates.
//
// Primary source: TCMB (Türkiye Cumhuriyet Merkez Bankası) official daily XML.
//   - TRY-centric, keyless, official. Published on banking days ~15:30 Istanbul.
// Fallback: Frankfurter (ECB daily, keyless) when TCMB is unavailable
//   (weekends/holidays return yesterday's file or 404).
//
// We store try_per_unit (how many TRY = 1 unit of the quote currency).
// If BOTH sources fail we leave existing rows untouched — never overwrite with
// nulls — so the app keeps using the last good rates.
//
// Invoked only by pg_cron (a few times/day), never per user request, so external
// rate limits cannot be exhausted.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const QUOTES = ["USD", "EUR", "GBP"] as const;
type Quote = (typeof QUOTES)[number];
type Rates = Partial<Record<Quote, number>>;

/** Parse TCMB today.xml → try_per_unit per quote using ForexSelling. */
async function fromTCMB(): Promise<{ rates: Rates; source: string } | null> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: { "User-Agent": "bookera-fx/1.0" },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const rates: Rates = {};
    for (const q of QUOTES) {
      // <Currency ... Kod="USD"> ... <Unit>1</Unit> ... <ForexSelling>32.2</ForexSelling> ...
      const block = xml.match(
        new RegExp(`<Currency[^>]*Kod="${q}"[\\s\\S]*?</Currency>`),
      )?.[0];
      if (!block) continue;
      const unit = Number(block.match(/<Unit>([\d.,]+)<\/Unit>/)?.[1]?.replace(",", ".") ?? "1");
      const sell = Number(
        block.match(/<ForexSelling>([\d.,]+)<\/ForexSelling>/)?.[1]?.replace(",", "."),
      );
      if (Number.isFinite(sell) && sell > 0 && unit > 0) rates[q] = sell / unit;
    }
    return Object.keys(rates).length ? { rates, source: "tcmb" } : null;
  } catch {
    return null;
  }
}

/** Frankfurter (ECB): base=TRY gives quote-per-TRY; invert to try_per_unit. */
async function fromFrankfurter(): Promise<{ rates: Rates; source: string } | null> {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?base=TRY&symbols=${QUOTES.join(",")}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rates: Rates = {};
    for (const q of QUOTES) {
      const perTry = Number(data?.rates?.[q]);
      if (Number.isFinite(perTry) && perTry > 0) rates[q] = 1 / perTry;
    }
    return Object.keys(rates).length ? { rates, source: "frankfurter" } : null;
  } catch {
    return null;
  }
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const result = (await fromTCMB()) ?? (await fromFrankfurter());

  if (!result) {
    return new Response(
      JSON.stringify({ ok: false, message: "all FX sources failed; rows untouched" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  const rows = Object.entries(result.rates).map(([quote, try_per_unit]) => ({
    quote,
    try_per_unit,
    source: result.source,
    fetched_at: now,
  }));

  const { error } = await supabase.from("fx_rates").upsert(rows, { onConflict: "quote" });
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, source: result.source, rows }), {
    headers: { "Content-Type": "application/json" },
  });
});
