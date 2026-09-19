"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Locale } from "@/lib/locale-server";
import { ViewTransitionGuard } from "@/components/view-transition-guard";

export function Providers({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <ThemeProvider>
        <AuthProvider>
          <ViewTransitionGuard />
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
