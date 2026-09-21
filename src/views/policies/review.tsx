"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { PolicyRule } from "@/lib/domain";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Draft = { id: string; name: string; rules: PolicyRule[] };

export function PolicyReviewPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();
  const { t, isArabic } = useLanguage();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!supabase || !draftId) { setLoading(false); return; }
    void supabase.from("policy_drafts").select("id, name, rules").eq("id", draftId).maybeSingle()
      .then((result: { data: unknown }) => { if (active) { setDraft(result.data as Draft | null); setLoading(false); } });
    return () => { active = false; };
  }, [draftId]);

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!draft) return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <AlertCircle className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t("Draft not found.", "لم يتم العثور على المسودة.")}</p>
      <Button variant="outline" onClick={() => router.push("/app/policies")}>{t("Back to policies", "العودة إلى السياسات")}</Button>
    </div>
  );

  const unresolved = draft.rules.some((rule) => !["approved", "edited"].includes(rule.approvalState));
  const approved = draft.rules.filter((rule) => ["approved", "edited"].includes(rule.approvalState)).length;
  const pending = draft.rules.filter((rule) => rule.approvalState === "pending").length;
  const rejected = draft.rules.filter((rule) => rule.approvalState === "rejected").length;

  const publish = async () => {
    if (!supabase || unresolved || publishing) return;
    setPublishing(true);
    const { data, error } = await supabase.rpc("publish_policy_draft", { p_draft_id: draft.id });
    setPublishing(false);
    const version = data?.[0]?.version_label as string | undefined;
    if (error || !version) return toast.error(t("Could not publish this policy.", "تعذّر نشر هذه السياسة."));
    setPublishedVersion(version);
    toast.success(t(`Policy ${version} published`, `تم نشر السياسة ${version}`));
  };

  if (publishedVersion) return (
    <Card className="border-eligible/30 bg-eligible-muted"><CardContent className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-eligible text-eligible-foreground"><Check className="size-6" /></span>
      <div><h1 className="font-display text-lg font-semibold">{t("Policy published", "تم نشر السياسة")}</h1><p className="mt-1 text-sm text-muted-foreground">{t(`${publishedVersion} is now active for return decisions.`, `أصبح الإصدار ${publishedVersion} مفعّلًا لقرارات الإرجاع.`)}</p></div>
      <Button onClick={() => router.push("/app/policies")}>{t("View policies", "عرض السياسات")}</Button>
    </CardContent></Card>
  );

  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
    <div><h1 className="font-display text-2xl font-semibold tracking-tight">{t("Review and publish", "المراجعة والنشر")}</h1><p className="mt-1 text-sm text-muted-foreground">{draft.name}</p></div>
    {unresolved && <div className="flex gap-3 rounded-xl border border-review/25 bg-review-muted p-4 text-sm text-review"><AlertCircle className="mt-0.5 size-4 shrink-0" /><p>{t("Every proposed rule must be approved or edited before publishing.", "يجب اعتماد كل قاعدة مقترحة أو تعديلها قبل النشر.")}</p></div>}
    <div className="flex flex-wrap gap-3"><Stat label={t("Approved", "معتمدة")} value={approved} tone="text-eligible" /><Stat label={t("Needs review", "بحاجة إلى مراجعة")} value={pending} tone="text-review" /><Stat label={t("Rejected", "مرفوضة")} value={rejected} tone="text-not-eligible" /></div>
    <div className="space-y-3">{draft.rules.map((rule) => <Rule key={rule.id} rule={rule} t={t} />)}</div>
    <Card className="border-dashed"><CardContent className="flex items-start gap-3 py-4"><Lock className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-medium">{t("Published versions are frozen", "الإصدارات المنشورة محفوظة")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t("This source text and its approved rules stay attached to every decision. Future edits create a new version.", "يبقى نص المصدر والقواعد المعتمدة مرتبطين بكل قرار. وأي تعديل لاحق ينشئ إصدارًا جديدًا.")}</p></div></CardContent></Card>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => router.push("/app/policies")}>{t("Cancel", "إلغاء")}</Button><Button onClick={() => void publish()} disabled={unresolved || publishing}>{publishing ? <Spinner /> : <ArrowRight className={cn("size-4", isArabic && "rotate-180")} />}{publishing ? t("Publishing…", "جارٍ النشر…") : t("Publish policy", "نشر السياسة")}</Button></div>
  </div>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="rounded-xl border bg-card px-4 py-2"><div className="text-xs text-muted-foreground">{label}</div><div className={cn("text-lg font-semibold tabular-nums", tone)}>{value}</div></div>; }

function Rule({ rule, t }: { rule: PolicyRule; t: (en: string, ar: string) => string }) {
  const state = rule.approvalState === "approved" ? t("Approved", "معتمدة") : rule.approvalState === "edited" ? t("Edited and approved", "معدّلة ومعتمدة") : rule.approvalState === "rejected" ? t("Rejected", "مرفوضة") : t("Needs review", "بحاجة إلى مراجعة");
  const tone = ["approved", "edited"].includes(rule.approvalState) ? "border-eligible/20 bg-eligible-muted text-eligible" : rule.approvalState === "rejected" ? "border-not-eligible/20 bg-not-eligible-muted text-not-eligible" : "border-review/20 bg-review-muted text-review";
  return <Card><CardContent className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{rule.name}</h2><Badge variant="outline" className={tone}>{state}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{rule.description}</p><p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs"><bdi>{rule.value}</bdi></p>{rule.sourceExcerpt && <blockquote dir="auto" className="mt-3 border-s-2 border-primary/30 ps-3 text-xs leading-6 text-muted-foreground">{rule.sourceExcerpt}</blockquote>}</CardContent></Card>;
}
