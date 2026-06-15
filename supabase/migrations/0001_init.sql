-- Bookera catalogue schema
-- Public read-only (RLS select=true). Writes only via service-role key (ingest).

-- ───────────────────────── hotels ─────────────────────────
create table if not exists public.hotels (
  id              bigint primary key,            -- hotel id
  slug            text not null unique,          -- full hotel slug (incl. id)
  name            text not null,
  city            text,
  district        text,
  region          text,
  region_id       bigint,
  region_slug     text,
  location        text,                          -- "town, city, country" display
  rating          numeric(4,2) default 0,        -- reviewScore 0..10
  rating_label    text,
  star_rating     int default 0,
  review_count    int default 0,
  board           text,
  description     text,
  lat             double precision,
  lng             double precision,
  total_photos    int default 0,
  gallery         jsonb default '[]'::jsonb,
  amenities       jsonb default '[]'::jsonb,
  pois            jsonb default '[]'::jsonb,
  category_scores jsonb default '[]'::jsonb,
  ai_likes        jsonb default '[]'::jsonb,
  discount_pct    int default 0,
  old_price_tl    numeric(12,2),
  price_tl        numeric(12,2),
  nights          int default 2,
  rooms_left      int,
  is_cyprus       boolean default false,
  is_domestic     boolean default false,
  snapshot_checkin  date,
  snapshot_checkout date,
  scraped_at      timestamptz default now()
);
create index if not exists hotels_region_idx on public.hotels (region);
create index if not exists hotels_city_idx   on public.hotels (city);
create index if not exists hotels_rating_idx on public.hotels (rating desc);
create index if not exists hotels_cyprus_idx on public.hotels (is_cyprus);

-- ───────────────────────── rooms ─────────────────────────
create table if not exists public.rooms (
  id           bigserial primary key,
  hotel_id     bigint not null references public.hotels(id) on delete cascade,
  name         text not null,
  size_m2      int default 0,
  amenities    jsonb default '[]'::jsonb,
  images       jsonb default '[]'::jsonb,
  board        text,
  cancellable  boolean default false,
  discount_pct int default 0,
  old_price_tl numeric(12,2),
  price_tl     numeric(12,2),
  sort_order   int default 0
);
create index if not exists rooms_hotel_idx on public.rooms (hotel_id, sort_order);

-- ───────────────────────── reviews ─────────────────────────
create table if not exists public.reviews (
  id          bigserial primary key,
  hotel_id    bigint not null references public.hotels(id) on delete cascade,
  initials    text,
  name        text,
  review_date text,
  rating      numeric(4,2),
  text        text,
  room        text,
  stay        text,
  guest_type  text,
  source_key  text,
  unique (hotel_id, source_key)
);
create index if not exists reviews_hotel_idx on public.reviews (hotel_id);

-- ───────────────────────── cars ─────────────────────────
create table if not exists public.cars (
  id           bigserial primary key,
  slug         text not null unique,
  name         text not null,
  transmission text,
  fuel         text,
  min_age      int,
  km_limit     int,
  deposit_tl   numeric(12,2),
  delivery     text,
  car_class    text,
  supplier     text,
  rating       numeric(4,2),
  review_count int default 0,
  location     text,
  daily_tl     numeric(12,2),
  total_tl     numeric(12,2),
  free_cancel  boolean default false,
  accent       text,
  image        text,
  scraped_at   timestamptz default now()
);
create index if not exists cars_class_idx    on public.cars (car_class);
create index if not exists cars_supplier_idx on public.cars (supplier);

-- ───────────────────────── RLS: public read ─────────────────────────
alter table public.hotels  enable row level security;
alter table public.rooms   enable row level security;
alter table public.reviews enable row level security;
alter table public.cars    enable row level security;

drop policy if exists "public read hotels"  on public.hotels;
drop policy if exists "public read rooms"    on public.rooms;
drop policy if exists "public read reviews"  on public.reviews;
drop policy if exists "public read cars"     on public.cars;

create policy "public read hotels"  on public.hotels  for select using (true);
create policy "public read rooms"    on public.rooms   for select using (true);
create policy "public read reviews"  on public.reviews for select using (true);
create policy "public read cars"     on public.cars    for select using (true);
-- no insert/update/delete policies => anon cannot write; ingest uses service-role.
