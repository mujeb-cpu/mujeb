import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OutcomeBadge, CaseStatusBadge } from "@/components/outcome-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { formatDate } from "@/lib/domain";
import {
  AlertCircle, ArrowRight, FileText, Plug, CheckCircle2, PackageOpen,
  TrendingUp, Zap, Plus, ShieldCheck, Clock, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OverviewPage() {
  const navigate = useNavigate();
  const cases = useMemo(() => services.getCases(), []);
  const policy = useMemo(() => services.getPublishedPolicy(), []);
  const connections = useMemo(() => services.getConnections(), []);
  const drafts = useMemo(() => services.getDrafts(), []);
  const storeName = services.getStoreName();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const manualReviewCases = cases.filter((c) => c.outcome === "MANUAL_REVIEW" && c.caseStatus === "OPEN");
  const openCases = cases.filter((c) => c.caseStatus === "OPEN");
  const resolvedCases = cases.filter((c) => c.caseStatus === "RESOLVED");
  const recentCases = [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const sallaConn = connections.find((c) => c.platformId === "salla");

  const eligibleCount = cases.filter((c) => c.outcome === "ELIGIBLE").length;
  const notEligibleCount = cases.filter((c) => c.outcome === "NOT_ELIGIBLE").length;
  const reviewCount = cases.filter((c) => c.outcome === "MANUAL_REVIEW").length;
  const totalCases = cases.length || 1;
  const eligiblePct = Math.round((eligibleCount / totalCases) * 100);

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Your returns, in focus.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{storeName} · Demo workspace</p>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 md:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-eligible opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-eligible" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">Live demo</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Quick actions */}
      <ScrollReveal delay={50}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction icon={FileText} label="Create policy" onClick={() => navigate("/app/policies/new")} />
          <QuickAction icon={ShieldCheck} label="Review drafts" badge={drafts.length || undefined} onClick={() => navigate("/app/policies")} />
          <QuickAction icon={Plug} label="Connect store" onClick={() => navigate("/app/integrations")} />
          <QuickAction icon={ExternalLink} label="Customer return" onClick={() => navigate("/return")} />
        </div>
      </ScrollReveal>

      {/* Needs attention banner */}
      {manualReviewCases.length > 0 && (
        <ScrollReveal delay={100}>
          <button
            onClick={() => navigate("/app/cases")}
            className="group flex w-full items-center justify-between rounded-xl border border-review/30 bg-review-muted p-5 text-left transition-all hover:border-review/50 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex size-10 items-center justify-center rounded-xl bg-review text-review-foreground">
                <AlertCircle className="size-5" />
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-review text-[10px] font-bold text-review-foreground">
                  {manualReviewCases.length}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {manualReviewCases.length} {manualReviewCases.length === 1 ? "case" : "cases"} need{manualReviewCases.length === 1 ? "s" : ""} a closer look
                </div>
                <div className="text-xs text-muted-foreground">Review missing information before deciding</div>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        </ScrollReveal>
      )}

      {/* KPI strip */}
      <ScrollReveal delay={150}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <AnimatedStat label="Open cases" value={openCases.length} icon={PackageOpen} color="text-primary" bg="bg-primary/10" loaded={loaded} />
          <AnimatedStat label="Needs review" value={manualReviewCases.length} icon={AlertCircle} color="text-review" bg="bg-review-muted" loaded={loaded} />
          <AnimatedStat label="Resolved" value={resolvedCases.length} icon={CheckCircle2} color="text-eligible" bg="bg-eligible-muted" loaded={loaded} />
          <AnimatedStat label="Eligibility rate" value={`${eligiblePct}%`} icon={TrendingUp} color="text-saffron" bg="bg-saffron-muted" loaded={loaded} />
        </div>
      </ScrollReveal>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ScrollReveal delay={200} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent activity</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/cases")} className="group">
              View all
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {recentCases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <CheckCircle2 className="size-8 text-eligible" />
                <p className="text-sm text-muted-foreground">Nothing needs your attention right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {recentCases.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/app/cases/${c.id}`)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md",
                    c.outcome === "ELIGIBLE" && "border-eligible/15 hover:border-eligible/30",
                    c.outcome === "NOT_ELIGIBLE" && "border-not-eligible/15 hover:border-not-eligible/30",
                    c.outcome === "MANUAL_REVIEW" && "border-review/15 hover:border-review/30",
                    !c.outcome && "border-border hover:border-primary/30",
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                      c.outcome === "ELIGIBLE" && "bg-eligible-muted text-eligible",
                      c.outcome === "NOT_ELIGIBLE" && "bg-not-eligible-muted text-not-eligible",
                      c.outcome === "MANUAL_REVIEW" && "bg-review-muted text-review",
                    )}>
                      <PackageOpen className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{c.orderId} · {c.customerName}</div>
                      <div className="text-xs text-muted-foreground">{c.itemName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <OutcomeBadge outcome={c.outcome} size="sm" />
                    <CaseStatusBadge status={c.caseStatus} size="sm" />
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={300} className="flex flex-col gap-4">
          {/* Outcome distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="size-4 text-muted-foreground" />
                Outcome distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <DistributionBar label="Eligible" count={eligibleCount} total={totalCases} color="bg-eligible" loaded={loaded} />
                <DistributionBar label="Manual review" count={reviewCount} total={totalCases} color="bg-review" loaded={loaded} />
                <DistributionBar label="Not eligible" count={notEligibleCount} total={totalCases} color="bg-not-eligible" loaded={loaded} />
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="text-muted-foreground">Total cases</span>
                  <span className="font-semibold text-foreground tabular-nums">{cases.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-muted-foreground" />
                Policy health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policy ? (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-eligible-muted text-eligible">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{policy.versionLabel}</div>
                      <div className="text-xs text-muted-foreground">Published {formatDate(policy.publishedAt)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="size-3 text-saffron" />
                    {policy.rules.length} active rules
                  </div>
                  {drafts.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-review">
                      <Clock className="size-3" />
                      {drafts.length} draft{drafts.length > 1 ? "s" : ""} pending review
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/app/policies")}>
                    View policies
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">No policy published yet.</p>
                  <Button size="sm" onClick={() => navigate("/app/policies/new")} className="w-full">
                    <Plus className="size-4" />
                    Create policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Plug className="size-4 text-muted-foreground" />
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sallaConn ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        sallaConn.state === "connected" ? "bg-eligible-muted text-eligible" : "bg-muted text-muted-foreground",
                      )}>
                        <Plug className="size-4" />
                      </div>
                      <div className="text-sm font-medium text-foreground">{sallaConn.platformName}</div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      sallaConn.state === "connected" ? "bg-eligible-muted text-eligible" : "bg-muted text-muted-foreground",
                    )}>
                      {sallaConn.state === "connected" ? "Connected" : sallaConn.state}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {sallaConn.isSimulated ? "Simulated connection" : "Live"}
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/app/integrations")}>
                    Manage
                  </Button>
                </div>
              ) : (
                <Skeleton className="h-16" />
              )}
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Icon className="size-4.5" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-review text-[10px] font-bold text-review-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function AnimatedStat({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loaded,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  loaded: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className={cn("absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl transition-opacity", bg, loaded ? "opacity-100" : "opacity-0")} />
      <div className="relative flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110", bg, color)}>
          <Icon className="size-4.5" />
        </div>
        <div>
          <div className={cn("text-2xl font-bold tabular-nums transition-all duration-700", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2", color)}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  color,
  loaded,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  loaded: boolean;
}) {
  const pct = Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: loaded ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}
