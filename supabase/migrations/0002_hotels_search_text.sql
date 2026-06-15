-- ASCII-folded, lowercased search column so Turkish-character regions
-- (İstanbul, İzmir, Muğla, Çanakkale, Çıralı…) match the ASCII route slugs the
-- app navigates with (istanbul, izmir, mugla…). Without this, ilike on the raw
-- Turkish text never matches an ASCII term and the listing silently falls back
-- to the Cyprus default.
--
-- translate() + lower() are immutable, so the column can be GENERATED and
-- indexed. Applied to the live project via Supabase MCP on 2026-06-08.

create extension if not exists pg_trgm;

alter table public.hotels
  add column if not exists search_text text
  generated always as (
    lower(translate(
      coalesce(region,'') || ' ' || coalesce(city,'') || ' ' ||
      coalesce(district,'') || ' ' || coalesce(name,''),
      'İIıŞşĞğÇçÖöÜü',
      'IIiSsGgCcOoUu'
    ))
  ) stored;

create index if not exists hotels_search_text_trgm
  on public.hotels using gin (search_text gin_trgm_ops);
