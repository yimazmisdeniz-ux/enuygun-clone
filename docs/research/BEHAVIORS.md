# Interaction & Behavior Notes

## Hero
- Tabs (Otel / Yeni Uçak+Otel / Rezervasyon Sorgula) swap the search form. Active tab is white-on-white-panel, inactive tabs use `--tab-inactive` (`#9BA3AA`) bg with white text. Tabs have top-only radius `8px 8px 0 0` and visually sit on top of the white search panel.
- Location field opens a dropdown (autocomplete by city/district/theme/hotel name).
- Date field opens a 2-month range calendar.
- Guests field opens stepper for rooms + adults + children + child ages.
- Submit button labels: `Otel bul` / `Paketi ara` / `Sorgula`.

## Hotel cards
- Hover: shadow lifts, no scale.
- Rating chip uses yellow `#B9C900` with white text on left, descriptor (Mükemmel / Harika / İyi …) text.
- Price uses Turkish thousands separator `.` (e.g. `56.160`).
- `Seç` button is white text on `--brand-green`.
- Carousel arrows on left/right; cards visible per slide: ~4 on desktop, 1.2 on mobile (peek next).

## Campaigns
- Category tabs filter the banner carousel.
- Banners are 2000×267 (≈ 16:2 wide). Slick-style autoplay infinite carousel.

## Popüler Bölgeler
- Yurt İçi / Yurt Dışı toggle swaps the dataset.
- 8 large image tiles in an asymmetric bento (some tall, some short). Below: pill list of secondary regions.

## Tatil Temaları
- 16 icon tiles in 4×4 grid (desktop). Each is a link → /otel/<theme-slug>.
- Hover: tile bg shifts to subtle gray.

## FAQ
- Single-open accordion (clicking another closes the previous one).
- Plus/minus icon on right.

## App promo
- Phone illustration + QR (99×99) + store badges (App Store, Google Play).

## Floating
- AI Asistan FAB bottom-right.

## Accessibility deviations from target (we will FIX)
- Target sets `maximum-scale=1, user-scalable=0` — we ship `width=device-width, initial-scale=1`.
- Target uses `lang="tr"` — we keep.

## Known target quirks
- Open Sans loaded via Next/font internally (font name `__Open_Sans_8811fd`). We will load via `next/font/google` `Open_Sans`.
- Heavy reliance on third-party cookies (OneTrust). Out of scope for the clone.
