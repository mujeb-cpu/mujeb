"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, Check, Package } from "lucide-react";
import type { EligibilityDecision, EligibilityOutcome } from "@/lib/domain";
import { OutcomeBadge } from "./outcome-badge";

export interface TraceStep {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export function DecisionTrace({
  steps,
  outcome,
  className,
  compact = false,
}: {
  steps: TraceStep[];
  outcome: EligibilityOutcome;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                step.active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <step.icon className="size-4" />
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-border" />
            )}
          </div>
          <div className={cn("flex-1", compact ? "pb-3" : "pb-6")}>
            <div className="text-xs font-medium text-muted-foreground">{step.label}</div>
            <div className={cn("text-sm font-medium text-foreground", compact && "text-xs")}>
              {step.value}
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border-2",
              outcome === "ELIGIBLE" && "border-eligible bg-eligible text-eligible-foreground",
              outcome === "NOT_ELIGIBLE" && "border-not-eligible bg-not-eligible text-not-eligible-foreground",
              outcome === "MANUAL_REVIEW" && "border-review bg-review text-review-foreground",
            )}
          >
            <Check className="size-4" />
          </div>
        </div>
        <div className="flex-1 pb-1">
          <div className="text-xs font-medium text-muted-foreground">Decision</div>
          <div className="pt-1">
            <OutcomeBadge outcome={outcome} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DecisionTraceCard({
  decision,
  className,
}: {
  decision: EligibilityDecision;
  className?: string;
}) {
  const steps: TraceStep[] = [
    {
      id: "clause",
      label: "Policy clause",
      value: "Items may be returned within 14 days of delivery",
      icon: FileText,
    },
    {
      id: "rule",
      label: "Approved rule",
      value: "Return window: 14 days from delivery date",
      icon: Check,
    },
    {
      id: "fact",
      label: "Order fact",
      value: "Delivered 6 days ago",
      icon: Package,
    },
  ];

  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Example decision trace</span>
      </div>
      <DecisionTrace steps={steps} outcome={decision.outcome} />
    </div>
  );
}

export function AnimatedDecisionTrace({
  steps,
  outcome,
  className,
}: {
  steps: TraceStep[];
  outcome: EligibilityOutcome;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const sequence: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((_, i) => {
      sequence.push(setTimeout(() => setActiveIndex(i), 400 + i * 700));
    });
    sequence.push(setTimeout(() => setActiveIndex(steps.length), 400 + steps.length * 700));

    const restart = setTimeout(() => {
      setActiveIndex(-1);
      steps.forEach((_, i) => {
        timeout = setTimeout(() => setActiveIndex(i), 400 + i * 700);
        sequence.push(timeout);
      });
      timeout = setTimeout(() => setActiveIndex(steps.length), 400 + steps.length * 700);
      sequence.push(timeout);
    }, 5000 + steps.length * 700);

    return () => {
      sequence.forEach(clearTimeout);
      clearTimeout(restart);
    };
  }, [steps.length]);

  return (
    <div className={cn("flex flex-col", className)}>
      {steps.map((step, i) => {
        const isActive = activeIndex >= i;
        const isCurrent = activeIndex === i;
        return (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-500",
                  isActive
                    ? "border-primary bg-primary/10 text-primary scale-100"
                    : "border-border bg-muted/50 text-muted-foreground scale-95",
                  isCurrent && "ring-4 ring-primary/20 scale-110",
                )}
              >
                <step.icon className={cn("size-4 transition-transform duration-300", isCurrent && "scale-110")} />
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-px flex-1 transition-colors duration-500",
                    activeIndex > i ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className={cn(
                "text-xs font-medium transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground",
              )}>
                {step.label}
              </div>
              <div className={cn(
                "text-sm font-medium transition-all duration-300",
                isActive ? "text-foreground opacity-100" : "text-muted-foreground/60 opacity-60",
              )}>
                {step.value}
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-500",
              activeIndex >= steps.length
                ? cn(
                    outcome === "ELIGIBLE" && "border-eligible bg-eligible text-eligible-foreground",
                    outcome === "NOT_ELIGIBLE" && "border-not-eligible bg-not-eligible text-not-eligible-foreground",
                    outcome === "MANUAL_REVIEW" && "border-review bg-review text-review-foreground",
                  )
                : "border-border bg-muted/50 text-muted-foreground scale-95",
              activeIndex >= steps.length && "scale-110 ring-4",
              activeIndex >= steps.length && outcome === "ELIGIBLE" && "ring-eligible/20",
              activeIndex >= steps.length && outcome === "NOT_ELIGIBLE" && "ring-not-eligible/20",
              activeIndex >= steps.length && outcome === "MANUAL_REVIEW" && "ring-review/20",
            )}
          >
            <Check className="size-4" />
          </div>
        </div>
        <div className="flex-1 pb-1">
          <div className={cn(
            "text-xs font-medium transition-colors duration-300",
            activeIndex >= steps.length ? "text-foreground" : "text-muted-foreground",
          )}>
            Decision
          </div>
          <div className={cn("pt-1 transition-all duration-500", activeIndex >= steps.length ? "opacity-100 scale-100" : "opacity-0 scale-90")}>
            <OutcomeBadge outcome={outcome} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
