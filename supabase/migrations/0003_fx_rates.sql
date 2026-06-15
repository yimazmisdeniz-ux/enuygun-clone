-- FX rates cache. Prices are stored in TRY; the app converts at read-time using
-- these rates and NEVER calls an external FX API per request. A scheduled edge
-- function (fx-refresh) is the only thing that writes here (service-role), so
-- external rate limits are structurally impossible to exhaust.
--
-- try_per_unit = how many TRY equal 1 unit of `quote` (e.g. USD 39.0 => 1 USD = 39 TRY).

create table if not exists public.fx_rates (
  quote        text primary key,
  try_per_unit numeric(18,6) not null check (try_per_unit > 0),
  source       text not null default 'bootstrap',
  fetched_at   timestamptz not null default now()
);

alter table public.fx_rates enable row level security;

-- Public read (same model as the rest of the catalogue). No write policy:
-- writes only via service-role, which bypasses RLS.
drop policy if exists "fx_rates public read" on public.fx_rates;
create policy "fx_rates public read"
  on public.fx_rates for select
  using (true);

-- Bootstrap rows so the app never renders with zero rates before the first
-- cron tick. These are approximate and get corrected within hours by fx-refresh.
insert into public.fx_rates (quote, try_per_unit, source) values
  ('USD', 39.000000, 'bootstrap'),
  ('EUR', 42.000000, 'bootstrap'),
  ('GBP', 49.000000, 'bootstrap')
on conflict (quote) do nothing;
