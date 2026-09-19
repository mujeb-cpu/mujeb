"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  type EligibilityOutcome,
  type CaseStatus,
  OUTCOME_LABELS,
  CASE_STATUS_LABELS,
} from "@/lib/domain";
import { useLanguage } from "@/components/language-provider";

export function OutcomeBadge({
  outcome,
  className,
  size = "default",
}: {
  outcome: EligibilityOutcome;
  className?: string;
  size?: "sm" | "default";
}) {
  const { t } = useLanguage();
  const config = {
    ELIGIBLE: {
      icon: CheckCircle2,
      label: t(OUTCOME_LABELS[outcome], "مؤهل للإرجاع"),
      className: "bg-eligible-muted text-eligible border-eligible/20",
    },
    NOT_ELIGIBLE: {
      icon: XCircle,
      label: t(OUTCOME_LABELS[outcome], "غير مؤهل للإرجاع"),
      className: "bg-not-eligible-muted text-not-eligible border-not-eligible/20",
    },
    MANUAL_REVIEW: {
      icon: AlertCircle,
      label: t(OUTCOME_LABELS[outcome], "يتطلب مراجعة بشرية"),
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
  const { t } = useLanguage();
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
      {t(CASE_STATUS_LABELS[status], ({ OPEN: "مفتوح", AWAITING_ITEM: "بانتظار المنتج", RECEIVED: "تم الاستلام", RESOLVED: "مغلق", CANCELLED: "ملغى" } as Record<CaseStatus, string>)[status])}
    </span>
  );
}
