import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";
const STORAGE_KEY = "mujeeb-language";

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
    return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
  });
  const [isSwitching, setIsSwitching] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((current) => {
      if (current === next) return current;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      localStorage.setItem(STORAGE_KEY, next);

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
