import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side, read-only Supabase client (anon key). The catalogue is public
 * (RLS select=true), so no per-request cookie/session is needed.
 *
 * Returns null (instead of throwing) when env vars are missing, so pages
 * can degrade gracefully during deployment transitions or local development
 * without .env.local.
 */
let _sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Return a no-op client that always returns empty results instead of
    // throwing, so the site never 500s over missing env vars.
    console.warn(
      "Supabase env vars missing — returning empty results. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "in your environment.",
    );
    _sb = createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: { persistSession: false },
    });
    return _sb;
  }
  _sb = createClient(url, anon, {
    auth: { persistSession: false },
  });
  return _sb;
}