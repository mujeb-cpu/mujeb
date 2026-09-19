"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const lineContainer: Variants = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: {
      delayChildren: delay,
      staggerChildren: 0.055,
    },
  }),
};

const wordReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.58,
      ease: EASE,
    },
  },
};

const lineReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(12px)",
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay,
      duration: 0.65,
      ease: EASE,
    },
  }),
};

function splitWords(text: string) {
  return text.trim().split(/(\s+)/).filter(Boolean);
}

function RevealedLine({
  text,
  className,
  delay,
  wordByWord,
}: {
  text: string;
  className?: string;
  delay: number;
  wordByWord: boolean;
}) {
  if (!wordByWord) {
    return (
      <motion.span
        className={cn("hero-tagline-line block will-change-[opacity,transform,filter]", className)}
        variants={lineReveal}
        custom={delay}
        initial="hidden"
        animate="visible"
      >
        {text}
      </motion.span>
    );
  }

  const parts = splitWords(text);

  return (
    <motion.span
      className="hero-tagline-line block"
      variants={lineContainer}
      custom={delay}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {parts.map((part, index) =>
        /^\s+$/.test(part) ? (
          <span key={`s-${index}`}>{part}</span>
        ) : (
          <motion.span
            key={`${part}-${index}`}
            className={cn(
              "hero-tagline-word will-change-[opacity,transform,filter]",
              className,
            )}
            variants={wordReveal}
          >
            {part}
          </motion.span>
        ),
      )}
    </motion.span>
  );
}

export function HeroTagline({
  line1,
  line2,
  body,
  isArabic,
  onComplete,
}: {
  line1: string;
  line2: string;
  body: string;
  isArabic: boolean;
  onComplete?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Word split is English-only — Arabic shaping must stay on whole lines.
  const wordByWord = !isArabic && !reduceMotion;
  const line2Delay = reduceMotion ? 0 : wordByWord ? 0.28 : 0.2;
  const bodyDelay = reduceMotion ? 0 : wordByWord ? 0.58 : 0.48;

  useEffect(() => {
    if (reduceMotion) {
      onCompleteRef.current?.();
      return;
    }
    const ms = Math.round((bodyDelay + 0.6) * 1000);
    const id = window.setTimeout(() => onCompleteRef.current?.(), ms);
    return () => window.clearTimeout(id);
  }, [line1, line2, body, isArabic, reduceMotion, bodyDelay]);

  if (reduceMotion) {
    return (
      <div className="flex flex-col items-start gap-7">
        <h1 className="font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground text-balance sm:text-6xl lg:text-[74px]">
          <span className="block">{line1}</span>
          <span className="hero-gradient-text block">{line2}</span>
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
          {body}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-7">
      <h1 className="font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground text-balance sm:text-6xl lg:text-[74px]">
        <RevealedLine text={line1} delay={0.05} wordByWord={wordByWord} />
        <RevealedLine
          text={line2}
          className="hero-gradient-text"
          delay={line2Delay}
          wordByWord={wordByWord}
        />
      </h1>

      <motion.p
        className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty will-change-[opacity,transform,filter]"
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: bodyDelay, duration: 0.55, ease: EASE }}
      >
        {body}
      </motion.p>
    </div>
  );
}
