import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useCallback, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const SIZE = 48;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SHOW_AFTER = 0.08;

export function ScrollToTop() {
  const reduceMotion = useReducedMotion();
  const { t, isArabic } = useLanguage();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const [visible, setVisible] = useState(false);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setVisible(value > SHOW_AFTER);
  });

  useMotionValueEvent(progress, "change", (value) => {
    setDashOffset(CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, value))));
  });

  const scrollTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollTop}
          aria-label={t("Scroll to top", "العودة للأعلى")}
          className={cn(
            "scroll-to-top",
            isArabic ? "scroll-to-top--start" : "scroll-to-top--end",
          )}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.72, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.8, y: 8 }
          }
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 28,
            mass: 0.7,
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        >
          <svg
            className="scroll-to-top-ring"
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
          >
            <circle
              className="scroll-to-top-track"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              className="scroll-to-top-progress"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </svg>
          <span className="scroll-to-top-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="scroll-top-arrow"
                  x1="12"
                  y1="4"
                  x2="12"
                  y2="20"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="var(--saffron)" />
                  <stop offset="100%" stopColor="#e85d04" />
                </linearGradient>
              </defs>
              <path
                d="M12 5v14M5.5 11.5 12 5l6.5 6.5"
                stroke="url(#scroll-top-arrow)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
