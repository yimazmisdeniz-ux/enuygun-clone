import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kullanım Şartları | Bookera",
  description:
    "Bookera Kullanım Şartları — platformu kullanırken geçerli olan kurallar ve koşullar.",
};

export default async function TermsPage() {
  const locale = await getLocale();
  return <LegalPage doc={getLegalDoc("terms", locale)} />;
}
