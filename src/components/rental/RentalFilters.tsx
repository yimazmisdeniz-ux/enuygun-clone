"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Facet = { name: string; count: number };

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border px-4 py-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[15px] font-bold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
            checked
              ? "border-brand bg-brand"
              : "border-muted-foreground/50 bg-white"
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
              <path
                d="M2.5 6.5l2.5 2.5 4.5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
        />
        <span className="text-sm text-foreground">{label}</span>
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </label>
  );
}

export function RentalFilters({
  transmissions,
  suppliers,
  classes,
  selTransmissions,
  selSuppliers,
  selClasses,
  onToggleTransmission,
  onToggleSupplier,
  onToggleClass,
  onClear,
}: {
  transmissions: Facet[];
  suppliers: Facet[];
  classes: Facet[];
  selTransmissions: Set<string>;
  selSuppliers: Set<string>;
  selClasses: Set<string>;
  onToggleTransmission: (name: string) => void;
  onToggleSupplier: (name: string) => void;
  onToggleClass: (name: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations("Rental");
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-[17px] font-bold text-foreground">{t("filters.title")}</span>
        <button
          onClick={onClear}
          className="text-sm font-semibold text-[#1a7ad9] hover:underline"
        >
          {t("filters.clear")}
        </button>
      </div>

      <Section title={t("filters.transmission")}>
        {transmissions.map((f) => (
          <CheckRow
            key={f.name}
            label={f.name}
            count={f.count}
            checked={selTransmissions.has(f.name)}
            onToggle={() => onToggleTransmission(f.name)}
          />
        ))}
      </Section>

      <Section title={t("filters.supplier")}>
        <div className="max-h-[180px] overflow-y-auto pr-1">
          {suppliers.map((f) => (
            <CheckRow
              key={f.name}
              label={f.name}
              count={f.count}
              checked={selSuppliers.has(f.name)}
              onToggle={() => onToggleSupplier(f.name)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("filters.carClass")}>
        {classes.map((f) => (
          <CheckRow
            key={f.name}
            label={f.name}
            count={f.count}
            checked={selClasses.has(f.name)}
            onToggle={() => onToggleClass(f.name)}
          />
        ))}
      </Section>
    </div>
  );
}
