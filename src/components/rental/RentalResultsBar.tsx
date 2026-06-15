import Link from "next/link";
import { Pencil, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";

export function RentalResultsBar({
  pickup,
  dates,
}: {
  pickup: string;
  dates: string;
}) {
  const t = useTranslations("Rental");
  return (
    <Container className="pt-5">
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <p className="truncate text-sm text-foreground">
          <span className="font-semibold">{pickup}</span>
          <span className="mx-2 text-border">|</span>
          <span className="text-muted-foreground">{dates}</span>
        </p>
        <Link
          href="/arac-kiralama"
          className="flex shrink-0 items-center gap-1.5 border-b-2 border-brand pb-0.5 text-sm font-semibold text-brand"
        >
          <Pencil className="h-4 w-4" />
          {t("resultsBar.editSearch")}
          <ChevronDown className="h-4 w-4" />
        </Link>
      </div>
    </Container>
  );
}
