"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { faqItems } from "@/lib/data";
import { cn } from "@/lib/utils";

export function FAQ() {
  const t = useTranslations("Home");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-10">
      <Container className="max-w-[840px]">
        {/* Section heading */}
        <h2 className="mb-6 text-center text-2xl font-bold text-foreground">
          {t("faq.title")}
        </h2>

        {/* Accordion list */}
        <div className="divide-y divide-border rounded-lg border border-border bg-white">
          {faqItems.map((_, i) => {
            const expanded = open === i;
            return (
              <div key={i} className="group">
                {/* Question row */}
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : i)}
                  aria-expanded={expanded}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors",
                    "hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  )}
                >
                  <span className="text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-brand">
                    {t(`faq.items.${i}.q`)}
                  </span>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "shrink-0 text-brand transition-transform duration-300",
                      expanded ? "rotate-180" : "rotate-0"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Answer panel — max-height animation */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="px-6 pb-5 text-[14px] leading-[22px] text-muted-foreground">
                    {t(`faq.items.${i}.a`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
