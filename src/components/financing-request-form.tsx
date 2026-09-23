"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

/** The estimate the merchant was looking at when they asked. */
export interface FinancingSnapshot {
  monthlyReturns: number;
  orderValue: number;
  processingMinutes: number;
  resolutionDays: number;
  hourlyCost: number;
  tiedUp: number;
  operatingCost: number;
}

type Status = "idle" | "sending" | "sent" | "error";

export function FinancingRequestForm({
  snapshot,
}: {
  snapshot: FinancingSnapshot;
}) {
  const { t, isArabic } = useLanguage();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      // The figures go in with the contact details: the estimate on screen is
      // what the merchant is asking about, and recomputing it later from
      // inputs they may have changed would not be the same request.
      const { error: insertError } = await supabase
        .from("financing_requests")
        .insert({
          store_name: String(form.get("store") ?? "").trim(),
          contact_name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim() || null,
          monthly_returns: Math.round(snapshot.monthlyReturns),
          average_order_value: snapshot.orderValue,
          processing_minutes: Math.round(snapshot.processingMinutes),
          resolution_days: snapshot.resolutionDays,
          hourly_cost: snapshot.hourlyCost,
          tied_up_amount: Math.round(snapshot.tiedUp),
          operating_cost: Math.round(snapshot.operatingCost),
          locale: isArabic ? "ar" : "en",
        });

      if (insertError) throw insertError;
      setStatus("sent");
    } catch (submitError) {
      // Never strand the merchant on a dead form: show the failure and leave
      // their input in place so they can retry without retyping.
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("Something went wrong.", "حدث خطأ ما."),
      );
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && status === "sent") {
      setStatus("idle");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="financing-cta group h-12 w-full rounded-xl text-[15px] font-semibold">
          {t("Request return financing", "اطلب تمويل المرتجعات")}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl sm:max-w-lg">
        {status === "sent" ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-eligible-muted text-eligible">
              <CheckCircle2 className="size-6" />
            </span>
            <DialogTitle className="text-xl">
              {t("Request received", "تم استلام طلبك")}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {t(
                "We have your numbers. Someone from the team will be in touch about returns financing.",
                "وصلتنا أرقامك. سيتواصل معك أحد أعضاء الفريق بخصوص تمويل المرتجعات.",
              )}
            </DialogDescription>
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              className="mt-6 rounded-xl"
            >
              {t("Close", "إغلاق")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {t("Request return financing", "اطلب تمويل المرتجعات")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "Your estimate is attached to this request, so the conversation starts from your actual numbers.",
                  "سيُرفق تقديرك مع الطلب، لتبدأ المحادثة من أرقامك الفعلية.",
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="fin-store">
                  {t("Store name", "اسم المتجر")}
                </Label>
                <Input id="fin-store" name="store" required autoComplete="organization" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="fin-name">
                    {t("Your name", "اسمك")}
                  </Label>
                  <Input id="fin-name" name="name" required autoComplete="name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fin-phone">
                    {t("Phone", "رقم الجوال")}
                    <span className="ms-1 text-xs font-normal text-muted-foreground">
                      {t("(optional)", "(اختياري)")}
                    </span>
                  </Label>
                  <Input
                    id="fin-phone"
                    name="phone"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    className="text-start"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fin-email">
                  {t("Work email", "البريد الإلكتروني")}
                </Label>
                <Input
                  id="fin-email"
                  name="email"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  className="text-start"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-not-eligible">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 h-11 w-full rounded-xl"
              >
                {status === "sending" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {status === "sending"
                  ? t("Sending…", "جارٍ الإرسال…")
                  : t("Submit request", "إرسال الطلب")}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t(
                  "Submitting does not commit you to anything.",
                  "إرسال الطلب لا يُلزمك بأي شيء.",
                )}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
