import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep checkout/funnel + confirmation pages out of the index.
      disallow: [
        "/api/",
        "/otel/odeme",
        "/otel/rezervasyon",
        "/arac-kiralama/odeme",
        "/arac-kiralama/surucu",
        "/arac-kiralama/kiralama",
        "/rezervasyon-tamamlandi",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
