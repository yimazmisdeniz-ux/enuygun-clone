-- Machine-translation cache for free-form scraped Turkish content (hotel
-- descriptions, real guest reviews, long-tail amenity/POI/room names).
--
-- Populated ONCE by scripts/translate/translate-content.ts (Claude Haiku batch),
-- then read at request time by the app — so translation APIs are never called
-- per user request. Finite controlled vocabularies (rating/board/category/etc.)
-- are handled statically in src/lib/dataLabels.ts and are NOT stored here.

create table if not exists public.content_translations (
  source_text text not null,
  locale      text not null,
  translated  text not null,
  created_at  timestamptz not null default now(),
  primary key (source_text, locale)
);

alter table public.content_translations enable row level security;

drop policy if exists "content_translations public read" on public.content_translations;
create policy "content_translations public read"
  on public.content_translations for select
  using (true);
