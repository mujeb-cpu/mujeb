import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutcomeBadge, CaseStatusBadge } from "@/components/outcome-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { formatDateTime } from "@/lib/domain";
import { Search, ArrowRight, PackageOpen, AlertCircle, X, Calendar, Bookmark, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

interface SavedView {
  id: string;
  name: string;
  filters: { search: string; outcome: string; status: string; dateRange: string };
}

const DEFAULT_VIEWS: SavedView[] = [
  { id: "all", name: "All cases", filters: { search: "", outcome: "all", status: "all", dateRange: "all" } },
  { id: "review", name: "Needs review", filters: { search: "", outcome: "MANUAL_REVIEW", status: "OPEN", dateRange: "all" } },
  { id: "open", name: "Open", filters: { search: "", outcome: "all", status: "OPEN", dateRange: "all" } },
  { id: "resolved", name: "Resolved", filters: { search: "", outcome: "all", status: "RESOLVED", dateRange: "all" } },
];

export function CaseListPage() {
  const navigate = useNavigate();
  const { t, isArabic } = useLanguage();
  // Default view names are declared outside the component; translate them by id at render time.
  const defaultViewNames: Record<string, string> = {
    all: t("All cases", "كل الحالات"),
    review: t("Needs review", "تحتاج مراجعة"),
    open: t("Open", "مفتوحة"),
    resolved: t("Resolved", "مغلقة"),
  };
  const allCases = useMemo(() => services.getCases(), []);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [activeView, setActiveView] = useState<string>("all");
  const [customViews, setCustomViews] = useState<SavedView[]>([]);
  const [showSaveView, setShowSaveView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const allViews = [...DEFAULT_VIEWS, ...customViews];

  const applyView = (view: SavedView) => {
    setActiveView(view.id);
    setSearch(view.filters.search);
    setOutcomeFilter(view.filters.outcome);
    setStatusFilter(view.filters.status);
    setDateFilter(view.filters.dateRange);
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const view: SavedView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      filters: { search, outcome: outcomeFilter, status: statusFilter, dateRange: dateFilter },
    };
    setCustomViews([...customViews, view]);
    setActiveView(view.id);
    setNewViewName("");
    setShowSaveView(false);
  };

  const now = new Date("2026-09-16T10:00:00+03:00");

  const filtered = allCases.filter((c) => {
    const matchesSearch = !search ||
      c.orderId.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.itemName.toLowerCase().includes(search.toLowerCase());
    const matchesOutcome = outcomeFilter === "all" || c.outcome === outcomeFilter;
    const matchesStatus = statusFilter === "all" || c.caseStatus === statusFilter;
    let matchesDate = true;
    if (dateFilter !== "all") {
      const created = new Date(c.createdAt);
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (dateFilter === "today") matchesDate = diffDays === 0;
      else if (dateFilter === "week") matchesDate = diffDays <= 7;
      else if (dateFilter === "month") matchesDate = diffDays <= 30;
    }
    return matchesSearch && matchesOutcome && matchesStatus && matchesDate;
  });

  const hasFilters = search || outcomeFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{t("Return cases", "طلبات الإرجاع")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`${filtered.length} of ${allCases.length} cases`, `${filtered.length} من ${allCases.length} حالة`)}
            {hasFilters && t(" · filtered", " · مُصفّاة")}
          </p>
        </div>
      </ScrollReveal>

      {/* Saved views */}
      <ScrollReveal delay={50}>
        <div className="flex flex-wrap items-center gap-2">
          {allViews.map((view) => (
            <button
              key={view.id}
              onClick={() => applyView(view)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeView === view.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {view.id === "review" && <AlertCircle className="size-3" />}
              {view.id === "all" && <PackageOpen className="size-3" />}
              {view.id !== "review" && view.id !== "all" && <Bookmark className="size-3" />}
              {defaultViewNames[view.id] ?? view.name}
            </button>
          ))}
          {hasFilters && !showSaveView && (
            <button
              onClick={() => setShowSaveView(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <Plus className="size-3" />
              {t("Save view", "حفظ العرض")}
            </button>
          )}
          {showSaveView && (
            <div className="flex items-center gap-2">
              <Input
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder={t("View name...", "اسم العرض...")}
                className="h-8 w-32 text-xs"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveView} disabled={!newViewName.trim()}>
                <Check className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowSaveView(false); setNewViewName(""); }}>
                <X className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors focus-within:text-primary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search by order, customer, or item...", "ابحث برقم الطلب أو اسم العميل أو المنتج...")}
              className="ps-9"
            />
          </div>
          <Select value={outcomeFilter} onValueChange={(v) => { setOutcomeFilter(v); setActiveView("custom"); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("Outcome", "النتيجة")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All outcomes", "كل النتائج")}</SelectItem>
              <SelectItem value="ELIGIBLE">{t("Eligible", "مؤهل")}</SelectItem>
              <SelectItem value="NOT_ELIGIBLE">{t("Not eligible", "غير مؤهل")}</SelectItem>
              <SelectItem value="MANUAL_REVIEW">{t("Manual review", "مراجعة بشرية")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setActiveView("custom"); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("Status", "الحالة")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All statuses", "كل الحالات")}</SelectItem>
              <SelectItem value="OPEN">{t("Open", "مفتوحة")}</SelectItem>
              <SelectItem value="AWAITING_ITEM">{t("Awaiting item", "بانتظار استلام المنتج")}</SelectItem>
              <SelectItem value="RECEIVED">{t("Received", "تم الاستلام")}</SelectItem>
              <SelectItem value="RESOLVED">{t("Resolved", "مغلقة")}</SelectItem>
              <SelectItem value="CANCELLED">{t("Cancelled", "ملغاة")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setActiveView("custom"); }}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="size-3.5 me-1 text-muted-foreground" />
              <SelectValue placeholder={t("Date", "التاريخ")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All time", "كل الفترات")}</SelectItem>
              <SelectItem value="today">{t("Today", "اليوم")}</SelectItem>
              <SelectItem value="week">{t("Past 7 days", "آخر 7 أيام")}</SelectItem>
              <SelectItem value="month">{t("Past 30 days", "آخر 30 يومًا")}</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setSearch(""); setOutcomeFilter("all"); setStatusFilter("all"); setDateFilter("all"); setActiveView("all"); }}
              title={t("Clear filters", "مسح عوامل التصفية")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </ScrollReveal>

      {!loaded ? (
        <CaseListSkeleton />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <PackageOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("No cases match your filters.", "لا توجد حالات مطابقة لعوامل التصفية.")}</p>
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setOutcomeFilter("all"); setStatusFilter("all"); setDateFilter("all"); setActiveView("all"); }}>
              {t("Clear filters", "مسح عوامل التصفية")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Case / Order", "الحالة / الطلب")}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Customer", "العميل")}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Item", "المنتج")}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Outcome", "النتيجة")}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Status", "الحالة")}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("Created", "تاريخ الإنشاء")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/cases/${c.id}`)}
                    className={cn(
                      "group cursor-pointer border-b border-border transition-colors hover:bg-muted/30 last:border-0",
                      c.outcome === "MANUAL_REVIEW" && c.caseStatus === "OPEN" && "bg-review-muted/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.outcome === "MANUAL_REVIEW" && c.caseStatus === "OPEN" && (
                          <AlertCircle className="size-3.5 text-review" />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{c.orderId}</div>
                          <div className="text-xs text-muted-foreground">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{c.customerName}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{c.itemName}</div>
                      <div className="text-xs text-muted-foreground">{t(`Qty: ${c.quantity}`, `الكمية: ${c.quantity}`)}</div>
                    </td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={c.outcome} size="sm" /></td>
                    <td className="px-4 py-3"><CaseStatusBadge status={c.caseStatus} size="sm" /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3"><ArrowRight className={cn("size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100", isArabic && "rotate-180")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate(`/app/cases/${c.id}`)}
                className={cn(
                  "group rounded-xl border bg-card p-4 text-start transition-all hover:shadow-md",
                  c.outcome === "ELIGIBLE" && "border-eligible/15 hover:border-eligible/30",
                  c.outcome === "NOT_ELIGIBLE" && "border-not-eligible/15 hover:border-not-eligible/30",
                  c.outcome === "MANUAL_REVIEW" && "border-review/15 hover:border-review/30",
                )}
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.4s ease-out, transform 0.4s ease-out, border-color 0.2s, box-shadow 0.2s",
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.outcome === "MANUAL_REVIEW" && c.caseStatus === "OPEN" && (
                      <AlertCircle className="size-3.5 text-review" />
                    )}
                    <div className="text-sm font-medium text-foreground">{c.orderId}</div>
                  </div>
                  <ArrowRight className={cn("size-4 text-muted-foreground transition-transform group-hover:translate-x-1", isArabic && "rotate-180")} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{c.customerName} · {c.itemName}</div>
                <div className="mt-3 flex items-center gap-2">
                  <OutcomeBadge outcome={c.outcome} size="sm" />
                  <CaseStatusBadge status={c.caseStatus} size="sm" />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(c.createdAt)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CaseListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
