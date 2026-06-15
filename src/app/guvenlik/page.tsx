import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Güvenlik | Bookera",
  description:
    "Bookera Güvenlik — verilerinizi ve ödemelerinizi korumak için uyguladığımız güvenlik önlemleri.",
};

export default async function SecurityPage() {
  const locale = await getLocale();
  return <LegalPage doc={getLegalDoc("security", locale)} />;
}
