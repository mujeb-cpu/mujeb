import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { MujeebLogo } from "@/components/mujeeb-logo";
import { PageTransition } from "@/components/page-transition";
import { CurtainReveal } from "@/components/curtain-reveal";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
];

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="flex min-h-svh flex-col">
      <CurtainReveal>
        <header
          className={cn(
            "sticky z-50 mx-auto transition-all duration-300 ease-out",
            scrolled ? "top-3 w-[calc(100%-2rem)] max-w-[980px]" : "top-0 w-full",
          )}
          style={{
            transitionProperty: "transform, opacity, top, width, max-width, padding",
          }}
        >
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              scrolled
                ? "flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 shadow-lg backdrop-blur-xl"
                : "flex w-full items-center justify-between px-5",
            )}
            style={{
              transitionProperty: "max-width, height, padding, border-radius, background, backdrop-filter, box-shadow",
            }}
          >
            <div
              className={cn(
                "flex w-full items-center justify-between transition-all duration-300 ease-out",
                scrolled ? "h-12 max-w-[920px]" : "mx-auto h-16 max-w-[1200px]",
              )}
              style={{
                transitionProperty: "max-width, height",
              }}
            >
              <Link to="/" className="shrink-0 transition-transform duration-300">
                <MujeebLogo
                  className={cn("transition-all duration-300", scrolled ? "scale-90" : "scale-100")}
                />
              </Link>

              <nav className="hidden items-center gap-0.5 md:flex">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 md:flex">
                  <button
                    onClick={() => navigate("/auth")}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    Sign in
                  </button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/app")}
                    className="transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0"
                  >
                    Open demo
                  </Button>
                </div>
                <ModeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px]">
                    <SheetHeader>
                      <SheetTitle>
                        <MujeebLogo />
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-1 p-4">
                      {NAV_LINKS.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => navigate(link.href)}
                          >
                            {link.label}
                          </Button>
                        </SheetClose>
                      ))}
                      <div className="my-2 h-px bg-border" />
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start" onClick={() => navigate("/auth")}>
                          Sign in
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="justify-start" onClick={() => navigate("/app")}>
                          Open demo
                        </Button>
                      </SheetClose>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </CurtainReveal>
    </div>
  );
}
