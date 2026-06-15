import { createClient } from "@supabase/supabase-js";

/**
 * Server-side, read-only Supabase client (anon key). The catalogue is public
 * (RLS select=true), so no per-request cookie/session is needed.
 */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}
