import { Outlet, Link } from "react-router-dom";
import { MujeebLogo } from "@/components/mujeeb-logo";
import { PageTransition } from "@/components/page-transition";
import { services } from "@/lib/services";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { StoreIdentity } from "@/components/store-identity";

export function CustomerLayout() {
  const storeName = services.getStoreName();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[520px] items-center justify-between px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-foreground">
              <StoreIdentity name={storeName} markSize="sm" />
            </div>
            <div className="text-xs text-muted-foreground">{t("Returns", "المرتجعات")}</div>
          </div>
          <div className="flex items-center gap-2">
          <LanguageToggle compact />
          <Link to="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
            <span className="text-xs text-muted-foreground">{t("Powered by", "بدعم من")}</span>
            <MujeebLogo showText={false} />
            <span className="font-display text-sm font-semibold">{t("Mujeeb", "مجيب")}</span>
          </Link>
          </div>
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
            {t("Powered by Mujeeb · Return decisions, explained.", "بدعم من مجيب · قرارات إرجاع واضحة ومفسّرة.")}
          </p>
        </div>
      </footer>
    </div>
  );
}
