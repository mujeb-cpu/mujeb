import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  type EligibilityOutcome,
  type CaseStatus,
  OUTCOME_LABELS,
  CASE_STATUS_LABELS,
} from "@/lib/domain";

export function OutcomeBadge({
  outcome,
  className,
  size = "default",
}: {
  outcome: EligibilityOutcome;
  className?: string;
  size?: "sm" | "default";
}) {
  const config = {
    ELIGIBLE: {
      icon: CheckCircle2,
      label: OUTCOME_LABELS[outcome],
      className: "bg-eligible-muted text-eligible border-eligible/20",
    },
    NOT_ELIGIBLE: {
      icon: XCircle,
      label: OUTCOME_LABELS[outcome],
      className: "bg-not-eligible-muted text-not-eligible border-not-eligible/20",
    },
    MANUAL_REVIEW: {
      icon: AlertCircle,
      label: OUTCOME_LABELS[outcome],
      className: "bg-review-muted text-review border-review/20",
    },
  };

  const { icon: Icon, label, className: variantClass } = config[outcome];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClass,
        size === "sm" && "px-2 py-0 text-[11px]",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {label}
    </span>
  );
}

export function CaseStatusBadge({
  status,
  className,
  size = "default",
}: {
  status: CaseStatus;
  className?: string;
  size?: "sm" | "default";
}) {
  const config: Record<CaseStatus, string> = {
    OPEN: "bg-accent text-accent-foreground border-border",
    AWAITING_ITEM: "bg-review-muted text-review border-review/20",
    RECEIVED: "bg-muted text-muted-foreground border-border",
    RESOLVED: "bg-eligible-muted text-eligible border-eligible/20",
    CANCELLED: "bg-muted text-muted-foreground border-border line-through",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config[status],
        size === "sm" && "px-2 py-0 text-[11px]",
        className,
      )}
    >
      {CASE_STATUS_LABELS[status]}
    </span>
  );
}
