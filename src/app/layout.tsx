import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { getCurrency, getFxRates } from "@/lib/currency.server";
import { SITE_URL } from "@/lib/site";

// Google Ads (gtag.js) — conversion tracking tag ID.
const GOOGLE_ADS_ID = "AW-18244062781";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bookera | Otel ve Araç Kiralama Rezervasyonu",
  description:
    "Bookera ile binlerce otel ve araç kiralama seçeneği arasından en uygun fiyatlı seçeneği bul, güvenle ve kolayca rezervasyon yap.",
  // Icons are provided via App Router file conventions:
  // src/app/{favicon.ico,icon.png,apple-icon.png} — Next emits the <link> tags.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const [currency, rates] = await Promise.all([getCurrency(), getFxRates()]);

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Google tag (gtag.js) — Google Ads */}
        <Script
          id="gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
        </Script>
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <NextIntlClientProvider>
          <CurrencyProvider currency={currency} rates={rates} locale={locale}>
            {children}
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
