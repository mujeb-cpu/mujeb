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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { services } from "@/lib/services";

const PRIMARY_NAV = [
  { label: "Overview", href: "/app", icon: LayoutDashboard, end: true },
  { label: "Policies", href: "/app/policies", icon: FileText },
  { label: "Return cases", href: "/app/cases", icon: PackageOpen },
];

const SECONDARY_NAV = [
  { label: "Integrations", href: "/app/integrations", icon: Plug },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const storeName = services.getStoreName();

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
              <div className="text-xs text-muted-foreground">Demo workspace</div>
              <div className="text-sm font-medium text-foreground">{storeName}</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {PRIMARY_NAV.map((item) => (
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
            <SidebarGroupLabel>Configure</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SECONDARY_NAV.map((item) => (
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
              <SidebarMenuButton onClick={() => navigate("/")} tooltip="View public site">
                <ExternalLink className="size-4" />
                <span>View public site</span>
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
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    app: "Overview",
    policies: "Policies",
    new: "New policy",
    review: "Review",
    cases: "Return cases",
    integrations: "Integrations",
    settings: "Settings",
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
