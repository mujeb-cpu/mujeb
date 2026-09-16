import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Merchant demo", href: "/app" },
  { label: "Customer return", href: "/return" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/" },
  { label: "Contact", href: "mailto:hello@mujeeb.sa" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/" },
  { label: "Terms", href: "/" },
];

export function CurtainReveal({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["end end", "end start"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.25 });
  const [revealStarted, setRevealStarted] = useState(false);
  const contentScale = useTransform(progress, [0, 1], [0.98, 1]);
  const contentY = useTransform(progress, [0, 1], [24, 0]);
  const contentOpacity = useTransform(progress, [0, 1], [0.45, 1]);

  useMotionValueEvent(progress, "change", (value) => {
    if (value <= 0) {
      setRevealStarted(false);
    } else if (!revealStarted) {
      setRevealStarted(true);
    }
  });

  return (
    <div className="curtain-stage">
      <motion.div
        ref={contentRef}
        className="curtain-content"
        style={reduceMotion || !revealStarted ? undefined : { scale: contentScale, y: contentY, opacity: contentOpacity }}
      >
        {children}
      </motion.div>
      <FooterPanel progress={progress} reduceMotion={reduceMotion} />
    </div>
  );
}

function FooterPanel({
  progress,
  reduceMotion,
}: {
  progress: ReturnType<typeof useSpring>;
  reduceMotion: boolean | null;
}) {
  const navigate = useNavigate();
  const wordmark = "Mujeeb";
  const taglineOpacity = useTransform(progress, [0.72, 0.86], [0, 1]);
  const taglineY = useTransform(progress, [0.72, 0.86], [18, 0]);
  const ctaOpacity = useTransform(progress, [0.78, 0.92], [0, 1]);
  const ctaY = useTransform(progress, [0.78, 0.92], [18, 0]);
  const linksOpacity = useTransform(progress, [0.86, 0.98], [0, 1]);
  const linksY = useTransform(progress, [0.86, 0.98], [20, 0]);
  const glowOpacity = useTransform(progress, [0.82, 1], [0, 1]);

  return (
    <footer className="footer-surface">
      <div className="footer-panel">
        <motion.div
          className="footer-glow"
          style={reduceMotion ? { opacity: 1 } : { opacity: glowOpacity }}
        />
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <div className="perspective-[700px] overflow-hidden">
            <div className="flex justify-center font-display text-[clamp(2.5rem,11vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.06em] text-footer-fg">
              {wordmark.split("").map((letter, index) => {
                const start = 0.38 + index * 0.032;
                const end = start + 0.14;
                const y = useTransform(progress, [start, end], [48, 0]);
                const opacity = useTransform(progress, [start, end], [0, 1]);
                const rotateX = useTransform(progress, [start, end], [-60, 0]);
                const scale = useTransform(progress, [start, end], [0.75, 1]);
                const blur = useTransform(progress, [start, end], ["blur(5px)", "blur(0px)"]);

                return (
                  <motion.span
                    key={`${letter}-${index}`}
                    className="inline-block will-change-transform"
                    style={reduceMotion ? undefined : {
                      y,
                      opacity,
                      rotateX,
                      scale,
                      filter: blur,
                    }}
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </div>
          </div>

          <motion.p
            className="mt-6 text-base italic text-footer-muted sm:text-lg"
            style={reduceMotion ? undefined : { opacity: taglineOpacity, y: taglineY }}
          >
            Return decisions, explained.
          </motion.p>

          <motion.div
            className="mt-8"
            style={reduceMotion ? undefined : { opacity: ctaOpacity, y: ctaY }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/app")}
              className="group bg-footer-gold text-footer-gold-foreground shadow-lg shadow-footer-gold/10 transition-all hover:-translate-y-0.5 hover:bg-footer-gold/90 hover:shadow-footer-gold/20"
            >
              Explore the merchant demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-20 w-full max-w-[1030px] text-left"
            style={reduceMotion ? undefined : { opacity: linksOpacity, y: linksY }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-footer-muted">
              {FOOTER_LINKS.map((link, index) => (
                <span key={link.label} className="flex items-center gap-3">
                  {index > 0 && <span className="text-footer-subtle">/</span>}
                  <FooterLink {...link} />
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-footer-subtle pt-5 text-xs text-footer-subtle sm:flex-row">
              <span>© 2026 Mujeeb</span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="mailto:hello@mujeeb.sa" className="transition-colors hover:text-footer-fg">
                  hello@mujeeb.sa
                </a>
                {COMPANY_LINKS.map((link) => <FooterLink key={link.label} {...link} />)}
                {LEGAL_LINKS.map((link) => <FooterLink key={link.label} {...link} />)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  if (href.startsWith("mailto:")) {
    return <a href={href} className="transition-colors hover:text-footer-fg">{label}</a>;
  }

  return (
    <Link to={href} className="transition-colors hover:text-footer-fg">
      {label}
    </Link>
  );
}
