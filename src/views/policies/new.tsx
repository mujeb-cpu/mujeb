"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { services } from "@/lib/services";
import { type PolicyRule, type RuleApprovalState } from "@/lib/domain";
import { toast } from "sonner";
import { FileText, Link2, PencilLine, Sparkles, Check, X, Edit3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type InputMethod = "paste" | "url" | "manual";

export function PolicyNewPage() {
  const router = useRouter();
  const [method, setMethod] = useState<InputMethod>("paste");
  const [policyName, setPolicyName] = useState("Returns Policy");
  const [sourceText, setSourceText] = useState("");
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractionState, setExtractionState] = useState<"idle" | "reading" | "proposing" | "ready" | "error">("idle");
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);


  const sampleText = useMemo(() => services.getSamplePolicyText(), []);

  const handleExtract = async () => {
    const text = method === "paste" ? sourceText : sampleText;
    if (!text.trim()) {
      toast.error("Please enter policy text first");
      return;
    }
    setExtracting(true);
    setExtractionState("reading");
    setRules([]);

    await new Promise((r) => setTimeout(r, 900));
    setExtractionState("proposing");

    await new Promise((r) => setTimeout(r, 1300));
    const sampleRules = services.getSampleRules().map((r) => ({
      ...r,
      id: `rule-${Math.random().toString(36).slice(2, 8)}`,
      approvalState: "pending" as RuleApprovalState,
    }));
    setRules(sampleRules);
    setExtractionState("ready");
    setExtracting(false);
    toast.success("Rules extracted — ready for your review");
  };

  const handleApprove = (ruleId: string) => {
    setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, approvalState: "approved" } : r));
  };

  const handleReject = (ruleId: string) => {
    setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, approvalState: "rejected" } : r));
  };

  const handleEditValue = (ruleId: string, newValue: string) => {
    setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, value: newValue, approvalState: "edited" as RuleApprovalState, creator: "merchant" as const } : r));
  };

  const handlePublish = () => {
    const unresolved = rules.some((r) => r.approvalState === "pending");
    if (unresolved) {
      toast.error("Some rules still need review");
      return;
    }
    const draft = services.createDraft(policyName, method === "paste" ? sourceText : sampleText);
    draft.rules = rules;
    router.push(`/app/policies/review/${draft.id}`);
  };

  const pendingCount = rules.filter((r) => r.approvalState === "pending").length;
  const approvedCount = rules.filter((r) => r.approvalState === "approved" || r.approvalState === "edited").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
          Create
          <span className="text-border">/</span>
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold">2</span>
          Review
          <span className="text-border">/</span>
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold">3</span>
          Publish
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">New policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create rules from your return policy text, then approve each one before publishing.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="policy-name">Policy name</Label>
          <Input id="policy-name" value={policyName} onChange={(e) => setPolicyName(e.target.value)} placeholder="Returns Policy" className="max-w-md" />
        </div>

        <Tabs defaultValue="paste" onValueChange={(v) => setMethod(v as InputMethod)}>
          <TabsList>
            <TabsTrigger value="paste"><FileText className="size-3.5" /> Paste text</TabsTrigger>
            <TabsTrigger value="url"><Link2 className="size-3.5" /> Policy URL</TabsTrigger>
            <TabsTrigger value="manual"><PencilLine className="size-3.5" /> Manual rules</TabsTrigger>
          </TabsList>

          <TabsContent value="paste">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="source">Paste your return policy text</Label>
                  <Textarea
                    id="source"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste your store's return and refund policy here..."
                    className="min-h-[200px]"
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => setSourceText(sampleText)}>
                      Use sample policy
                    </Button>
                    <Button onClick={handleExtract} disabled={extracting || !sourceText.trim()}>
                      {extracting ? <Spinner className="me-1" /> : <Sparkles className="size-4" />}
                      Extract rules
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="url">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="url">Policy URL</Label>
                  <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourstore.sa/policies/returns" />
                  <p className="text-xs text-muted-foreground">
                    This is a simulated preview. No real URL is fetched.
                  </p>
                  <Button onClick={handleExtract} disabled={extracting} className="self-start">
                    {extracting ? <Spinner className="me-1" /> : <Sparkles className="size-4" />}
                    Preview extraction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <PencilLine className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Manual rule creation will be available after extraction. Start with paste or URL to get AI-proposed rules, then edit them manually.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {(extracting || extractionState !== "idle") && (
        <ExtractionProgress state={extractionState} />
      )}

      {extractionState === "idle" && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">How it works:</span> Mujeeb proposes rules from your text. You decide what gets approved and published.</p>
        </div>
      )}

      {rules.length > 0 && extractionState === "ready" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Source text</h3>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="max-h-[500px] overflow-y-auto p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {(method === "paste" ? sourceText : sampleText)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Proposed rules</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-eligible">{approvedCount} approved</span>
                {pendingCount > 0 && <span className="text-review">{pendingCount} pending</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  isSelected={selectedRuleId === rule.id}
                  onSelect={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
                  onApprove={() => handleApprove(rule.id)}
                  onReject={() => handleReject(rule.id)}
                  onEditValue={(val) => handleEditValue(rule.id, val)}
                />
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={handlePublish} disabled={pendingCount > 0}>
              {pendingCount > 0 ? `${pendingCount} rules need review` : "Review for publication"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExtractionProgress({ state }: { state: string }) {
  const steps = [
    { key: "reading", label: "Reading policy", icon: FileText },
    { key: "proposing", label: "Proposing rules", icon: Sparkles },
    { key: "ready", label: "Ready for your review", icon: Check },
  ];
  const currentIndex = steps.findIndex((s) => s.key === state);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs transition-colors",
              isDone && "bg-eligible text-eligible-foreground",
              isActive && "bg-primary text-primary-foreground",
              !isDone && !isActive && "bg-muted text-muted-foreground",
            )}>
              {isDone ? <Check className="size-3.5" /> : <step.icon className="size-3.5" />}
            </div>
            <span className={cn("text-xs", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
            {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function RuleRow({
  rule,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onEditValue,
}: {
  rule: PolicyRule;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEditValue: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(rule.value);

  const stateConfig: Record<RuleApprovalState, { label: string; class: string }> = {
    pending: { label: "Pending", class: "bg-review-muted text-review border-review/20" },
    approved: { label: "Approved", class: "bg-eligible-muted text-eligible border-eligible/20" },
    rejected: { label: "Rejected", class: "bg-not-eligible-muted text-not-eligible border-not-eligible/20" },
    edited: { label: "Edited", class: "bg-accent text-accent-foreground border-border" },
  };

  const { label: stateLabel, class: stateClass } = stateConfig[rule.approvalState];

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all cursor-pointer",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30",
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{rule.name}</span>
            <Badge variant="outline" className={cn("text-[10px] py-0", stateClass)}>{stateLabel}</Badge>
            {rule.creator === "ai" ? (
              <span className="text-[10px] text-muted-foreground">AI-proposed</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Merchant-created</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
          {editing ? (
            <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" />
              <Button size="xs" onClick={() => { onEditValue(editValue); setEditing(false); }}>
                <Check className="size-3" />
              </Button>
              <Button size="xs" variant="ghost" onClick={() => { setEditing(false); setEditValue(rule.value); }}>
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{rule.value}</code>
            </div>
          )}
          {isSelected && rule.sourceExcerpt && (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2">
              <div className="text-[10px] font-medium text-primary">Source clause</div>
              <p className="mt-1 text-xs text-muted-foreground italic">"{rule.sourceExcerpt}"</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          {rule.approvalState === "pending" && (
            <>
              <Button size="icon-xs" variant="outline" onClick={onApprove} title="Approve">
                <Check className="size-3" />
              </Button>
              <Button size="icon-xs" variant="outline" onClick={onReject} title="Reject">
                <X className="size-3" />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} title="Edit">
                <Edit3 className="size-3" />
              </Button>
            </>
          )}
          {(rule.approvalState === "approved" || rule.approvalState === "edited") && (
            <>
              <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} title="Edit">
                <Edit3 className="size-3" />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={onReject} title="Reject">
                <X className="size-3" />
              </Button>
            </>
          )}
          {rule.approvalState === "rejected" && (
            <Button size="icon-xs" variant="outline" onClick={onApprove} title="Approve">
              <Check className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
