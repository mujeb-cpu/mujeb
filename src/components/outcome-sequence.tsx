import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppChannel } from "./phone-frame";
import { useLanguage } from "@/components/language-provider";

/**
 * Three outcome phones arranged as a live CSS 3D fan.
 *
 * Previously a 120-frame pre-rendered JPEG scrubber (~36MB). Live DOM instead:
 * themes apply instantly, nothing to regenerate when the phones change, and the
 * depth is tunable here rather than inside a Playwright build script.
 */
export function OutcomeSequence({ children }: { children: ReactNode }) {
  const { t, isArabic } = useLanguage();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.35);
  const reducedMotion = useReducedMotion();

  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const cards = [...element.querySelectorAll<HTMLElement>('.outcome-sequence-card')];
      const height = Math.max(1, ...cards.map(card => card.offsetHeight));
      // Fit all three devices, leaving room for the label that floats below each
      // one (absolutely positioned, so it is not part of offsetHeight).
      const needed = height * 1.07 + 76;
      // Allow slight upscaling on roomy viewports so the group fills the stage.
      setFit(Math.min(1.16, element.clientWidth / 1020, element.clientHeight / needed));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.querySelectorAll('.outcome-sequence-card').forEach(card => observer.observe(card));
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = section.current;
    const viewport = stage.current;
    if (!element || !viewport) return;
    const cards = [...viewport.querySelectorAll<HTMLElement>(".outcome-sequence-card")];
    const heading = element.querySelector<HTMLElement>(".outcome-sequence-heading");
    let frame = 0;
    const update = () => {
      frame = 0;
      const pin = element.querySelector<HTMLElement>(".outcome-sequence-pin");
      const distance = Math.max(1, element.offsetHeight - (pin?.clientHeight ?? window.innerHeight));
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, -element.getBoundingClientRect().top / distance));
      const p = progress * progress * (3 - 2 * progress);
      const fan = 1 - Math.pow(1 - p, 4);
      cards.forEach((card, i) => {
        const slot = [0, -1, 1][i] ?? 0;
        const lift = slot === 0 ? -18 - 10 * p : -18 + 4 * p;
        const depth = slot === 0 ? 54 * p : -30 * p;
        const scale = 0.96 + ((slot === 0 ? 1.07 : 0.9) - 0.96) * p;
        card.style.transform = `translate(-50%, -50%) translateX(${slot * 360 * fan * fit}px) translateY(${lift * fit}px) translateZ(${depth * fit}px) rotateY(${slot * -7 * p + (1 - p) * -14}deg) rotateZ(${slot * 1.25 * p}deg) scale(${scale * fit})`;
        card.style.opacity = String(slot === 0 ? 1 : 0.78 + 0.22 * p);
        card.style.setProperty("--label-opacity", String(Math.max(0, Math.min(1, (fan - 0.45) / 0.35))));
      });
      const reveal = reducedMotion ? 1 : Math.max(0, Math.min(1, (progress - 0.6) / 0.28));
      if (heading) {
        heading.style.opacity = String(reveal);
        heading.style.transform = `translateY(${(1 - reveal) * 14}px)`;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion, fit]);

  const items = Children.toArray(children);

  return (
    <>
      <section
        id="outcomes"
        ref={section}
        aria-label={t("Three return outcomes", "نتائج الإرجاع الثلاث")}
        className="outcome-sequence"
        data-static={reducedMotion ? "true" : "false"}
      >
        <div className="outcome-sequence-pin">
          <div className="outcome-sequence-glow" aria-hidden="true" />
          <div className="outcome-sequence-eyebrow">
            <WhatsAppChannel className="text-muted-foreground" />
          </div>

          <div ref={stage} className="outcome-sequence-stage">
            {items.map((child, i) => {
              const slot = [0, -1, 1][i] ?? 0;
              return (
                <div
                  key={i}
                  className="outcome-sequence-card"
                  data-position={slot === 0 ? "center" : "side"}
                  style={{
                    zIndex: slot === 0 ? 4 : 2,

                  }}
                >
                  {child}
                </div>
              );
            })}
          </div>

          <div
            className="outcome-sequence-heading"

          >
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("Every answer has its evidence.", "لكل إجابة أدلتها.")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("A clear yes. An explained no. A human when it matters.", "موافقة واضحة، ورفض مفسّر، وتدخل بشري عند الحاجة.")}
              <br />
              {t("Three outcomes, grounded in the same published policy.", "ثلاث نتائج تستند إلى السياسة المنشورة نفسها.")}
            </p>
          </div>

          {!reducedMotion && (
            <span className="outcome-sequence-hint">
              {t("Scroll to explore · scroll back to replay", "مرّر للاستكشاف · ارجع لإعادة العرض")}
            </span>
          )}
        </div>
      </section>
      <div className="relative z-10 mx-auto max-w-[1200px] bg-background px-5 py-8">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="outcome-transcripts"
          className="mx-auto flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-300",
              expanded && (isArabic ? "-rotate-90" : "rotate-90"),
            )}
          />
          {t("Read the three example conversations", "قراءة المحادثات الثلاث")}
        </button>
        <div
          id="outcome-transcripts"
          className="outcome-transcripts"
          data-expanded={expanded}
        >
          <div className="overflow-hidden">
            <div
              className="mt-10 grid gap-10 lg:grid-cols-3"
              data-outcome-source
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
