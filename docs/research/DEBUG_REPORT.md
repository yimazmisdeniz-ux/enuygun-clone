# Debug & Mantık Hatası Raporu — EnUygun Klonu

_Tarih: 2026-06-08 · Yöntem: production build + 4 paralel alt-agent kod incelemesi (veri katmanı, otel akışı, araç kiralama akışı, anasayfa/UI)_

---

## ✅ Düzeltme Turu (2026-06-08) — typecheck ✓ build ✓ (11/11 rota)

Tüm High + Medium bug'lar ve seçili Low'lar düzeltildi. Dosya bazında:

- **H1** hardcoded `kibris-45` → `buildHotelHref(location, slug)` helper'ı; `location` segmenti karttan/haritadan/DetailNav'a geçiriliyor, dates+guests forward ediliyor. `HotelResultCard`, `SearchMapModal`, `SearchResults`, `DetailNav`, `otel/[location]/page.tsx`.
- **H2** detay→rezervasyon: `parseGuests()` ile `adults`/`roomCount` çözülüyor, `nights` tarihten türetiliyor, `RoomsSection`'a geçiriliyor.
- **H3** araç toplamı `car.dailyTL * days + extras` (sabit 3-gün yerine). `rental.ts`, `ExtrasStep`.
- **H4** "Şimdi yükselt" → gerçek `targetSlug` (toyota-corolla/peugeot-2008/mercedes-c200); artık 404 yok.
- **H5** `ExtrasStep` state'i `ctx.extras`'tan seed ediliyor; `rentalSearchParams()` ile days/dates/extras tüm adımlarda korunuyor.
- **M1** `DriverStep` controlled + validasyonlu; veri URL ile taşınıyor; `PaymentStep` gerçek değerleri gösteriyor (sabit "Eee/Sandal" kaldırıldı).
- **M2** geçersiz araç slug'ı artık ilk araca fallback yapıyor (hard-404 yerine).
- **M3** `getHotelResults` `reviews(name,review_date)` join'i ekledi → reviewer bloğu artık doluyor.
- **M4/M5** booking `nights` tarihten tutarlı; toplam `roomCount` ile çarpılıyor.
- **M6** Kampanya sekmeleri fonksiyonel (kategoriye göre filtre + boş durum).
- **M7** doğum yılı listesi `car.minAge`'e bağlandı (sabit referans yıl 2026 ile, hydration-safe).
- **Low** Türkçe slug'lar ASCII'ye (`/otel/cesme`), `formatTL` yuvarlama, `getHotelDetail` DB hatasını logluyor, çeşitli `type="button"`.

_Not: dinamik rotalar bu sandbox'ta canlı test edilemedi (arka plan süreçleri öldürülüyor); doğrulama typecheck + build + prerender HTML + statik grep ile yapıldı._

---

## 1. Lokalde Çalıştırma Engelleri

### E1 — lightningcss linux binary eksikti ✅ ÇÖZÜLDÜ
`node_modules` Windows'ta kurulmuştu; sadece `lightningcss-win32-x64-msvc` vardı, linux binary'si yoktu. Tailwind v4 CSS işleme aşamasında tüm rotalar 500 veriyordu.
**Çözüm:** `lightningcss-linux-x64-gnu@1.32.0` kuruldu, binary fallback yoluna kopyalandı, `.next` cache temizlendi. Sonuç: **`✓ Compiled successfully in 3.4s`**, TypeScript geçti.

### E2 — Supabase env değişkenleri yok ⚠️ AÇIK
`.env.local` yok. `getSupabase()` (`src/lib/supabase/server.ts:10-13`) env yoksa hata **fırlatıyor**. Sayfalarda `export const dynamic = 'force-dynamic'` olmadığı için Next bunları statik prerender etmeye çalışıyor ve build/dev çöküyor:
```
Error: Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
Export encountered an error on /page: /, exiting the build.
```
**Gerekli:** (a) gerçek Supabase projesi + `supabase/migrations/0001_init.sql` şeması + veri, ya da (b) env yoksa graceful fallback (sayfalar boş veriyle render olsun) + `force-dynamic`.

### E3 — Sandbox dev server'ı ayakta tutamıyor (ortam kısıtı)
Bu ortamda bir Bash çağrısı bittiğinde spawn edilen süreçler öldürülüyor (`exit 144`), bu yüzden `next dev` çağrılar arası yaşamıyor. **Proje hatası değil.** Kullanıcı kendi terminalinde `npm run dev` ile sorunsuz çalıştırabilir (E1 çözüldükten sonra).

---

## 2. Bug / Mantık Hataları

### 🔴 High

| # | Dosya:Satır | Sorun | Sonuç |
|---|---|---|---|
| H1 | `search/HotelResultCard.tsx:111,180`, `search/SearchMapModal.tsx:140`, `detail/DetailNav.tsx:66-83` | Tüm otel/detay/breadcrumb linkleri **`kibris-45`** segmentini hardcode ediyor | Kıbrıs dışı her aramada (Antalya, İstanbul…) link yanlış konuma gider, breadcrumb "Kıbrıs" der |
| H2 | `app/otel/[location]/[hotel]/page.tsx:46-53` → `detail/RoomsSection.tsx:166-191` | Detay sayfası `adults`/`roomCount`/`nights` değerlerini RoomsSection'a geçmiyor | Rezervasyon linki ve özeti her zaman **2 yetişkin / 1 oda / 3 gece** default'u kullanır; kullanıcının seçimi yok sayılır |
| H3 | `lib/rental.ts:163,171` | `days` hesaplanıyor ama `total = car.totalTL + extrasTotal` (3 günlük sabit fiyat) | `?days=7` olsa bile özet 3 günlük fiyatı gösterir; etiket "{days} günlük toplam tutar" der → yanlış ve tutarsız |
| H4 | `rental/ExtrasStep.tsx:131,151-157` | "Şimdi yükselt" upgrade slug'ları isimden uyduruluyor (`ford-focus`, `hyundai-bayon`…) | Bu slug'lar Supabase'de yok → `getCar()` null → `notFound()`. Yükselt'e basan kullanıcı **404**'e düşer, rezervasyon kaybolur |
| H5 | `rental/ExtrasStep.tsx:55` | Extras state `ctx.extras`'tan seed edilmiyor (boş başlatılıyor) | Geri navigasyonda URL'de taşınan seçili ekstralar OFF görünür ve toplam yanlış hesaplanır |

### 🟠 Medium

| # | Dosya:Satır | Sorun |
|---|---|---|
| M1 | `rental/DriverStep.tsx:28-32,235` + `rental/PaymentStep.tsx:101-104` | Sürücü formu tamamen uncontrolled, validasyon yok; "Ödemeye ilerle" düz `<Link>`. Girilen veri taşınmıyor — ödeme adımı sabit sahte değerler (`"Eee" / "Sandal" / "10310842436"`) gösteriyor |
| M2 | `lib/rental.ts:152-154` | Geçersiz/typo `?car=` slug'ı fallback yapmadan **hard 404** veriyor (sadece slug-yok durumu fallback yapıyor) |
| M3 | `lib/data.ts:143` + `lib/supabase/map.ts:37-40` → `search/HotelResultCard.tsx:127-141` | `getHotelResults` `reviews` join'i yapmıyor; `reviewer` her zaman `undefined` → tasarlanmış yorumcu bloğu hiç render olmuyor (ölü UI) |
| M4 | `lib/data.ts:479` vs `lib/supabase/map.ts:55` | Kart `nights` (DB, default 2) ile booking özeti `nights` (tarihten, default 3) farklı → aynı otelde "2 gece" / "3 Gece" tutarsızlığı |
| M5 | `lib/data.ts:480-486` (`getBookingContext`) | Booking toplamı `roomCount` ile çarpılmıyor. Özet "{roomCount} Oda" gösteriyor ama fiyat tek oda fiyatı (çok-oda undercharge). _Not: `nights` çarpımı tasarım gereği doğru olabilir — UI etiketi "X gece toplam tutar"; ama `roomCount` çarpımı eksik görünüyor. Fiyatın oda-başı mı stay-başı mı olduğu doğrulanmalı._ |
| M6 | `sections/Campaigns.tsx:19-30` | Kampanya kategori sekmeleri buton gibi görünüyor (hover/active) ama `onClick` yok, state yok → tıklama hiçbir şey yapmıyor |
| M7 | `rental/DriverStep.tsx:42` | Doğum yılı listesi (`2008 - i`) hardcode; her yıl kayar ve aracın gerçek `minAge`'iyle bağlantılı değil |

### 🟡 Low

- **Türkçe karakter slug'ları:** `sections/PopularRegions.tsx:257` (microRegions) — `"Çeşme"` → `/otel/çeşme` (ASCII olmayan URL, muhtemelen 404). Açık `{name, slug}` listesi kullanılmalı.
- **`formatTL` yuvarlama yok** (`lib/data.ts:32`) — `49500.5` → `"49.500,5"`; `maximumFractionDigits: 0` eklenmeli.
- **`getHotelDetail` null** (`lib/data.ts:411`) — DB hatası ile "bulunamadı" aynı path'e düşüyor; geçici Supabase hatası 404 olarak görünür, hata loglanmıyor.
- **`TopUtilityBar` ölü kod** — tanımlı ama `page.tsx`/`layout.tsx`'te render edilmiyor (`topNavLinks` de kullanılmıyor).
- **`type` eksik butonlar** — Hero/HotelRail/Campaigns/PopularRegions'ta `<button>` `type="button"` içermiyor (form eklenirse kazara submit riski).
- **`FiltersSidebar.tsx:136`** — "Daha fazla göster **(45)**" sayısı hardcode; fiyat "uygula" oku (`:90-95`) no-op.
- **RentalStepper sihirli sayılar** (`rental/RentalStepper.tsx` + her sayfada literal `current`) — pathname'den türetilmeli.
- **Araç arama tarihleri statik** (`rental/RentalSearchWidget.tsx:23-29`) — date picker yok, "06 Haz" sabit; `getRentalContext` long-form ("06 Haziran 2026") ile format uyuşmuyor.

---

## 3. Temiz Çıkan Alanlar (kontrol edildi, sorun yok)

- **Next 16 async `params`/`searchParams`:** tüm sayfalar Promise olarak tanımlayıp `await` ediyor — bug yok.
- **Map/Leaflet SSR:** `map/MapView.tsx` `LeafletMap`'i `next/dynamic` + `ssr:false` ile sarıyor — `window`/`document` sunucuda çalışmıyor.
- **Hydration:** hiçbir render path'inde `Math.random`/`Date.now`/`new Date()` yok; `getHotelCoords`/`poiCoords` deterministik.
- **`"use client"`:** interaktif tüm bileşenlerde mevcut.
- **next/image domainleri:** `next.config.ts` `cdn*.enuygun.com`'u whitelist'lemiş; tüm src'ler ya local ya whitelisted.
- **Supabase kolon adları:** tüm `.select()/.eq()/.order()` kolonları `0001_init.sql` şemasıyla uyuşuyor; jsonb alanları `arr<T>()` ile güvenli parse ediliyor.
- **globals.css tokenları:** bileşenlerin kullandığı tüm `brand-*`/`surface`/`rating` vb. tanımlı.

---

## 4. Önerilen Düzeltme Sırası

1. **E2 + `force-dynamic`** — siteyi lokalde açılabilir yap (Supabase env ya da graceful fallback).
2. **H1** — `location` segmentini result card / map modal / DetailNav'a geçir (Kıbrıs dışı akışı düzeltir).
3. **H2** — detay sayfasında `guests` parse edip RoomsSection'a `adults`/`roomCount`/`nights` geçir.
4. **H3, H4, H5** — araç kiralama fiyat/upgrade/extras state hataları.
5. **M1** — sürücü formunu controlled + validasyonlu yap, veriyi ödeme adımına taşı.
</content>
</invoke>
