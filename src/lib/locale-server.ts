export type Locale = "en" | "ar";

export const LOCALE_COOKIE = "mujeeb-language";

export function parseLocale(value: string | undefined | null): Locale | null {
  if (value === "ar" || value === "en") return value;
  return null;
}

/** Locale for the initial HTML shell (cookie, then Accept-Language). */
export function resolveRequestLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  const fromCookie = parseLocale(cookieValue);
  if (fromCookie) return fromCookie;

  const accept = acceptLanguage?.toLowerCase() ?? "";
  if (accept.includes("ar")) return "ar";

  return "en";
}
