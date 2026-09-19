import type { Locale } from "@/lib/locale-server";
import { LOCALE_COOKIE } from "@/lib/locale-server";

const STORAGE_KEY = LOCALE_COOKIE;

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ar" || saved === "en") return saved;
  return null;
}

export function persistLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function readClientLocaleFallback(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}
