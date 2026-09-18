import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AnimatedDecisionTrace,
  type TraceStep,
} from "@/components/decision-trace";
import { OutcomeBadge } from "@/components/outcome-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { OutcomeSequence } from "@/components/outcome-sequence";
import { ReturnsCostCalculator } from "@/components/returns-cost-calculator";
import { PolicyTransformation } from "@/components/policy-transformation";
import {
  PhoneFrame,
  WhatsAppThread,
  WhatsAppChannel,
  WHATSAPP_STATUS,
  type ThreadMessage,
} from "@/components/phone-frame";
import {
  ORDER_ELIGIBLE,
  ORDER_EXPIRED,
  ORDER_MISSING_DELIVERY,
  PUBLISHED_POLICY_V1,
} from "@/lib/fixtures";
import { evaluateEligibility } from "@/lib/engine";
import { OUTCOME_LABELS, DEMO_CLOCK, daysBetween } from "@/lib/domain";
import {
  FileText,
  Check,
  Package,
  ArrowRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const HERO_STEPS: TraceStep[] = [
  {
    id: "clause",
    label: "Policy clause",
    value: "Items may be returned within 14 days of delivery",
    icon: FileText,
  },
  {
    id: "rule",
    label: "Approved rule",
    value: "Return window: 14 days from delivery date",
    icon: Check,
  },
  {
    id: "fact",
    label: "Order fact",
    value: "Delivered 6 days ago",
    icon: Package,
  },
];

const EXAMPLES = [ORDER_ELIGIBLE, ORDER_MISSING_DELIVERY, ORDER_EXPIRED].map(
  (facts) => {
    const decision = evaluateEligibility({
      policyVersion: PUBLISHED_POLICY_V1,
      facts,
      itemId: facts.items[0].id,
      quantity: 1,
      reason: "defective",
      condition: "new_unopened",
    });
    const elapsed = facts.deliveryDate
      ? daysBetween(new Date(facts.deliveryDate), DEMO_CLOCK.now)
      : null;
    const rule =
      elapsed === null
        ? "Delivery date unavailable · merchant review needed"
        : `Delivered ${elapsed} days ago · 14-day return window`;
    const messages: ThreadMessage[] = [
      {
        id: "customer",
        direction: "outgoing",
        text: `Can I return my ${facts.items[0].name.toLowerCase()}? My order is ${facts.orderId}.`,
      },
      {
        id: "decision",
        direction: "incoming",
        text: decision.explanation,
        decision,
        rule,
      },
    ];
    return { facts, decision, messages };
  },
);


export function LandingPage() {
  const navigate = useNavigate();
  const { t, isArabic } = useLanguage();
  const heroSteps = HERO_STEPS.map((step, index) => ({ ...step, label: [t("Policy clause", "نص السياسة"), t("Approved rule", "قاعدة معتمدة"), t("Order fact", "بيانات الطلب")][index], value: [t("Items may be returned within 14 days of delivery", "يمكن إرجاع المنتجات خلال 14 يومًا من التسليم"), t("Return window: 14 days from delivery date", "مدة الإرجاع: 14 يومًا من تاريخ التسليم"), t("Delivered 6 days ago", "تم التسليم قبل 6 أيام")][index] }));
  const productPrinciples = [t("Human-approved rules", "قواعد يعتمدها التاجر"), t("Frozen evidence", "أدلة محفوظة"), t("Deterministic engine", "محرك قواعد حتمي"), t("Store-isolated data", "بيانات معزولة لكل متجر"), t("Required for the live pilot", "أساسي للتجربة الفعلية")];
  const examples = EXAMPLES.map((example) => isArabic ? ({ ...example, messages: [{ ...example.messages[0], text: `هل يمكنني إرجاع هذا المنتج؟ رقم طلبي ${example.facts.orderId}.` }, { ...example.messages[1], text: example.decision.outcome === "ELIGIBLE" ? "هذا المنتج مؤهل للإرجاع. تم استيفاء جميع شروط السياسة." : example.decision.outcome === "MANUAL_REVIEW" ? "لا يتوفر تاريخ التسليم، لذلك يحتاج المتجر إلى مراجعة الطلب." : "هذا المنتج خارج مدة الإرجاع المحددة في السياسة.", rule: example.decision.outcome === "MANUAL_REVIEW" ? "تاريخ التسليم غير متوفر · يلزم مراجعة التاجر" : "مدة الإرجاع 14 يومًا من تاريخ التسليم" }] }) : example);

  return (
    <div className="overflow-x-clip">
      {/* Hero — a moment of use */}
      <section id="whatsapp" className="hero-scene relative scroll-mt-24">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_1fr] md:gap-16 md:py-24 lg:py-28">
          <div className="flex flex-col items-start gap-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              {t("Return decisions for Saudi ecommerce", "قرارات إرجاع واضحة للتجارة الإلكترونية السعودية")}
            </span>
            <h1 className="font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[74px] text-balance">
              {t("Your policy.", "سياستك.")}
              <br />
              <span className="hero-gradient-text">{t("Their answer.", "إجابتهم.")}</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
              {t("Clear return answers, in a channel your customers already use. Mujeeb applies merchant-approved rules and keeps the evidence behind every decision.", "إجابات واضحة لطلبات الإرجاع عبر قناة يستخدمها عملاؤك بالفعل. يطبق مجيب القواعد التي يعتمدها التاجر ويحفظ الأدلة المرتبطة بكل قرار.")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/app")}
                className="group shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-px hover:shadow-primary/30"
              >
                {t("Open the workspace", "فتح مساحة العمل")}
                <ArrowRight className={cn("size-4 transition-transform group-hover:translate-x-1", isArabic && "rotate-180")} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/return")}
                className="bg-card/50 backdrop-blur transition-all duration-200 hover:-translate-y-px"
              >
                {t("Try a customer return", "تجربة طلب إرجاع")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary/70" />
                {t("Human-approved rules", "قواعد يعتمدها التاجر")}
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-4 text-primary/70" />
                {t("Evidence with every answer", "أدلة مع كل إجابة")}
              </span>
              <span className="flex items-center gap-1.5">
                <WhatsAppChannel />
              </span>
            </div>
          </div>
          <figure className="hero-stage relative isolate m-0 flex flex-col items-center py-4">
            <div aria-hidden="true" className="hero-phone-glow" />
            <PhoneFrame className="hero-phone">
              <WhatsAppThread messages={examples[0].messages} animated />
            </PhoneFrame>
            <figcaption className="mt-7 flex max-w-[320px] flex-col items-center gap-1.5 text-center">
              <span className="text-[11px] font-medium text-foreground/70">
                Order SA-10492 · Nova Store
              </span>
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                {WHATSAPP_STATUS === "coming-soon"
                  ? t("Live today on the web. Arriving on WhatsApp next.", "متاح اليوم على الويب، وقريبًا عبر واتساب.")
                  : t("A real decision, from published Policy v1.0.", "قرار فعلي استنادًا إلى السياسة المنشورة v1.0.")}
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        aria-label="Product principles"
        className="bg-muted/30 py-6"
      >
        <div className="principles-marquee">
          <div className="principles-track">
            {[false, true].map((duplicate) => (
              <div
                key={String(duplicate)}
                className="flex shrink-0 items-center gap-12 pr-12"
                aria-hidden={duplicate || undefined}
              >
                {productPrinciples.map((claim) => (
                  <div
                    key={claim}
                    className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground"
                  >
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    <span>{claim}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="product" className="scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary">
                {t("The problem", "المشكلة")}
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                {t("Policy text leaves customers and staff interpreting individual cases.", "نص السياسة وحده يترك العميل والموظف أمام تفسيرات مختلفة لكل حالة.")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                {t("A return policy is a document. Every return request is a decision. Without a clear connection between the two, customers guess, support staff improvise, and nobody can explain why a particular answer was given.", "سياسة الإرجاع وثيقة، أما كل طلب إرجاع فهو قرار. من دون رابط واضح بينهما، يحتار العملاء، ويجتهد موظفو الدعم، ويصعب تفسير سبب كل نتيجة.")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                {
                  label: t("Customer confusion", "حيرة العميل"),
                  desc: t("Customers don't know if their return is valid until they ask.", "لا يعرف العميل إن كان طلبه مقبولًا إلا بعد التواصل مع المتجر."),
                },
                {
                  label: t("Staff improvisation", "اختلاف اجتهاد الموظفين"),
                  desc: t("Each agent interprets the policy independently.", "يفسر كل موظف السياسة بطريقته."),
                },
                {
                  label: t("No audit trail", "غياب سجل القرار"),
                  desc: t("Nobody can explain why a particular decision was made.", "لا يوجد سجل واضح يبين سبب اتخاذ القرار."),
                },
              ].map((item) => (
                <div key={item.label}>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ReturnsCostCalculator />

      <PolicyTransformation />

      <OutcomeSequence>
        {examples.map(({ facts, decision, messages }) => (
          <article
            key={facts.orderId}
            aria-label={`${OUTCOME_LABELS[decision.outcome]} example`}
            className="outcome-card-body"
          >
            <PhoneFrame scale="compact">
              <WhatsAppThread messages={messages} />
            </PhoneFrame>
            <div className="outcome-card-label">
              <OutcomeBadge outcome={decision.outcome} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {facts.customerName} · {facts.orderId}
              </p>
            </div>
          </article>
        ))}
      </OutcomeSequence>

      {/* Merchant experience */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("Return cases", "طلبات الإرجاع")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("3 total", "3 إجمالًا")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        order: "SA-10492",
                        name: "Sara Ahmed",
                        item: "White Everyday Sneakers",
                        outcome: "ELIGIBLE" as const,
                      },
                      {
                        order: "SA-10567",
                        name: "Noura Salem",
                        item: "Olive Cotton Hoodie",
                        outcome: "MANUAL_REVIEW" as const,
                      },
                      {
                        order: "SA-10331",
                        name: "Khalid Othman",
                        item: "White Everyday Sneakers",
                        outcome: "NOT_ELIGIBLE" as const,
                      },
                    ].map((c, index) => (
                      <CaseEntrance
                        key={c.order}
                        index={index}
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {c.order} · {c.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.item}
                          </div>
                        </div>
                        <OutcomeBadge outcome={c.outcome} size="sm" />
                      </CaseEntrance>
                    ))}
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-border bg-card p-6">
                  <div className="mb-5 flex justify-between text-xs text-muted-foreground">
                    <span>{t("Example decision evidence", "مثال على أدلة القرار")}</span>
                    <span>{t("Policy v1.0", "السياسة v1.0")}</span>
                  </div>
                  <AnimatedDecisionTrace
                    steps={heroSteps}
                    outcome="ELIGIBLE"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <span className="text-sm font-semibold text-primary">
                  {t("Merchant experience", "تجربة التاجر")}
                </span>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                  {t("A real queue, with evidence behind every row.", "قائمة عمل واضحة، وأدلة وراء كل حالة.")}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                  {t("Cases that need attention surface first. Open any case to see the exact rules, order facts, and policy version that produced the decision.", "تظهر الحالات التي تحتاج إلى تدخل أولًا. افتح أي حالة للاطلاع على القواعد وبيانات الطلب وإصدار السياسة الذي نتج عنه القرار.")}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  {[
                    t("Color-coded by outcome — eligible, review, or not eligible", "ألوان واضحة للنتائج: مؤهل، مراجعة، أو غير مؤهل"),
                    t("Click any case to see the full decision trace", "افتح أي حالة لمراجعة مسار القرار كاملًا"),
                    t("Add notes and update operational status", "أضف ملاحظات وحدّث حالة المعالجة"),
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-4 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Path split — For merchants / For customers */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold text-primary">
                {t("Two sides of every return", "جانبان لكل طلب إرجاع")}
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                {t("One platform. Two clear paths.", "منصة واحدة، ومساران واضحان.")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                {t("Merchants get a decision workspace with evidence behind every case. Customers get a clear answer in seconds.", "يحصل التاجر على مساحة عمل مدعومة بالأدلة، ويحصل العميل على إجابة واضحة خلال ثوانٍ.")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {/* Merchant path */}
              <button
                onClick={() => navigate("/app")}
                className="group flex flex-col gap-4 p-6 text-left transition-all duration-200 hover:-translate-y-0.5 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                    <ShieldCheck className="size-5" />
                  </div>
                    <ArrowRight className={cn("size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1", isArabic && "rotate-180")} />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">
                    {t("For merchants", "للتجار")}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-foreground">
                    {t("A decision workspace with evidence", "مساحة قرارات مدعومة بالأدلة")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("Approve policy rules, review cases that need attention, and trace every decision back to the exact rule and order facts that produced it.", "اعتمد قواعد السياسة، وراجع الحالات التي تحتاج إلى تدخل، وتتبع كل قرار إلى القاعدة وبيانات الطلب التي أنتجته.")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    t("Policy approval", "اعتماد السياسة"),
                    t("Case queue", "قائمة الحالات"),
                    t("Decision trace", "مسار القرار"),
                    t("Frozen evidence", "أدلة محفوظة"),
                  ].map((tag, i) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {i > 0 && (
                        <span className="text-muted-foreground/40">·</span>
                      )}
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              {/* Customer path */}
              <button
                onClick={() => navigate("/return")}
                className="group flex flex-col gap-4 p-6 text-left transition-all duration-200 hover:-translate-y-0.5 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                    <Package className="size-5" />
                  </div>
                    <ArrowRight className={cn("size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1", isArabic && "rotate-180")} />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">
                    {t("For customers", "للعملاء")}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-foreground">
                    {t("A clear answer in seconds", "إجابة واضحة خلال ثوانٍ")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("Verify your order, choose the item and reason, and get an explained eligibility decision instantly. No waiting, no guessing.", "تحقق من الطلب، واختر المنتج وسبب الإرجاع، واحصل فورًا على قرار واضح ومفسّر.")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    t("3-step flow", "3 خطوات"),
                    t("Instant answer", "إجابة فورية"),
                    t("Rule explanation", "شرح القاعدة"),
                    t("Request submission", "إرسال الطلب"),
                  ].map((tag, i) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {i > 0 && (
                        <span className="text-muted-foreground/40">·</span>
                      )}
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Confidence */}
      <section className="bg-muted/30 px-5 py-20 md:py-28">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-foreground shadow-sm sm:px-10 md:px-14 md:py-16">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary">
                {t("Confidence", "الثقة")}
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                {t("Every decision is frozen with its evidence.", "يُحفظ كل قرار مع أدلته.")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                {t("When a policy is published, the version and the relevant order facts are frozen with each evaluation. Editing a policy creates a new draft — old decisions keep their original evidence.", "عند نشر السياسة، يُحفظ إصدارها وبيانات الطلب ذات الصلة مع كل تقييم. يؤدي تعديل السياسة إلى إنشاء مسودة جديدة، بينما تحتفظ القرارات السابقة بأدلتها الأصلية.")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: t("Frozen policy version", "إصدار سياسة محفوظ"),
                  desc: t("Each decision records which version of the policy was applied.", "يسجل كل قرار إصدار السياسة الذي تم تطبيقه."),
                },
                {
                  title: t("Relevant order facts", "بيانات الطلب ذات الصلة"),
                  desc: t("Delivery date, item, quantity, reason, and condition are preserved.", "يُحفظ تاريخ التسليم والمنتج والكمية والسبب والحالة."),
                },
                {
                  title: t("Evaluation time", "وقت التقييم"),
                  desc: t("Every decision is timestamped and reproducible.", "لكل قرار وقت محدد ويمكن إعادة إنتاجه."),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                {t("See a policy become an answer.", "شاهد السياسة تتحول إلى إجابة.")}
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
                {t("Explore the merchant workspace or try a customer return. Explore with sample orders — no setup required.", "استكشف مساحة عمل التاجر أو جرّب رحلة إرجاع العميل باستخدام طلبات تجريبية، دون إعداد مسبق.")}
              </p>
              <a
                href="#whatsapp"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <WhatsAppChannel />
                <span>
                  {WHATSAPP_STATUS === "coming-soon"
                    ? t("Preview the channel", "معاينة القناة")
                    : t("See the conversation", "عرض المحادثة")}
                </span>
                <ArrowRight className="size-4" />
              </a>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/app")}
                  className="group transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
                >
                  {t("Open the workspace", "فتح مساحة العمل")}
                  <ArrowRight className={cn("size-4 transition-transform group-hover:translate-x-1", isArabic && "rotate-180")} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/return")}
                >
                  {t("Try a customer return", "تجربة طلب إرجاع")}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

function CaseEntrance({ index, children }: { index: number; children: React.ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start 92%", "start 62%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: 0.3 });
  const x = useTransform(progress, [0, 1], [24 + index * 6, 0]);
  const opacity = useTransform(progress, [0, 1], [0.25, 1]);
  return <div ref={target} className="overflow-hidden rounded-lg"><motion.div data-case-entrance={index} style={reduceMotion ? undefined : { x, opacity }} className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-muted/40">{children}</motion.div></div>;
}
