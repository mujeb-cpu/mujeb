"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useDelayedLoad } from "@/hooks/use-delayed-load";
import { CaseDetailSkeleton } from "@/components/merchant-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutcomeBadge, CaseStatusBadge } from "@/components/outcome-badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import {
  type CaseStatus,
  type CaseEvent,
  type ReturnReason,
  type ItemCondition,
  REASON_LABELS,
  CONDITION_LABELS,
  formatDateTime,
  formatDate,
  CASE_STATUS_LABELS,
} from "@/lib/domain";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, ChevronDown,
  Package, Clock, FileText, Lock, MessageSquare, Send, History,
  ShieldCheck, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { t, isArabic } = useLanguage();
  // Domain enums are English-only in domain.ts; these pick the display label
  // for the active locale, keeping the same enum keys.
  const statusLabel = (status: CaseStatus) =>
    t(CASE_STATUS_LABELS[status], ({
      OPEN: "مفتوحة",
      AWAITING_ITEM: "بانتظار استلام المنتج",
      RECEIVED: "تم الاستلام",
      RESOLVED: "مغلقة",
      CANCELLED: "ملغاة",
    } as Record<CaseStatus, string>)[status]);
  const reasonLabel = (reason: ReturnReason) =>
    t(REASON_LABELS[reason], ({
      defective: "المنتج به عيب",
      wrong_item: "وصل منتج خاطئ",
      not_as_described: "لا يطابق الوصف",
      changed_mind: "غيّرت رأيي",
      damaged_in_transit: "تضرر أثناء الشحن",
    } as Record<ReturnReason, string>)[reason]);
  const conditionLabel = (condition: ItemCondition) =>
    t(CONDITION_LABELS[condition], ({
      new_unopened: "جديد، لم يُفتح",
      opened_unused: "مفتوح، غير مستخدم",
      used: "مستخدم",
    } as Record<ItemCondition, string>)[condition]);
  const [caseData, setCaseData] = useState(() => caseId ? services.getCase(caseId) : undefined);
  const [noteText, setNoteText] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const loaded = useDelayedLoad(260);

  if (!loaded) {
    return <CaseDetailSkeleton />;
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("Case not found.", "لم يتم العثور على الحالة.")}</p>
        <Button variant="outline" onClick={() => router.push("/app/cases")}>{t("Back to cases", "العودة إلى طلبات الإرجاع")}</Button>
      </div>
    );
  }

  const validTransitions: Record<CaseStatus, CaseStatus[]> = {
    OPEN: ["AWAITING_ITEM", "RESOLVED", "CANCELLED"],
    AWAITING_ITEM: ["RECEIVED", "CANCELLED"],
    RECEIVED: ["RESOLVED"],
    RESOLVED: [],
    CANCELLED: [],
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    const updated = services.updateCaseStatus(caseData.id, newStatus, "merchant");
    if (updated) {
      setCaseData({ ...updated });
      toast.success(t(`Case status changed to ${CASE_STATUS_LABELS[newStatus]}`, `تم تغيير حالة الطلب إلى ${statusLabel(newStatus)}`));
    } else {
      toast.error(t("Invalid status transition", "لا يمكن الانتقال إلى هذه الحالة"));
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    services.addNote(caseData.id, "Operations", noteText);
    setCaseData({ ...services.getCase(caseData.id)! });
    setNoteText("");
    toast.success(t("Note added", "تمت إضافة الملاحظة"));
  };

  const outcomeIcon = caseData.outcome === "ELIGIBLE" ? CheckCircle2 : caseData.outcome === "NOT_ELIGIBLE" ? XCircle : AlertCircle;
  const OutcomeIcon = outcomeIcon;
  const appliedRules = caseData.decision.appliedRules ?? [];

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/app/cases")} className="transition-transform active:scale-90">
            <ArrowLeft className={cn("size-4", isArabic && "rotate-180")} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{caseData.orderId}</h1>
              <OutcomeBadge outcome={caseData.outcome} size="sm" />
              <CaseStatusBadge status={caseData.caseStatus} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{caseData.id} · {t(`Created ${formatDateTime(caseData.createdAt)}`, `أُنشئت في ${formatDateTime(caseData.createdAt)}`)}</p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ScrollReveal delay={100} className="flex flex-col gap-4">
          {/* Decision explanation — centerpiece */}
          <Card className={cn(
            "border-2",
            caseData.outcome === "ELIGIBLE" && "border-eligible/20 bg-eligible-muted/20",
            caseData.outcome === "NOT_ELIGIBLE" && "border-not-eligible/20 bg-not-eligible-muted/20",
            caseData.outcome === "MANUAL_REVIEW" && "border-review/20 bg-review-muted/20",
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <OutcomeIcon className={cn(
                  "size-4",
                  caseData.outcome === "ELIGIBLE" && "text-eligible",
                  caseData.outcome === "NOT_ELIGIBLE" && "text-not-eligible",
                  caseData.outcome === "MANUAL_REVIEW" && "text-review",
                )} />
                {t("Why this decision happened", "سبب هذا القرار")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">{caseData.decision.explanation}</p>
              {appliedRules.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {appliedRules.map((ar, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                      <div className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5",
                        ar.passed ? "bg-eligible text-eligible-foreground" : "bg-not-eligible text-not-eligible-foreground",
                      )}>
                        {ar.passed ? <Check className="size-3" /> : <XCircle className="size-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{ar.rule.name}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{ar.reasonCode}</code>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{ar.rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="size-3" />
                  {t(`Policy ${caseData.decision.policyVersionLabel}`, `السياسة ${caseData.decision.policyVersionLabel}`)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDateTime(caseData.decision.evaluatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Requested item */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="size-4 text-muted-foreground" />
                {t("Requested item", "المنتج المطلوب إرجاعه")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label={t("Item", "المنتج")} value={caseData.itemName} />
                <Detail label={t("Quantity", "الكمية")} value={String(caseData.quantity)} />
                <Detail label={t("Reason", "السبب")} value={reasonLabel(caseData.reason)} />
                <Detail label={t("Condition", "حالة المنتج")} value={conditionLabel(caseData.condition)} />
                <Detail label={t("Customer", "العميل")} value={caseData.customerName} />
                <Detail label={t("Email", "البريد الإلكتروني")} value={caseData.customerEmail} />
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Collapsible open={evidenceOpen} onOpenChange={setEvidenceOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="flex items-center justify-between py-4 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t("Decision evidence", "أدلة القرار")}</span>
                    <Badge variant="outline" className="text-[10px]">{caseData.decision.relevantFacts.length}</Badge>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", evidenceOpen && "rotate-180")} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border px-6 py-4">
                  <div className="flex flex-col gap-3">
                    {caseData.decision.relevantFacts.map((fact, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{fact.label}</span>
                        <span className="font-medium text-foreground">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                  {caseData.decision.deadline && (
                    <div className="mt-3 rounded-lg bg-eligible-muted px-3 py-2 text-xs text-eligible">
                      {t(`Return deadline: ${formatDate(caseData.decision.deadline)}`, `آخر موعد للإرجاع: ${formatDate(caseData.decision.deadline)}`)}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Timeline */}
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="flex items-center justify-between py-4 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t("Timeline", "سجل الأحداث")}</span>
                    <Badge variant="outline" className="text-[10px]">{caseData.events.length}</Badge>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", timelineOpen && "rotate-180")} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border px-6 py-4">
                  <div className="flex flex-col gap-3">
                    {caseData.events.map((event: CaseEvent) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="size-2 rounded-full bg-primary" />
                          <div className="w-px flex-1 bg-border" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="text-sm text-foreground">{event.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(event.timestamp)} · {event.actor}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </ScrollReveal>

        <ScrollReveal delay={200} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("Operational actions", "الإجراءات التشغيلية")}</CardTitle>
            </CardHeader>
            <CardContent>
              {validTransitions[caseData.caseStatus].length > 0 ? (
                <div className="flex flex-col gap-2">
                  <Select onValueChange={(v) => handleStatusChange(v as CaseStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Change status...", "تغيير الحالة...")} />
                    </SelectTrigger>
                    <SelectContent>
                      {validTransitions[caseData.caseStatus].map((status) => (
                        <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("No further status changes available.", "لا توجد تغييرات أخرى متاحة على الحالة.")}</p>
              )}
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 mt-0.5 shrink-0" />
                <span>{t("Eligibility outcome is immutable. Changing status does not affect the decision.", "نتيجة الأهلية غير قابلة للتعديل، وتغيير الحالة لا يؤثر على القرار.")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="size-4 text-muted-foreground" />
                {t("Internal notes", "ملاحظات داخلية")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {caseData.notes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {caseData.notes.map((note) => (
                      <div key={note.id} className="rounded-lg bg-muted/30 p-3">
                        <p className="text-sm text-foreground">{note.content}</p>
                        <div className="mt-1 text-xs text-muted-foreground">{note.author} · {formatDateTime(note.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("Add a note...", "أضف ملاحظة...")}
                  className="min-h-[60px]"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()} className="self-start">
                  <Send className={cn("size-3.5", isArabic && "rotate-180")} />
                  {t("Add note", "إضافة ملاحظة")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
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
