import { Manrope, Noto_Sans_Arabic, Sora } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
});

export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const fontClassNames = `${manrope.variable} ${sora.variable} ${notoSansArabic.variable}`;
