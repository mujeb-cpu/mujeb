import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OutcomeBadge } from "@/components/outcome-badge";
import { services } from "@/lib/services";
import {
  type EligibilityDecision,
  type DeliveryFacts,
  REASON_LABELS,
  CONDITION_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/domain";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  FileText,
  ArrowRight,
  Check,
  ShieldCheck,
  Clock,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ReturnResultPage() {
  const navigate = useNavigate();
  const [decision, setDecision] = useState<EligibilityDecision | null>(null);
  const [order, setOrder] = useState<DeliveryFacts | null>(null);
  const [context, setContext] = useState<{ orderId: string; itemId: string; quantity: number; reason: string; condition: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const rawDecision = sessionStorage.getItem("mujeeb-decision");
    const rawOrder = sessionStorage.getItem("mujeeb-verified-order");
    const rawContext = sessionStorage.getItem("mujeeb-return-context");
    if (!rawDecision || !rawOrder) {
      navigate("/return");
      return;
    }
    setDecision(JSON.parse(rawDecision));
    setOrder(JSON.parse(rawOrder));
    if (rawContext) setContext(JSON.parse(rawContext));
  }, [navigate]);

  if (!decision || !order) return null;

  const handleSubmit = () => {
    if (submitted || !context) return;
    const newCase = services.createCase(
      order,
      context.itemId,
      context.quantity,
      context.reason as never,
      context.condition as never,
      decision,
    );
    setCaseId(newCase.id);
    setSubmitted(true);
    toast.success("Return request submitted");
  };

  const outcomeConfig = {
    ELIGIBLE: {
      icon: CheckCircle2,
      headline: "This item qualifies for return.",
      subtext: "All policy conditions are met.",
      color: "text-eligible",
      bg: "bg-eligible-muted",
      border: "border-eligible/30",
    },
    NOT_ELIGIBLE: {
      icon: XCircle,
      headline: "This item is outside the return policy.",
      subtext: "One or more policy conditions were not met.",
      color: "text-not-eligible",
      bg: "bg-not-eligible-muted",
      border: "border-not-eligible/30",
    },
    MANUAL_REVIEW: {
      icon: AlertCircle,
      headline: "Your store needs to take a closer look.",
      subtext: "Some details need manual verification.",
      color: "text-review",
      bg: "bg-review-muted",
      border: "border-review/30",
    },
  };

  const cfg = outcomeConfig[decision.outcome];
  const OutcomeIcon = cfg.icon;
  const appliedRules = decision.appliedRules ?? [];

  return (
    <div className="flex flex-col gap-5">
      <ProgressIndicator currentStep={3} />

      <Card className={cn("border-2", cfg.border, cfg.bg)}>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className={cn("flex size-14 items-center justify-center rounded-full", cfg.bg, cfg.color)}>
            <OutcomeIcon className="size-7" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {cfg.headline}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">{decision.explanation}</p>
          <OutcomeBadge outcome={decision.outcome} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Order" value={order.orderId} />
            <Detail label="Item" value={order.items.find((i) => i.id === context?.itemId)?.name ?? "—"} />
            <Detail label="Quantity" value={String(context?.quantity ?? 1)} />
            <Detail label="Reason" value={context ? REASON_LABELS[context.reason as never] : "—"} />
            <Detail label="Condition" value={context ? CONDITION_LABELS[context.condition as never] : "—"} />
            <Detail label="Policy version" value={decision.policyVersionLabel} />
            <Detail label="Evaluated" value={formatDateTime(decision.evaluatedAt)} />
            {decision.deadline && <Detail label="Return deadline" value={formatDate(decision.deadline)} />}
          </div>
        </CardContent>
      </Card>

      <Collapsible open={showRules} onOpenChange={setShowRules}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardContent className="flex items-center justify-between py-4 cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Applied rules</span>
                <Badge variant="outline" className="text-[10px]">{appliedRules.length}</Badge>
              </div>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showRules && "rotate-180")} />
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border px-6 py-4">
              {appliedRules.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {appliedRules.map((ar, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                      <div className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full mt-0.5",
                        ar.passed ? "bg-eligible text-eligible-foreground" : "bg-not-eligible text-not-eligible-foreground",
                      )}>
                        {ar.passed ? <Check className="size-3.5" /> : <XCircle className="size-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{ar.rule.name}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{ar.reasonCode}</code>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{ar.rule.description}</p>
                        <div className="mt-1 text-xs">
                          <span className="text-muted-foreground">Evaluated: </span>
                          <code className="rounded bg-card px-1.5 py-0.5 text-foreground">{ar.evaluatedValue}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rules were applied for this evaluation.</p>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {submitted ? (
        <Card className="border-eligible/30 bg-eligible-muted">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-eligible text-eligible-foreground">
              <Check className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Return request submitted</h2>
              <p className="text-sm text-muted-foreground">Case ID: <span className="font-mono">{caseId}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">Your store will review this request. You'll receive an update soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {decision.outcome === "ELIGIBLE" && (
            <Button size="lg" onClick={handleSubmit} className="group">
              Create return request
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
          {decision.outcome === "MANUAL_REVIEW" && (
            <Button size="lg" onClick={handleSubmit} className="group">
              Submit for review
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
          {decision.outcome === "NOT_ELIGIBLE" && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              This item does not meet the return policy conditions. If you believe this is an error, please contact the store directly.
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/return")}>
            Start a new return
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/70">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" />
          Human-approved rules
        </span>
        <span className="flex items-center gap-1">
          <Lock className="size-3" />
          Frozen evidence
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          Instant evaluation
        </span>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/70">
        Eligibility does not mean a refund has been issued. The store will process your request.
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Verify", "Details", "Answer"];
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              isDone && "bg-eligible text-eligible-foreground",
              isCurrent && "bg-primary text-primary-foreground",
              !isDone && !isCurrent && "bg-muted text-muted-foreground",
            )}>
              {isDone ? <Check className="size-3" /> : stepNum}
            </span>
            <span className={cn(isCurrent ? "font-medium text-foreground" : "")}>{label}</span>
            {i < steps.length - 1 && <span className="text-border">/</span>}
          </div>
        );
      })}
    </div>
  );
}
