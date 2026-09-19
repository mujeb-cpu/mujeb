import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MujeebMark } from "@/components/mujeeb-logo";
import { PageTransition } from "@/components/page-transition";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  PackageOpen,
  Plug,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { services } from "@/lib/services";
import { useAuth } from "@/components/auth-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";

export function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { t } = useLanguage();
  const primaryNav = [
    { label: t("Overview", "نظرة عامة"), href: "/app", icon: LayoutDashboard, end: true },
    { label: t("Policies", "السياسات"), href: "/app/policies", icon: FileText },
    { label: t("Return cases", "طلبات الإرجاع"), href: "/app/cases", icon: PackageOpen },
  ];
  const secondaryNav = [
    { label: t("Integrations", "التكاملات"), href: "/app/integrations", icon: Plug },
    { label: t("Settings", "الإعدادات"), href: "/app/settings", icon: Settings },
  ];
  const storeName = auth.workspace?.storeName ?? services.getStoreName();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/auth", { replace: true });
  };

  const isActive = (href: string, end?: boolean) =>
    end ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-2 px-2 py-1 transition-opacity hover:opacity-80"
          >
            <MujeebMark className="size-7 text-primary" />
            <span className="font-display text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Mujeeb
            </span>
          </button>
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">
                {t("Merchant workspace", "مساحة عمل التاجر")}
              </div>
              <div className="text-sm font-medium text-foreground">{storeName}</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("Workspace", "مساحة العمل")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href, item.end)}
                      onClick={() => navigate(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t("Configure", "الإعداد")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      onClick={() => navigate(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate("/")} tooltip={t("View public site", "عرض الموقع العام")}>
                <ExternalLink className="size-4" />
                <span>{t("View public site", "عرض الموقع العام")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => void handleSignOut()} tooltip={t("Sign out", "تسجيل الخروج")}>
                <LogOut className="size-4" />
                <span>{t("Sign out", "تسجيل الخروج")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Breadcrumb pathname={location.pathname} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1280px] p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const { t } = useLanguage();
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    app: t("Overview", "نظرة عامة"),
    policies: t("Policies", "السياسات"),
    new: t("New policy", "سياسة جديدة"),
    review: t("Review", "المراجعة"),
    cases: t("Return cases", "طلبات الإرجاع"),
    integrations: t("Integrations", "التكاملات"),
    settings: t("Settings", "الإعدادات"),
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = labels[seg] ?? seg;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-border">/</span>}
            <span className={cn(isLast ? "font-medium text-foreground" : "")}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
