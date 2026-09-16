import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedDecisionTrace, type TraceStep } from "@/components/decision-trace";
import { OutcomeBadge } from "@/components/outcome-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { FileText, Check, Package, ArrowRight, ShieldCheck, Lock, ArrowDown } from "lucide-react";

const HERO_STEPS: TraceStep[] = [
  { id: "clause", label: "Policy clause", value: "Items may be returned within 14 days of delivery", icon: FileText },
  { id: "rule", label: "Approved rule", value: "Return window: 14 days from delivery date", icon: Check },
  { id: "fact", label: "Order fact", value: "Delivered 6 days ago", icon: Package },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 md:py-32">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                AI-assisted return decisions for Saudi ecommerce
              </div>
              <h1 className="font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl md:text-[72px] text-balance">
                Your policy.
                <br />
                <span className="text-primary">A clear answer.</span>
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
                Turn approved return rules into clear answers for customers — and a decision trail your team can inspect.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate("/app")} className="group transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0">
                  Explore the merchant demo
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/return")}>
                  Try a customer return
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  Human-approved
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-4" />
                  Frozen evidence
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-4" />
                  Instant answers
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Live decision trace</span>
                  <span className="text-xs font-medium text-muted-foreground">Policy v1.0</span>
                </div>
                <AnimatedDecisionTrace steps={HERO_STEPS} outcome="ELIGIBLE" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Path split — For merchants / For customers */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold text-primary">Two sides of every return</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                One platform. Two clear paths.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                Merchants get a decision workspace with evidence behind every case. Customers get a clear answer in seconds.
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
                  <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">For merchants</div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-foreground">A decision workspace with evidence</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Approve policy rules, review cases that need attention, and trace every decision back to the exact rule and order facts that produced it.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {["Policy approval", "Case queue", "Decision trace", "Frozen evidence"].map((tag, i) => (
                    <span key={tag} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      {i > 0 && <span className="text-muted-foreground/40">·</span>}
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
                  <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">For customers</div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-foreground">A clear answer in seconds</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Verify your order, choose the item and reason, and get an explained eligibility decision instantly. No waiting, no guessing.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {["3-step flow", "Instant answer", "Rule explanation", "Request submission"].map((tag, i) => (
                    <span key={tag} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      {i > 0 && <span className="text-muted-foreground/40">·</span>}
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem */}
      <section id="product" className="scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary">The problem</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                Policy text leaves customers and staff interpreting individual cases.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                A return policy is a document. Every return request is a decision. Without a clear connection between the two, customers guess, support staff improvise, and nobody can explain why a particular answer was given.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                { label: "Customer confusion", desc: "Customers don't know if their return is valid until they ask." },
                { label: "Staff improvisation", desc: "Each agent interprets the policy independently." },
                { label: "No audit trail", desc: "Nobody can explain why a particular decision was made." },
              ].map((item) => (
                <div key={item.label}>
                  <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Transformation — editorial flow */}
      <section id="how-it-works" className="bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-32">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold text-primary">The transformation</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                Every rule connects to the sentence that produced it.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                AI reads the policy and proposes rules. A merchant reviews and approves each one. When a customer requests a return, the approved rules make the decision — not the AI.
              </p>
            </div>
          </ScrollReveal>

          {/* Vertical flow diagram */}
          <ScrollReveal delay={150}>
            <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-0">
              {/* Step 1: Policy clause */}
              <FlowStep
                num="01"
                label="Source clause"
                content={
                  <p className="text-base leading-relaxed text-foreground">
                    "Customers may return eligible items within 14 days of delivery. The return window starts from the confirmed delivery date."
                  </p>
                }
              />

              <FlowConnector />

              {/* Step 2: AI extraction */}
              <FlowStep
                num="02"
                label="AI extraction"
                content={
                  <div className="flex flex-col gap-2">
                    <p className="text-base font-medium text-foreground">Proposed rule</p>
                    <p className="text-sm text-muted-foreground">Return window: 14 days from delivery date</p>
                  </div>
                }
              />

              <FlowConnector />

              {/* Step 3: Merchant approval gate */}
              <FlowStep
                num="03"
                label="Merchant approval"
                content={
                  <div>
                    <p className="text-base font-medium text-foreground">Approved by merchant</p>
                    <p className="text-sm text-muted-foreground">Published as Policy v1.0</p>
                  </div>
                }
              />

              <FlowConnector />

              {/* Step 4: Decision */}
              <FlowStep
                num="04"
                label="Customer decision"
                content={
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-medium text-foreground">Order SA-10492 · 6 days ago</p>
                      <p className="text-sm text-muted-foreground">Rule applied: 14-day window</p>
                    </div>
                    <OutcomeBadge outcome="ELIGIBLE" size="sm" />
                  </div>
                }
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mx-auto mt-10 flex max-w-2xl items-center gap-3 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Human checkpoint:</span> AI proposes rules. A merchant approves and publishes. The published rules — not the AI — make every decision.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Customer experience — 3-step interactive */}
      <section>
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-primary">Customer experience</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                Verify, choose, get a clear answer.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                Customers verify their order, select the item and reason, and receive an explained decision in seconds. No guessing, no waiting for a support reply.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                {[
                  { num: "1", label: "Verify", desc: "Customer enters order number and email" },
                  { num: "2", label: "Details", desc: "Select item, quantity, reason, and condition" },
                  { num: "3", label: "Answer", desc: "Get an explained eligibility decision instantly" },
                ].map((step) => (
                  <div key={step.num} className="group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold transition-transform duration-200 group-hover:scale-110">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">✓</span>
                      Verified
                    </span>
                    <ArrowRight className="size-3" />
                    <span className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">✓</span>
                      Details
                    </span>
                    <ArrowRight className="size-3" />
                    <span className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
                      Answer
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Order SA-10492</div>
                      <div className="text-sm font-medium text-foreground">White Everyday Sneakers</div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Decision</div>
                        <div className="text-sm font-semibold text-foreground">Eligible for return</div>
                      </div>
                      <OutcomeBadge outcome="ELIGIBLE" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Merchant experience */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Return cases</span>
                    <span className="text-xs text-muted-foreground">3 total</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { order: "SA-10492", name: "Sara Ahmed", item: "White Everyday Sneakers", outcome: "ELIGIBLE" as const },
                      { order: "SA-10567", name: "Noura Salem", item: "Olive Cotton Hoodie", outcome: "MANUAL_REVIEW" as const },
                      { order: "SA-10331", name: "Khalid Othman", item: "White Everyday Sneakers", outcome: "NOT_ELIGIBLE" as const },
                    ].map((c) => (
                      <div
                        key={c.order}
                        className="group flex items-center justify-between rounded-lg p-3 transition-all duration-200 hover:bg-muted/40 cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.order} · {c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.item}</div>
                        </div>
                        <OutcomeBadge outcome={c.outcome} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <span className="text-sm font-semibold text-primary">Merchant experience</span>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-[40px] md:leading-[1.1] text-balance">
                  A real queue, with evidence behind every row.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
                  Cases that need attention surface first. Open any case to see the exact rules, order facts, and policy version that produced the decision.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  {[
                    "Color-coded by outcome — eligible, review, or not eligible",
                    "Click any case to see the full decision trace",
                    "Add notes and update operational status",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
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

      {/* Confidence — dark feature section */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="relative mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-background/60">Confidence</span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-background md:text-[40px] md:leading-[1.1] text-balance">
                Every decision is frozen with its evidence.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-background/70 text-pretty">
                When a policy is published, the version and the relevant order facts are frozen with each evaluation. Editing a policy creates a new draft — old decisions keep their original evidence.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                { title: "Frozen policy version", desc: "Each decision records which version of the policy was applied." },
                { title: "Relevant order facts", desc: "Delivery date, item, quantity, reason, and condition are preserved." },
                { title: "Evaluation time", desc: "Every decision is timestamped and reproducible." },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-base font-semibold text-background">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-background/70">{item.desc}</p>
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
                See it work.
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
                Explore the merchant workspace or try a customer return. Everything runs on seeded demo data.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={() => navigate("/app")} className="group transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0">
                  Explore the merchant demo
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/return")}>
                  Try a customer return
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

function FlowStep({
  num,
  label,
  content,
}: {
  num: string;
  label: string;
  content: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <span className="font-mono text-sm font-bold text-primary">{num}</span>
      </div>
      <div className="flex-1">
        <div className="mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        {content}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="h-6 w-px bg-border" />
        <ArrowDown className="size-3 text-muted-foreground" />
      </div>
    </div>
  );
}
