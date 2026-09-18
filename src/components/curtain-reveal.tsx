import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Workspace", href: "/app" },
  { label: "Start a return", href: "/return" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/#product" },
  { label: "Contact", href: "mailto:mujebteem@gmail.com" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function CurtainReveal({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["end end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.25,
  });
  return (
    <div className="curtain-stage">
      <div ref={contentRef} className="curtain-content">
        {children}
      </div>
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
  const taglineOpacity = useTransform(progress, [0.3, 0.55], [0, 1]);
  const taglineY = useTransform(progress, [0.3, 0.55], [18, 0]);
  const ctaOpacity = useTransform(progress, [0.4, 0.65], [0, 1]);
  const ctaY = useTransform(progress, [0.4, 0.65], [18, 0]);
  const linksOpacity = useTransform(progress, [0.5, 0.8], [0, 1]);
  const linksY = useTransform(progress, [0.5, 0.8], [20, 0]);
  const glowOpacity = useTransform(progress, [0.2, 0.8], [0, 1]);

  return (
    <footer className="footer-surface">
      <div className="footer-panel">
        <motion.div
          className="footer-glow"
          style={reduceMotion ? { opacity: 1 } : { opacity: glowOpacity }}
        />
        <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[1200px] flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16">
          <div className="px-2 py-4" aria-label="Mujeeb">
            <div aria-hidden="true" className="footer-wordmark flex justify-center gap-[0.025em] font-display text-[clamp(4.5rem,16vw,12rem)] font-semibold leading-[1] tracking-[-0.035em]">
              {wordmark.split("").map((letter, index) => (
                <FooterLetter
                  key={index}
                  letter={letter}
                  index={index}
                  progress={progress}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>

          <motion.p
            className="mt-4 text-sm tracking-wide text-footer-muted sm:text-base"
            style={
              reduceMotion
                ? undefined
                : { opacity: taglineOpacity, y: taglineY }
            }
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
              Open the workspace
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-10 w-full max-w-[1030px] text-left sm:mt-20"
            style={
              reduceMotion ? undefined : { opacity: linksOpacity, y: linksY }
            }
          >
            <nav
              aria-label="Footer product navigation"
              className="flex flex-wrap items-center justify-center gap-x-7 gap-y-1 text-center text-sm text-footer-fg sm:gap-8"
            >
              {FOOTER_LINKS.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </nav>

            <div className="mt-7 flex flex-col-reverse items-center justify-between gap-4 border-t border-footer-subtle pt-6 text-xs text-footer-muted sm:mt-8 sm:flex-row sm:gap-5">
              <span>© {new Date().getFullYear()} Mujeeb. All rights reserved.</span>
              <nav aria-label="Footer company navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <a
                  href="mailto:mujebteem@gmail.com"
                  className="footer-link"
                >
                  mujebteem@gmail.com
                </a>
                {COMPANY_LINKS.map((link) => (
                  <FooterLink key={link.label} {...link} />
                ))}
                {LEGAL_LINKS.map((link) => (
                  <FooterLink key={link.label} {...link} />
                ))}
              </nav>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className="footer-link">
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className="footer-link">
      {label}
    </Link>
  );
}

function FooterLetter({
  letter,
  index,
  progress,
  reduceMotion,
}: {
  letter: string;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
}) {
  // The curtain covers the wordmark until late in its travel. Keep the flip
  // in that visible interval instead of completing it behind the page.
  const start = 0.62 + index * 0.025;
  const end = start + 0.24;
  const y = useTransform(progress, [start, end], [22, 0]);
  const opacity = useTransform(progress, [start, end], [0.25, 1]);
  const rotateX = useTransform(progress, [start, end], [-75, 0]);
  return (
    <motion.span
      className="inline-block"
      style={reduceMotion ? undefined : { y, opacity, rotateX, transformPerspective: 700, transformOrigin: "50% 65%", backfaceVisibility: "hidden" }}
    >
      {letter}
    </motion.span>
  );
}
