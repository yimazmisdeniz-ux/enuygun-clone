# Design Tokens — enuygun.com/otel

Extracted via Playwright on 2026-06-05 (desktop viewport 1440×900, mobile 390×844).

## Typography

- **Font family (body+headings):** `Open Sans` (self-hosted via Next/font, identifier `__Open_Sans_8811fd`). Fallback stack: system.
- **Lang:** `tr`
- **Body:** 16px / `rgb(19, 23, 23)` on white
- **h1 (hero):** 24px / 700 / white on dark hero overlay
- **h2 (section):** 16px–20px / 600
- **h3 (card title):** 18px / 600 / `rgb(19, 23, 23)`
- **h4 (small):** 14px / 700 / 21px line-height
- **Buttons:** 14–18px / 700; primary CTA 18px / 700

## Colors

Source frequencies (mid-body excluding chrome):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page bg |
| `--fg` | `rgb(19,23,23)` ≈ `#131717` | Body text (2048 hits) |
| `--fg-inverse` | `#FFFFFF` | Text on hero / dark bar |
| `--muted` | `rgb(94,109,108)` ≈ `#5E6D6C` | Secondary text |
| `--muted-2` | `rgb(147,157,154)` ≈ `#939D9A` | Tertiary |
| `--brand-green` | `rgb(45,196,77)` ≈ `#2DC44D` | Primary CTA (Otel bul, Paketi ara), accent |
| `--brand-navy` | `rgb(27,47,111)` ≈ `#1B2F6F` | Header bar bg, brand secondary |
| `--brand-navy-dark` | `rgb(5,14,98)` ≈ `#050E62` | Darker navy accents |
| `--hero-overlay-from` | `rgba(2,17,65,0.7)` | Hero gradient top |
| `--hero-overlay-mid` | `rgba(2,17,65,0.25)` | Hero gradient mid |
| `--hero-overlay-to` | `rgba(2,17,65,0.2)` | Hero gradient bottom |
| `--surface` | `rgb(248,250,249)` ≈ `#F8FAF9` | Footer bg, subtle surfaces |
| `--border` | `rgb(215,221,219)` ≈ `#D7DDDB` | Card/input borders |
| `--tab-inactive` | `rgb(155,163,170)` ≈ `#9BA3AA` | Hero tab inactive bg |
| `--rating-yellow` | `rgb(185,201,0)` ≈ `#B9C900` | Rating chip |
| `--star-yellow` | `rgb(252,172,4)` ≈ `#FCAC04` | Stars |
| `--surface-2` | `rgb(39,69,92)` ≈ `#27455C` | Promo/dark surface |

Hero gradient (over `hot-home-page-background-72645.webp`):
```css
linear-gradient(rgba(2,17,65,0.7), rgba(2,17,65,0.25), rgba(2,17,65,0.2))
```

## Spacing & radius

- Primary CTA: `padding: 10px 24px; border-radius: 4px;`
- Login (pill): `padding: 5px 12px; border-radius: 100px; border: 1px solid #fff` (on dark header)
- Hero tabs: `padding: 7px 15px; border-radius: 8px 8px 0 0` (top-only radius — sit on top of search panel)
- Container max-width: **1120px** (hero panel width on 1440 viewport)
- Footer container: 1120px wide on 1425 viewport (≈ 152px side gutter)

## Breakpoints (inferred)

- Mobile ≤ 767
- Tablet 768–1023
- Desktop 1024–1199
- Wide ≥ 1200 (canonical: container 1120 + 152 gutters)

## Viewport meta

```
width=device-width, initial-scale=1, shrink-to-fit=0, maximum-scale=1, minimum-scale=1, user-scalable=0
```
(zoom locked on mobile — we will RELAX this; accessibility regression.)

## Assets cached locally

- `public/images/hero/hero-bg.webp` — 1920×600 hero bg
- `public/seo/favicon.ico`
- `public/images/themes/*.svg` — 12 theme icons
- `public/images/regions/*` — 12 popular region images
- `public/images/campaigns/*.webp` — 4 campaign banners
- `public/images/hotels/*.webp` — 8 Cyprus hotel covers
