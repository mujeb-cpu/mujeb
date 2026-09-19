/** Gregorian Arabic locale with Western (Latin) digits — matches Salla/Zid UX. */
export const AR_FORMAT_LOCALE = "ar-SA-u-nu-latn-ca-gregory";
export const EN_FORMAT_LOCALE = "en-US";

const EASTERN_DIGIT = /[٠-٩]/g;
const PERSIAN_DIGIT = /[۰-۹]/g;

/** Map Arabic-Indic / Persian digits to ASCII 0–9. */
export function toLatinDigits(value: string): string {
  return value
    .replace(EASTERN_DIGIT, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(PERSIAN_DIGIT, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** Keep Western digits readable inside RTL Arabic copy (bidi + normalization). */
export function normalizeWesternNumerals(
  text: string,
  lang?: "en" | "ar" | null,
): string {
  const latin = toLatinDigits(text);
  const useArabicLayout =
    lang === "ar" ||
    (lang !== "en" &&
      typeof document !== "undefined" &&
      document.documentElement.lang === "ar");
  if (!useArabicLayout) return latin;
  return latin.replace(
    /(\d+(?:[.,٬،]\d+)*(?:%|٪)?)/g,
    (match) => `\u2066${match.replace(/٬|،/g, ",")}\u2069`,
  );
}

export function resolveFormatLocale(lang?: string | null): string {
  if (lang === "ar") return AR_FORMAT_LOCALE;
  if (lang === "en") return EN_FORMAT_LOCALE;
  if (typeof document !== "undefined" && document.documentElement.lang === "ar") {
    return AR_FORMAT_LOCALE;
  }
  return EN_FORMAT_LOCALE;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  lang?: string | null,
): string {
  return new Intl.NumberFormat(resolveFormatLocale(lang), options).format(value);
}

export function formatDateString(
  iso: string,
  options: Intl.DateTimeFormatOptions,
  lang?: string | null,
): string {
  const d = new Date(iso);
  return d.toLocaleDateString(resolveFormatLocale(lang), options);
}

export function formatDateTimeString(
  iso: string,
  options: Intl.DateTimeFormatOptions,
  lang?: string | null,
): string {
  const d = new Date(iso);
  return d.toLocaleString(resolveFormatLocale(lang), options);
}
