// Counts live rows in Supabase (anon key, RLS select=true) to see how much of
// the scraped catalogue actually made it into the running app's database.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// load .env.local manually (dotenv/config reads .env by default)
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(url, anon, { auth: { persistSession: false } });

async function count(table, filter) {
  let q = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? `ERR(${error.message})` : count;
}

console.log("hotels (total):     ", await count("hotels"));
console.log("hotels is_cyprus:   ", await count("hotels", (q) => q.eq("is_cyprus", true)));
console.log("hotels is_domestic: ", await count("hotels", (q) => q.eq("is_domestic", true)));
console.log("rooms:              ", await count("rooms"));
console.log("reviews:            ", await count("reviews"));
console.log("cars:               ", await count("cars"));

// distinct regions sample
const { data } = await sb.from("hotels").select("region").limit(2000);
if (data) {
  const regions = new Set(data.map((r) => r.region).filter(Boolean));
  console.log("distinct regions (sampled):", regions.size, "→", [...regions].slice(0, 15).join(", "));
}
