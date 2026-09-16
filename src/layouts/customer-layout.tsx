import { Outlet, Link } from "react-router-dom";
import { MujeebLogo } from "@/components/mujeeb-logo";
import { PageTransition } from "@/components/page-transition";
import { services } from "@/lib/services";

export function CustomerLayout() {
  const storeName = services.getStoreName();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[520px] items-center justify-between px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-foreground">{storeName}</div>
            <div className="text-xs text-muted-foreground">Returns</div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
            <span className="text-xs text-muted-foreground">Powered by</span>
            <MujeebLogo showText={false} />
            <span className="font-display text-sm font-semibold">Mujeeb</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[520px] px-5 py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[520px] px-5 py-4">
          <p className="text-center text-[11px] text-muted-foreground/70">
            Powered by Mujeeb · Return decisions, explained.
          </p>
        </div>
      </footer>
    </div>
  );
}
