import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LANG_COOKIE, CURRENCY_COOKIE } from "@/lib/locale";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Seed language + currency preferences on a visitor's first request, so the
 * app renders in the right language/currency from the very first SSR pass.
 * Defaults are fixed to English + Euro. Once a cookie exists (auto-seeded or
 * picked manually in the Header), it is respected and never overwritten.
 */
export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  const hasLang = request.cookies.has(LANG_COOKIE);
  const hasCurrency = request.cookies.has(CURRENCY_COOKIE);

  const cookieOpts = {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  if (!hasLang) {
    response.cookies.set(LANG_COOKIE, "en", cookieOpts);
  }

  if (!hasCurrency) {
    response.cookies.set(CURRENCY_COOKIE, "EUR", cookieOpts);
  }

  return response;
}

export const config = {
  // Run on pages only — skip API, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|videos|seo).*)"],
};
