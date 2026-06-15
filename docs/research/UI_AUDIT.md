# UI Audit — EnUygun Clone (doğrulanmış)

Taban: `http://localhost:3000` · Yöntem: Playwright (chromium) ile kullanıcı gibi tıklama + kod doğrulaması
Script'ler: `scripts/ui-audit.mjs` (geniş tarama) ve `scripts/verify-flows.mjs` (odaklı teyit)
Ekran görüntüleri: `docs/design-references/audit/` (10 adet)

> Not: Otomatik tarama 3 FAIL / 2 WARN üretti; tekrar test + kod incelemesiyle bunların
> 3'ünün **yanlış pozitif** (zamanlama/selector/eksik form alanı) olduğu doğrulandı.
> Aşağıdaki liste **teyit edilmiş** sonuçtur.

---

## ✅ ÇALIŞIYOR (kullanıcı gibi test edildi, doğrulandı)

### Veri katmanı
- Supabase bağlı ve veri dönüyor — anasayfa rail + sonuç listesi gerçek otelleri basıyor (Salamis Bay Conti, Concorde, Merit Park, Vuni Palace…).
- Hiç uncaught JS hatası yok, hiç console error yok, hiç HTTP ≥400 (statik/SSR) yok.

### Otel akışı (uçtan uca)
- **Anasayfa otel araması** → "Otel bul" → `/otel/kibris-45?...` (dest/checkin/checkout/guests param'larıyla). ✔
- **Sonuç listesi**: sıralama sekmeleri (Fiyat artan/azalan, Puan, Yüksek puan-düşük fiyat) çalışıyor; **filtreler** (bölge, pansiyon tipi, min/max fiyat) client-side `useMemo` ile gerçekten filtreliyor; "favorilere ekle" toggle; **harita modalı** (Leaflet) açılıyor. ✔
- **Otel detay**: galeri, oda kartları, yorumlar, kategori puanları, harita; "Odayı seç" → `/otel/rezervasyon?slug=...&room=...`. ✔
- **Rezervasyon (misafir formu)** → "Devam" → `/otel/odeme?slug=...`. ✔

### Araç kiralama akışı (uçtan uca)
- **Anasayfa araç araması** → "Araç bul" → `/arac-kiralama/sonuclar?...`. ✔
- **Sonuç listesi**: filtreler (vites, tedarikçi, sınıf), sıralama (select), harita modalı, "Hemen kirala" → `/arac-kiralama/kiralama`. ✔
- **Ekstralar (kiralama)** → "Devam" → `/arac-kiralama/surucu`. ✔
- **Sürücü formu**: tam client-side validation var (e-posta, telefon ≥10 hane, ad/soyad, doğum tarihi, TC 11 hane). Form tam dolunca → `/arac-kiralama/odeme`. ✔
  - _Otomatik tarama burada "WARN" verdi çünkü zorunlu alanları doldurmamıştı — validation doğru davranıyor, hata değil._

### Linkler
- Toplanan 76 iç linkten **61'i** 2xx/3xx (çalışıyor).

---

## ❌ ÇALIŞMIYOR / KIRIK (gerçek bug — kod teyitli)

| # | Yer | Sorun | Kanıt |
|---|-----|-------|-------|
| 1 | Anasayfa → "Rezervasyon Sorgula" sekmesi → **Sorgula** butonu | Hiçbir şey yapmıyor — `onClick` yok, statik | `Hero.tsx` `RezervasyonForm` (satır 143) |
| 2 | Otel ödeme → **"Ödeme yap"** butonu | `onClick` yok; tık → navigasyon yok, onay/başarı sayfası yok (mock) | `PaymentForm.tsx:280` |
| 3 | Araç ödeme → **"Ödeme Yap"** butonu | Aynı şekilde statik, sonuç yok | `PaymentStep.tsx:253` |
| 4 | Header → **"Giriş yap"** | `/giris-yap` 404 — auth/üyelik akışı hiç yok | `Header.tsx:70` |
| 5 | Anasayfa → **"Uçak+Otel"** sekmesi | Gerçek arama değil; statik alanlar, "Paketi ara" sadece `/otel/kibris-45`'e link | `Hero.tsx` `UcakOtelForm` |

### Ölü iç linkler (404 — route yok), 15 adet
Anasayfa/header/footer'ın işaret ettiği ama var olmayan sayfalar:

- **Ana dikeyler:** `/ucak-bileti`, `/otobus-bileti`, `/transfer` — sadece otel & araç var
- **`/otel`** (üst menüdeki "Otel") → 404 — ironik şekilde `/otel/kibris-45` çalışıyor ama kök `/otel` yok
- **Auth:** `/giris-yap`
- **Kampanyalar:** `/kampanyalar`, `/kampanyalar/otel/kibris`, `/kampanyalar/otel/ilk-rezervasyon`, `/kampanyalar/otel/axess`
- **Diğer:** `/iletisim`, `/bilgi` (blog), `/gsm`, `/internet-baglantilari`, `/kredi-karti-puanlari`, `/enuygun-hediye-kart`

---

## 🛠️ YAPILMASI GEREKENLER (öncelik sırası)

### P0 — Akışları kapatan kırıklar
1. **Ödeme onayı**: hotel + araç "Ödeme yap" butonlarına `onClick` + bir başarı/onay sayfası (`/otel/rezervasyon-tamamlandi` gibi) ekle. Şu an iki akış da son adımda ölüyor.
2. **Rezervasyon Sorgula**: butona davranış ver — ya gerçek sorgu sayfası ya da en azından "yakında" durumu.

### P1 — Beklenen ama eksik sayfalar
3. **`/otel` kök listeleme sayfası** (üst menü "Otel" tıklanınca 404 yerine genel otel arama/landing).
4. **Auth**: `/giris-yap` (giriş/üyelik) — en azından statik bir sayfa; "Cüzdan ile ödeme" de buna bağlı.
5. **Kampanyalar**: `/kampanyalar` listesi + alt kampanya sayfaları (anasayfada 4 kampanya kartı var, hepsi 404'e gidiyor).

### P2 — Diğer dikeyler / placeholder sayfalar
6. `/ucak-bileti`, `/otobus-bileti`, `/transfer` — gerçek enuygun'da ana dikeyler. En azından landing + "yakında" ya da basit arama placeholder.
7. Footer/utility linkleri: `/iletisim`, `/bilgi`, `/gsm`, `/internet-baglantilari`, `/kredi-karti-puanlari`, `/enuygun-hediye-kart` — basit içerik sayfaları.

### Küçük notlar
- Harita karoları doğrudan `tile.openstreetmap.org`'dan çekiliyor (modal kapanınca `ERR_ABORTED` log'ları normal, ama OSM rate-limit'e takılabilir — kendi tile sağlayıcısı/önbellek düşünülebilir).

---

## Gerçek enuygun ile kapsam karşılaştırması

| Özellik | Gerçek enuygun | Bu klon |
|--------|----------------|---------|
| Otel arama + listeleme + detay + rezervasyon | ✔ | ✔ (ödeme onayı hariç) |
| Araç kiralama (uçtan uca) | ✔ | ✔ (ödeme onayı hariç) |
| Uçak bileti | ✔ | ✖ (route yok) |
| Otobüs bileti | ✔ | ✖ |
| Transfer | ✔ | ✖ |
| Uçak+Otel paket | ✔ | ⚠️ statik/sahte |
| Üyelik / giriş | ✔ | ✖ (link 404) |
| Rezervasyon sorgulama | ✔ | ✖ (buton ölü) |
| Kampanyalar | ✔ | ✖ (kartlar var, sayfalar 404) |
| Ödeme tamamlama + onay | ✔ | ✖ (buton statik) |
| Sigorta/Finans (dış site) | ✔ | ✔ (dış linkler) |
