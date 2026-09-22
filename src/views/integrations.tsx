"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Copy, ExternalLink, Link2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { IntegrationsPageSkeleton } from "@/components/merchant-skeletons";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";
import { formatDateString, formatDateTimeString } from "@/lib/numerals";

interface SallaConnection {
  external_store_name: string | null;
  status: "CONNECTING" | "CONNECTED" | "EXPIRED" | "REVOKED" | "ERROR";
  connected_at: string | null;
  last_synced_at: string | null;
}

export function IntegrationsPage() {
  const { user, workspace } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<SallaConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"connect" | "test" | "disconnect" | null>(null);
  const [returnCode, setReturnCode] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    if (!supabase || !workspace) return setLoading(false);
    const { data, error } = await supabase.from("commerce_connections")
      .select("external_store_name, status, connected_at, last_synced_at")
      .eq("store_id", workspace.storeId).eq("platform", "salla").maybeSingle();
    if (error) toast.error(t("Could not load the Salla connection.", "تعذّر تحميل ربط سلة."));
    setConnection(data as SallaConnection | null);
    const { data: store } = await supabase.from("stores").select("return_code").eq("id", workspace.storeId).maybeSingle();
    setReturnCode(typeof store?.return_code === "string" ? store.return_code : null);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { void loadConnection(); }, [loadConnection]);
  useEffect(() => {
    const result = searchParams.get("salla");
    if (!result) return;
    if (result === "connected") toast.success(t("Salla store connected successfully.", "تم ربط متجر سلة بنجاح."));
    else if (result === "cancelled") toast.info(t("Salla connection was cancelled.", "تم إلغاء ربط سلة."));
    else toast.error(t("Salla could not be connected. Please try again.", "تعذّر ربط سلة. يرجى المحاولة مرة أخرى."));
    router.replace("/app/integrations");
    void loadConnection();
  }, [loadConnection, router, searchParams, t]);

  const connect = async () => {
    if (!supabase || !workspace || !user) return;
    setAction("connect");
    const { data, error } = await supabase.functions.invoke("salla-oauth-start", {
      body: { storeId: workspace.storeId, redirectPath: "/app/integrations" },
    });
    if (error || !data?.authorizationUrl) {
      toast.error(t("Could not start Salla authorization.", "تعذّر بدء عملية التفويض مع سلة."));
      setAction(null);
      return;
    }
    window.location.assign(data.authorizationUrl);
  };

  const runAction = async (nextAction: "test" | "disconnect") => {
    if (!supabase || !workspace) return;
    setAction(nextAction);
    const { error } = await supabase.functions.invoke("salla-connection", {
      body: { storeId: workspace.storeId, action: nextAction },
    });
    if (error) toast.error(nextAction === "test" ? t("Salla did not accept the stored connection.", "لم تقبل سلة بيانات الربط المحفوظة.") : t("Could not disconnect Salla.", "تعذّر فصل الربط مع سلة."));
    else toast.success(nextAction === "test" ? t("Salla connection is healthy.", "الربط مع سلة يعمل بشكل سليم.") : t("Salla credentials removed from Relod.", "تم حذف بيانات سلة من ريلود."));
    await loadConnection();
    setAction(null);
  };

  const connected = connection?.status === "CONNECTED";
  const returnPath = returnCode ? `/return?store=${encodeURIComponent(returnCode)}` : null;

  const copyReturnLink = async () => {
    if (!returnPath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${returnPath}`);
    toast.success(t("Customer return link copied.", "تم نسخ رابط إرجاع العملاء."));
  };

  if (loading) {
    return <IntegrationsPageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 animate-fade-in">
      <ScrollReveal>
        <div>
          <Badge variant="outline" className="mb-3">{t("Commerce", "التجارة الإلكترونية")}</Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("Store integrations", "تكاملات المتجر")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t("Connect your Salla store so Relod can verify orders against real merchant data.", "اربط متجرك في سلة ليتمكن ريلود من التحقق من الطلبات ببيانات متجرك الفعلية.")}</p>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-[0_22px_70px_-42px_hsl(var(--foreground)/0.28)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-7 p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-[#004d5a] p-2 shadow-sm"><Image src="/salla-logo.png" alt="" width={44} height={44} className="rounded-xl" /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">{t("Salla", "سلة")}</h2>
                    {connected ? (
                      <Badge className="border-eligible/20 bg-eligible-muted text-eligible"><Check className="size-3" /> {t("Connected", "متصل")}</Badge>
                    ) : <Badge variant="outline">{t("Not connected", "غير متصل")}</Badge>}
                  </div>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                    {connected ? t(`Store authorization is active for ${connection.external_store_name ?? "your store"}.`, `تفويض الوصول إلى ${connection.external_store_name ?? "متجرك"} مفعّل.`) : t("Authorize read-only order access through Salla. Relod never receives your merchant password.", "امنح صلاحية قراءة الطلبات فقط عبر سلة. لن يطّلع ريلود على كلمة مرور متجرك إطلاقًا.")}
                  </p>
                  {connected && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t(
                      `Connected ${connection.connected_at ? formatDateString(connection.connected_at, { year: "numeric", month: "short", day: "numeric" }, locale) : "today"}`,
                      `تم الربط ${connection.connected_at ? formatDateString(connection.connected_at, { year: "numeric", month: "short", day: "numeric" }, locale) : "اليوم"}`,
                    )}</span>
                    <span>{t(
                      `Last checked ${connection.last_synced_at ? formatDateTimeString(connection.last_synced_at, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }, locale) : "not yet"}`,
                      `آخر تحقق ${connection.last_synced_at ? formatDateTimeString(connection.last_synced_at, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }, locale) : "لم يتم بعد"}`,
                    )}</span>
                  </div>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-5" aria-busy={action !== null}>
                {connected ? <>
                  <Button variant="outline" onClick={() => void runAction("test")} disabled={action !== null}>{action === "test" ? <Spinner /> : <RefreshCw className="size-4" />} {t("Check connection", "فحص الربط")}</Button>
                  <Button variant="ghost" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:ms-auto" onClick={() => void runAction("disconnect")} disabled={action !== null}>{action === "disconnect" ? <Spinner /> : <Unplug className="size-4" />} {t("Disconnect", "فصل الربط")}</Button>
                </> : <Button onClick={() => void connect()} disabled={loading || action !== null}>{action === "connect" ? <Spinner /> : <Link2 className="size-4" />} {t("Connect Salla", "ربط سلة")}</Button>}
              </div>
            </div>
            <div className="grid border-t border-border/60 bg-muted/20 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-4 text-sm"><ShieldCheck className="size-4 text-primary" /><span>{t("Encrypted credentials", "بيانات اعتماد مشفّرة")}</span></div>
              <div className="flex items-center gap-3 border-y border-border/60 p-4 text-sm sm:border-x sm:border-y-0"><Link2 className="size-4 text-primary" /><span>{t("Orders read only", "قراءة الطلبات فقط")}</span></div>
              <div className="flex items-center gap-3 p-4 text-sm"><Clock className="size-4 text-primary" /><span>{t("Disconnect anytime", "إمكانية فصل الربط في أي وقت")}</span></div>
            </div>
            {connected && returnPath && <div className="border-t border-border/60 p-5 sm:p-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-semibold">{t("Test a real customer order", "اختبر طلب عميل فعلي")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t("Use an order number and the customer email or mobile from this Salla store.", "استخدم رقم طلب وبريد العميل أو رقم جواله من متجر سلة هذا.")}</p></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void copyReturnLink()}><Copy className="size-4" />{t("Copy link", "نسخ الرابط")}</Button><Button size="sm" asChild><a href={returnPath} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />{t("Open test flow", "فتح مسار الاختبار")}</a></Button></div>
              </div>
            </div>}
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
