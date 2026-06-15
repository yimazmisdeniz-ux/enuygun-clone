import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

const STEP_KEYS = [
  "carSelection",
  "extras",
  "driver",
  "payment",
] as const;

/** current: 1-based active step (2 = ek hizmet, 3 = sürücü, 4 = ödeme). */
export function RentalStepper({ current }: { current: number }) {
  const t = useTranslations("Rental");
  return (
    <div className="border-b border-border bg-white">
      <Container className="py-4">
        <ol className="mx-auto flex max-w-3xl items-center">
          {STEP_KEYS.map((key, i) => {
            const label = t(`stepper.${key}`);
            const step = i + 1;
            const done = step < current;
            const activeStep = step === current;
            const isLast = i === STEP_KEYS.length - 1;
            return (
              <li
                key={label}
                className={cn("flex items-center", !isLast && "flex-1")}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold",
                      done || activeStep
                        ? "bg-brand text-white"
                        : "bg-tab-inactive text-white"
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden whitespace-nowrap text-[13px] font-semibold sm:inline",
                      done || activeStep
                        ? "text-foreground"
                        : "text-tab-inactive"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className={cn(
                      "mx-3 h-[2px] flex-1 rounded",
                      done ? "bg-brand" : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </div>
  );
}
