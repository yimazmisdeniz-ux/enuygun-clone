import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { normalizeLocale, LANG_COOKIE } from "@/lib/locale";

/**
 * next-intl request config — "without i18n routing". The active locale comes
 * from the `eu_lang` cookie (seeded by proxy.ts on first visit, or chosen in
 * the Header), so existing Turkish slug routes stay untouched.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LANG_COOKIE)?.value);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
