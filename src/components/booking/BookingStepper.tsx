import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

type State = "done" | "active" | "todo";

function dotState(step: number, current: number): State {
  if (step < current) return "done";
  if (step === current) return "active";
  return "todo";
}

/** current: 1-based index of the active step (2 = guest info, 3 = payment). */
export async function BookingStepper({ current }: { current: number }) {
  const t = await getTranslations("Booking");
  const STEPS = [
    t("stepper.selectRoom"),
    t("stepper.guestInfo"),
    t("stepper.payment"),
  ] as const;
  return (
    <div className="border-b border-border bg-white">
      <Container className="py-4">
        <ol className="mx-auto flex max-w-2xl items-center">
          {STEPS.map((label, i) => {
            const step = i + 1;
            const state = dotState(step, current);
            const isLast = i === STEPS.length - 1;
            return (
              <li
                key={label}
                className={cn("flex items-center", !isLast && "flex-1")}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold",
                      state === "done" && "bg-brand text-white",
                      state === "active" && "bg-brand text-white",
                      state === "todo" && "bg-tab-inactive text-white"
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-[13px] font-semibold",
                      state === "todo"
                        ? "text-tab-inactive"
                        : "text-foreground"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className={cn(
                      "mx-3 h-[2px] flex-1 rounded",
                      step < current ? "bg-brand" : "bg-border"
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
