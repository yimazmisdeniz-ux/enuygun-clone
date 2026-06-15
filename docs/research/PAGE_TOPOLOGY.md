# Page Topology — enuygun.com/otel

Top-down section order at desktop 1440×900. Y is approx scroll position.

| # | Y | Section | Component |
|---|---|---|---|
| 0 | 0 | Top dark navy bar (utility links + Sigorta/Finans/Kampanyalar/GSM/etc.) | `TopUtilityBar` |
| 1 | ~40 | Main header: logo + Uçak Bileti / Otel / Otobüs / Araç / Transfer + currency/lang + Giriş yap pill | `Header` |
| 2 | ~100 | **Hero** — bg image + navy gradient. h1 "Uygun Fiyatlı Otel Ara". Tab strip (Otel active / Yeni Uçak+Otel / Rezervasyon Sorgula). Search panel: Location + Date + Guests + green "Otel bul" CTA. Below: "Popüler aramalar" chips (Erken Rezervasyon, Kıbrıs, Balayı, Her Şey Dahil Antalya). | `Hero` + `SearchForm` + `PopularChips` |
| 3 | 730 | **Kıbrıs Otellerini Keşfedin** — horizontal card carousel of 16 Cyprus hotels. Each card: image, h3 name, location, rating chip (e.g. 9.3 Mükemmel), pension type, "2 kişi için 2 gecelik fiyat" line, price `56.160 TL'den itibaren`, "Seç" button. Top-right "Tümünü gör". | `HotelCarousel` + `HotelCard` |
| 4 | 1478 | **Kampanyalar** — tab strip (Otel / Uçak Bileti / Araç Kiralama / Otobüs / Kurumsal / Tümü). Carousel of 4 banner images (Kıbrıs, ENC, Seyahat, Axess). | `CampaignsTabs` + `BannerCarousel` |
| 5 | 1905 | **Popüler Bölgeler** — toggle Yurt İçi / Yurt Dışı. Bento-style grid of city tiles (İstanbul 2392 Otel, Muğla 1616, Ankara 282, Antalya 1904, İzmir 1264, Bursa 196, Samsun 71, Balıkesir 532) + a list of micro-regions (Muratpaşa, Bodrum, Marmaris, Çeşme, Alanya, Alaçatı, Fethiye, Lara, Ayvalık, Sapanca, Ölüdeniz, Şile, Kemer, Kuşadası). | `RegionsBento` |
| 6 | 2590 | **Tematik hotel rails** — 6 stacked horizontal carousels in sequence: spa, erken rezervasyon, çocuk dostu, muhafazakar, balayı, bungalov. Same `HotelCarousel` component. | `ThemedRails` |
| 7 | 3037 | **Tatil Temaları** — 4×4 grid of icon tiles (Bungalov, Termal, Tatil köyleri, Pansiyonlar, Butik, 5 yıldızlı, Her şey dahil, Muhafazakar, Balayı, Çocuk dostu, Denize sıfır, Aquaparklı, Engelli dostu, Doğa, Dağ, Spa). SVG icons + label. | `ThemeTiles` |
| 8 | 4383 | **Why ENUYGUN** — h2 "Ucuz Oteli Bulmak İçin Neden Enuygun.com'u Kullanmalıyım?" + 4 feature cards: Sayısız seçenek, En uygun otel, Hızlı ve kolay, Güvenle al. | `WhyUs` |
| 9 | 5275 | **FAQ** — h2 "Sıkça Sorulan Sorular" + 7 accordion items. Each Q opens an answer block. | `FAQ` |
| 10 | 5866 | **App promo** — h2 "Sana özel kampanyalar, fırsatlar ve daha fazlası ENUYGUN.com mobil uygulamasında". Phone visual + bullets (Uygulamaya özel fiyatlar / Anlık bildirimler / Sana özel kampanyalar / Yolcu kaydedebilme özelliği) + QR code + store badges. Rating 4.8. | `AppPromo` |
| 11 | 6294 | **Footer** — surface bg `#F8FAF9`. Two sub-sections:<br>• Popüler Bölgeler / Popüler Temalar link columns<br>• Mega-column grid: Uçak Bileti / Otel / Otobüs Bileti / Araç Kiralama / Transfer / Finans / Sigorta / Enuygun Kurumsal / Enuygun Hakkında / Diğer. Bottom: legal + payment marks. | `Footer` |

## Floating

- AI Asistan (chat bubble bottom-right) — `AIAsistanFAB`
- Cookie consent overlay — out of scope (OneTrust).
