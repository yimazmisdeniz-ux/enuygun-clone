import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Çerez Politikası | Bookera",
  description:
    "Bookera Çerez Politikası — platformumuzda çerezlerin nasıl ve hangi amaçlarla kullanıldığı.",
};

export default async function CookiesPage() {
  const locale = await getLocale();
  return <LegalPage doc={getLegalDoc("cookies", locale)} />;
}
