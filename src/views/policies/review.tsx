"use client";

import { useRouter, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { services } from "@/lib/services";
import { type PolicyRule } from "@/lib/domain";
import { toast } from "sonner";
import { Check, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PolicyReviewPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const draft = useMemo(() => draftId ? services.getDraft(draftId) : undefined, [draftId]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  if (!draft) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Draft not found.</p>
        <Button variant="outline" onClick={() => router.push("/app/policies")}>Back to policies</Button>
      </div>
    );
  }

  const unresolved = draft.rules.some((r) => r.approvalState === "pending" || r.approvalState === "rejected");
  const approvedCount = draft.rules.filter((r) => r.approvalState === "approved" || r.approvalState === "edited").length;
  const pendingCount = draft.rules.filter((r) => r.approvalState === "pending").length;
  const rejectedCount = draft.rules.filter((r) => r.approvalState === "rejected").length;

  const handlePublish = () => {
    if (unresolved) {
      toast.error("Resolve all pending and rejected rules before publishing");
      return;
    }
    setPublishing(true);
    setTimeout(() => {
      const version = services.publishDraft(draft.id, "demo@novastore.sa");
      setPublishing(false);
      if (version) {
        setPublished(true);
        toast.success(`Policy ${version.versionLabel} published`);
      } else {
        toast.error("Could not publish — unresolved rules");
      }
    }, 800);
  };

  const stateBadge: Record<string, { label: string; class: string }> = {
    pending: { label: "Pending", class: "bg-review-muted text-review border-review/20" },
    approved: { label: "Approved", class: "bg-eligible-muted text-eligible border-eligible/20" },
    rejected: { label: "Rejected", class: "bg-not-eligible-muted text-not-eligible border-not-eligible/20" },
    edited: { label: "Edited by merchant", class: "bg-accent text-accent-foreground border-border" },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Review & publish</h1>
        <p className="mt-1 text-sm text-muted-foreground">{draft.name}</p>
      </div>

      {published ? (
        <Card className="border-eligible/30 bg-eligible-muted">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-eligible text-eligible-foreground">
              <Check className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Policy published</h2>
              <p className="text-sm text-muted-foreground">This version is now active for return decisions.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/app/policies")}>View policies</Button>
              <Button onClick={() => router.push("/app")}>Go to overview</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {unresolved && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                {pendingCount > 0 && `${pendingCount} rule${pendingCount > 1 ? "s" : ""} still pending. `}
                {rejectedCount > 0 && `${rejectedCount} rule${rejectedCount > 1 ? "s" : ""} rejected. `}
                Only published policies are used for return decisions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <StatBox label="Approved" value={approvedCount} color="text-eligible" />
            <StatBox label="Pending" value={pendingCount} color="text-review" />
            <StatBox label="Rejected" value={rejectedCount} color="text-not-eligible" />
          </div>

          <div className="flex flex-col gap-2">
            {draft.rules.map((rule) => (
              <RuleSummaryRow key={rule.id} rule={rule} stateBadge={stateBadge} />
            ))}
          </div>

          <Card className="border-dashed">
            <CardContent className="flex items-start gap-3 py-4">
              <Lock className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Published versions are frozen</p>
                <p className="text-xs text-muted-foreground">
                  Once published, this version's rules and source text are frozen with every decision. Editing creates a new draft.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/app/policies")}>Cancel</Button>
            <Button onClick={handlePublish} disabled={unresolved || publishing} className="group">
              {publishing ? "Publishing..." : "Publish policy"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-semibold tabular-nums", color)}>{value}</div>
    </div>
  );
}

function RuleSummaryRow({ rule, stateBadge }: { rule: PolicyRule; stateBadge: Record<string, { label: string; class: string }> }) {
  const cfg = stateBadge[rule.approvalState] ?? stateBadge.pending;
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{rule.name}</span>
            <Badge variant="outline" className={cn("text-[10px] py-0", cfg.class)}>{cfg.label}</Badge>
            {rule.creator === "ai" && <span className="text-[10px] text-muted-foreground">AI-proposed</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
          <code className="mt-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{rule.value}</code>
        </div>
        <div className="max-w-[200px] text-end">
          <div className="text-[10px] text-muted-foreground">Source</div>
          <p className="text-xs text-muted-foreground italic line-clamp-2">"{rule.sourceExcerpt}"</p>
        </div>
      </CardContent>
    </Card>
  );
}
