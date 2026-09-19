"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { DEMO_CREDENTIALS } from "@/lib/fixtures";
import { Search, AlertCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { ReturnProgress } from "@/components/return-progress";

export function ReturnVerifyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const order = services.verifyOrder(orderNumber, email);
      setLoading(false);
      if (order) {
        sessionStorage.setItem("mujeeb-verified-order", JSON.stringify(order));
        router.push("/return/details");
      } else {
        setError(t("We couldn't verify this order. Please check your order number and email and try again.", "تعذر التحقق من الطلب. راجع رقم الطلب والبريد الإلكتروني ثم حاول مرة أخرى."));
      }
    }, 600);
  };

  const fillDemo = () => {
    setOrderNumber(DEMO_CREDENTIALS.orderNumber);
    setEmail(DEMO_CREDENTIALS.email);
  };

  return (
    <div className="flex flex-col gap-5">
      <ReturnProgress currentStep={1} />

      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{t("Start a return", "بدء طلب إرجاع")}</h1>
          <p className="text-sm text-muted-foreground">{t("Verify your order to check return eligibility.", "تحقق من طلبك لمعرفة أهلية المنتج للإرجاع.")}</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Card className="animate-scale-in">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="orderNumber">{t("Order number", "رقم الطلب")}</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="SA-10492"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t("Email or mobile", "البريد الإلكتروني أو رقم الجوال")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={loading || !orderNumber || !email} className="mt-2 group">
                {loading ? <Spinner className="mr-1" /> : <Search className="size-4" />}
                {t("Verify order", "التحقق من الطلب")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="size-3 text-primary" />
          {t("Demo helper", "بيانات التجربة")}
          {showDemo ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </ScrollReveal>

      {showDemo && (
        <Card className="border-dashed bg-muted/20 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">{t("Use these demo credentials to try the flow:", "استخدم هذه البيانات لتجربة رحلة الإرجاع:")}</p>
              <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs">
                <div>{t("Order", "الطلب")}: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.orderNumber}</span></div>
                <div>{t("Email", "البريد الإلكتروني")}: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.email}</span></div>
              </div>
              <Button variant="outline" size="sm" onClick={fillDemo}>{t("Fill demo credentials", "تعبئة بيانات التجربة")}</Button>
              <p className="text-[11px] text-muted-foreground/70">{t("These are synthetic fixtures, not real customer data.", "هذه بيانات تجريبية وليست بيانات عملاء حقيقية.")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
