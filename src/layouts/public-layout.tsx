"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { RelodLogo } from "@/components/relod-logo";

import { CurtainReveal } from "@/components/curtain-reveal";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppChannel } from "@/components/phone-frame";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/components/auth-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useSectionSpy } from "@/hooks/use-section-spy";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const { t } = useLanguage();
  const isHome = pathname === "/";
  const activeSection = useSectionSpy(
    isHome ? ["product", "how-it-works", "returns-financing"] : [],
  );
  const navLinks = [
    { id: "product", label: t("Product", "المنتج"), href: "/#product" },
    {
      id: "how-it-works",
      label: t("How it works", "كيف يعمل"),
      href: "/#how-it-works",
    },
    {
      id: "returns-financing",
      label: t("Returns financing", "تمويل المرتجعات"),
      href: "/#returns-financing",
    },
  ];
  const isNavActive = (sectionId: string) =>
    isHome && activeSection === sectionId;

  useEffect(() => {
    if (searchParams.get("auth") === "1") setAuthOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const returnUrl = searchParams.get("returnUrl");
    if (!auth.user || !returnUrl) return;
    if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) return;
    router.replace(returnUrl);
  }, [auth.user, router, searchParams]);

  const handleAuthOpenChange = (open: boolean) => {
    setAuthOpen(open);
    if (!open && searchParams.has("auth")) {
      router.replace(pathname);
    }
  };

  // Lock body scroll and allow Escape to close while the overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    let scrolledPast = window.scrollY > 40;
    setScrolled(scrolledPast);
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next === scrolledPast) return;
      scrolledPast = next;
      setScrolled(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) {
          el.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col">
      <header
        className={cn("public-header", scrolled && "public-header-scrolled")}
      >
        <div className="public-header-surface">
          <div className="public-header-inner">
            <Link href="/" className="rounded-lg p-1 shrink-0 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <RelodLogo
                className={cn(
                  "transition-all duration-300",
                  scrolled ? "scale-90" : "scale-100",
                )}
              />
            </Link>

            <nav aria-label="Primary navigation" className="public-nav hidden items-center gap-1 p-1 md:flex">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  aria-current={
                    isNavActive(link.id) ? "page" : undefined
                  }
                  data-active={isNavActive(link.id) || undefined}
                  className="public-nav-link rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground aria-[current=page]:text-foreground"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/#whatsapp"
                  className="nav-ghost hidden rounded-full px-3 py-2 lg:inline-flex"
                >
                  <WhatsAppChannel showStatus={false} />
                </Link>
                {auth.user ? (
                  <Button
                    size="sm"
                    onClick={() => router.push("/app")}
                    className="nav-cta rounded-full px-4"
                  >
                    {t("Workspace", "مساحة العمل")}
                  </Button>
                ) : (
                  <>
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="nav-ghost rounded-full px-3 py-2 text-sm font-medium"
                    >
                      {t("Sign in", "تسجيل الدخول")}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => setAuthOpen(true)}
                      className="nav-cta rounded-full px-4"
                    >
                      {t("Get started", "ابدأ الآن")}
                    </Button>
                  </>
                )}
              </div>
              <LanguageToggle compact className="size-8" />
              <ModeToggle className="size-8" />
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="nav-ghost menu-toggle grid size-8 place-items-center rounded-full md:hidden"
                data-open={menuOpen}
              >
                {/* Both icons stay mounted and cross-fade, so the swap eases
                    instead of popping. */}
                <Menu className="menu-toggle-icon menu-toggle-open size-5" />
                <X className="menu-toggle-icon menu-toggle-close size-5" />
                <span className="sr-only">
                  {menuOpen
                    ? t("Close menu", "إغلاق القائمة")
                    : t("Open menu", "فتح القائمة")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu: the modern mobile pattern — the page fades
          out, large tap targets fill the screen, no cramped side drawer. */}
      <div
        id="mobile-menu"
        className="mobile-menu md:hidden"
        data-open={menuOpen}
        aria-hidden={!menuOpen}
      >
        <nav className="flex flex-col px-6">
          {navLinks.map((link, i) => (
            <button
              key={link.href}
              onClick={() => {
                setMenuOpen(false);
                router.push(link.href);
              }}
              aria-current={isNavActive(link.id) ? "page" : undefined}
              style={{ ["--i" as string]: String(i) }}
              className={cn(
                "mobile-menu-item border-b border-border/70 py-4 text-start text-[17px] font-medium text-foreground",
                isNavActive(link.id) && "text-primary",
              )}
            >
              {link.label}
            </button>
          ))}
          <Link
            href="/#whatsapp"
            onClick={() => setMenuOpen(false)}
            style={{ ["--i" as string]: String(navLinks.length) }}
            className="mobile-menu-item flex items-center border-b border-border/70 py-4 text-[17px] font-medium text-foreground"
          >
            <WhatsAppChannel className="text-[17px] font-medium text-foreground" />
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-2 px-6 pb-10 pt-8">
          {auth.user ? (
            <Button
              style={{ ["--i" as string]: String(navLinks.length + 1) }}
              className="mobile-menu-item nav-cta h-11 w-full rounded-full"
              onClick={() => {
                setMenuOpen(false);
                router.push("/app");
              }}
            >
              {t("Workspace", "مساحة العمل")}
            </Button>
          ) : (
            <>
              <Button
                style={{ ["--i" as string]: String(navLinks.length + 1) }}
                className="mobile-menu-item nav-cta h-11 w-full rounded-full"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthOpen(true);
                }}
              >
                {t("Get started", "ابدأ الآن")}
              </Button>
              <button
                style={{ ["--i" as string]: String(navLinks.length + 2) }}
                className="mobile-menu-item h-11 w-full rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthOpen(true);
                }}
              >
                {t("Sign in", "تسجيل الدخول")}
              </button>
            </>
          )}
        </div>
      </div>

      <CurtainReveal>
        <main className="relative isolate min-h-svh bg-background pt-16">
          {children}
        </main>
      </CurtainReveal>
      <ScrollToTop />
      <AuthDialog open={authOpen} onOpenChange={handleAuthOpenChange} />
    </div>
  );
}
