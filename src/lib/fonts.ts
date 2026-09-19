import localFont from "next/font/local";
import { Manrope, Sora } from "next/font/google";

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

/** Arabic UI body copy — Thmanyah Sans (self-hosted). */
export const thmanyahSans = localFont({
  src: [
    {
      path: "../../public/fonts/thmanyah/sans/woff2/thmanyah-sans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/sans/woff2/thmanyah-sans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/sans/woff2/thmanyah-sans-Bold.woff2",
      weight: "600 700",
      style: "normal",
    },
  ],
  variable: "--font-thmanyah-sans",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

/** Arabic display headings — Thmanyah Serif Display (self-hosted). */
export const thmanyahSerifDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/thmanyah/serif-display/woff2/thmanyah-serif-display-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/serif-display/woff2/thmanyah-serif-display-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/serif-display/woff2/thmanyah-serif-display-Bold.woff2",
      weight: "600 700",
      style: "normal",
    },
  ],
  variable: "--font-thmanyah-display",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "serif"],
});

export const fontClassNames = `${manrope.variable} ${sora.variable} ${thmanyahSans.variable} ${thmanyahSerifDisplay.variable}`;
