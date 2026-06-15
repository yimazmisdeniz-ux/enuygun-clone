import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Bookera",
  description:
    "Bookera Gizlilik Politikası — kişisel verilerinizi nasıl topladığımız, işlediğimiz ve koruduğumuz hakkında bilgi.",
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  return <LegalPage doc={getLegalDoc("privacy", locale)} />;
}
