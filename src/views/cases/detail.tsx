"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, FileText, Lock, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { OutcomeBadge, CaseStatusBadge } from "@/components/outcome-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { CaseStatus, EligibilityOutcome } from "@/lib/domain";
import { formatDateTime } from "@/lib/domain";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type CaseData = {
  id: string; orderId: string; status: CaseStatus; outcome: EligibilityOutcome; createdAt: string;
  customer: Record<string, unknown>; item: Record<string, unknown>; decision: Record<string, any>;
};

const transitions: Record<CaseStatus, CaseStatus[]> = { OPEN: ["AWAITING_ITEM", "RESOLVED", "CANCELLED"], AWAITING_ITEM: ["RECEIVED", "CANCELLED"], RECEIVED: ["RESOLVED"], RESOLVED: [], CANCELLED: [] };

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { t, isArabic } = useLanguage();
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!supabase || !caseId) return setLoading(false);
    const result = await supabase.from("return_cases").select("id, order_id, status, customer_snapshot, item_snapshot, created_at, eligibility_decisions(outcome, reason_codes, order_facts_snapshot, policy_snapshot, evaluated_at, policy_versions(version_label))").eq("id", caseId).maybeSingle();
    const row = result.data as Record<string, any> | null;
    if (row) setData({ id: row.id, orderId: row.order_id, status: row.status, outcome: row.eligibility_decisions.outcome, createdAt: row.created_at, customer: row.customer_snapshot ?? {}, item: row.item_snapshot ?? {}, decision: row.eligibility_decisions ?? {} });
    setLoading(false);
  };
  useEffect(() => { void load(); }, [caseId]);

  const updateStatus = async (status: CaseStatus) => {
    if (!supabase || !data) return;
    setSaving(true);
    const { error } = await supabase.rpc("update_return_case_status", { p_case_id: data.id, p_status: status });
    setSaving(false);
    if (error) return toast.error(t("Could not update this case.", "تعذّر تحديث الحالة."));
    setData({ ...data, status }); toast.success(t("Case status updated", "تم تحديث حالة الطلب"));
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!data) return <div className="flex flex-col items-center gap-4 py-20 text-center"><AlertCircle className="size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t("Case not found.", "لم يتم العثور على الحالة.")}</p><Button variant="outline" onClick={() => router.push("/app/cases")}>{t("Back to cases", "العودة إلى الطلبات")}</Button></div>;

  const policy = data.decision.policy_versions ?? {};
  const snapshot = data.decision.policy_snapshot ?? {};
  const facts = data.decision.order_facts_snapshot ?? {};
  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
    <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.push("/app/cases")}><ArrowLeft className={cn("size-4", isArabic && "rotate-180")} /></Button><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-xl font-semibold">{data.orderId}</h1><OutcomeBadge outcome={data.outcome} size="sm" /><CaseStatusBadge status={data.status} size="sm" /></div><p className="mt-1 text-xs text-muted-foreground">{data.id} · {formatDateTime(data.createdAt)}</p></div></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Package className="size-4 text-primary" />{t("Return request", "طلب الإرجاع")}</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Detail label={t("Customer", "العميل")} value={String(data.customer.name ?? "—")} /><Detail label={t("Item", "المنتج")} value={String(data.item.name ?? "—")} /><Detail label={t("Quantity", "الكمية")} value={String(data.item.quantity ?? "—")} /><Detail label={t("Reason", "السبب")} value={String(data.item.reason ?? "—")} /><Detail label={t("Condition", "الحالة")} value={String(data.item.condition ?? "—")} /><Detail label={t("Order status", "حالة الطلب")} value={String(facts.orderStatus ?? "—")} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lock className="size-4 text-primary" />{t("Frozen decision evidence", "أدلة القرار المحفوظة")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Detail label={t("Policy version", "إصدار السياسة")} value={String(policy.version_label ?? "—")} /><Detail label={t("Evaluated", "وقت التقييم")} value={formatDateTime(String(data.decision.evaluated_at))} /><Detail label={t("Reason codes", "رموز الأسباب")} value={(data.decision.reason_codes ?? []).join(", ") || "—"} /><div className="rounded-xl border bg-muted/30 p-3 text-xs leading-6 text-muted-foreground"><FileText className="mb-2 size-4 text-primary" />{t(`${Array.isArray(snapshot.rules_snapshot) ? snapshot.rules_snapshot.length : 0} approved rules were frozen with this decision.`, `تم حفظ ${Array.isArray(snapshot.rules_snapshot) ? snapshot.rules_snapshot.length : 0} قاعدة معتمدة مع هذا القرار.`)}</div></CardContent></Card>
      </div>
      <Card className="h-fit"><CardHeader><CardTitle className="text-sm">{t("Operational status", "الحالة التشغيلية")}</CardTitle></CardHeader><CardContent className="space-y-3">{transitions[data.status].length ? <Select disabled={saving} onValueChange={(value) => void updateStatus(value as CaseStatus)}><SelectTrigger><SelectValue placeholder={t("Change status", "تغيير الحالة")} /></SelectTrigger><SelectContent>{transitions[data.status].map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select> : <p className="text-sm text-muted-foreground">{t("This case has no further status changes.", "لا توجد تغييرات أخرى متاحة لهذه الحالة.")}</p>}<div className="flex gap-2 rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />{t("Status changes never alter the original eligibility decision.", "تغيير الحالة لا يعدّل قرار الأهلية الأصلي.")}</div></CardContent></Card>
    </div>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium"><bdi>{value}</bdi></p></div>; }
