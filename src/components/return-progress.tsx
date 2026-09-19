"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

export function ReturnProgress({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const { t } = useLanguage();
  const steps = [
    t("Verify", "التحقق"),
    t("Details", "التفاصيل"),
    t("Answer", "النتيجة"),
  ];

  return (
    <nav
      aria-label={t("Return progress", "تقدم الإرجاع")}
      className="flex w-full items-center"
    >
      {steps.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-200",
                  isDone && "bg-eligible text-eligible-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !isDone && !isCurrent && "bg-muted text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <Check className="size-3" strokeWidth={2.5} />
                ) : (
                  stepNum
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "hidden text-muted-foreground sm:inline",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px min-w-3 flex-1 transition-colors duration-300 sm:mx-3",
                  isDone ? "bg-eligible/45" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
