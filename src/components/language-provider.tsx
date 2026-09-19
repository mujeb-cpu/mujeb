"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/locale-server";
import { persistLocale, readStoredLocale } from "@/lib/locale-client";

export type { Locale };

/**
 * Switching locale changes every string AND mirrors the whole layout. Applied
 * synchronously that lands in a single frame and reads as a glitch, so the swap
 * is staged: fade the page out, change locale while it is invisible, then fade
 * back in. These must match the durations in `.locale-fade` (index.css).
 */
/** Must match `--locale-fade-out` in index.css (fade-in length is CSS-only). */
const FADE_OUT_MS = 220;

interface LanguageContextValue {
  locale: Locale;
  isArabic: boolean;
  /** True while the page is mid-swap; used to drive the fade. */
  isSwitching: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (english: string, arabic: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isSwitching, setIsSwitching] = useState(false);
  const timers = useRef<number[]>([]);
  const hydrated = useRef(false);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  // After hydration, align with localStorage (and sync cookie) without a fade.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readStoredLocale();
    const next = stored ?? initialLocale;
    persistLocale(next);
    if (next !== initialLocale) {
      setLocaleState(next);
    }
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((current) => {
      if (current === next) return current;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      persistLocale(next);

      if (reduceMotion) return next;

      timers.current.forEach(window.clearTimeout);
      timers.current = [];

      setIsSwitching(true);
      timers.current.push(
        window.setTimeout(() => {
          setLocaleState(next);
          // Swap dir/strings while still at opacity 0, then fade in for full duration.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsSwitching(false));
          });
        }, FADE_OUT_MS),
      );
      return current;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    document.documentElement.dataset.localeReady = "true";
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    if (isSwitching) {
      root.dataset.localeSwitching = "true";
      return;
    }
    delete root.dataset.localeSwitching;
  }, [isSwitching]);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    isArabic: locale === "ar",
    isSwitching,
    setLocale,
    toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    t: (english, arabic) => locale === "ar" ? arabic : english,
  }), [locale, isSwitching, setLocale]);

  return (
    <LanguageContext.Provider value={value}>
      <div className="locale-fade">{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
