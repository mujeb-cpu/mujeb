import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { formatDate } from "@/lib/domain";
import { Plus, FileText, CheckCircle2, Clock, ChevronDown, ArrowRight, ShieldCheck, History, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export function PolicyListPage() {
  const navigate = useNavigate();
  const policy = useMemo(() => services.getPublishedPolicy(), []);
  const versions = useMemo(() => services.getPublishedVersions(), []);
  const drafts = useMemo(() => services.getDrafts(), []);
  const [showDrafts, setShowDrafts] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const totalRules = policy?.rules.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Policies</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your return policy versions and drafts.</p>
          </div>
          <Button onClick={() => navigate("/app/policies/new")} className="group">
            <Plus className="size-4 transition-transform group-hover:rotate-90" />
            New policy
          </Button>
        </div>
      </ScrollReveal>

      {/* Draft-to-published timeline */}
      <ScrollReveal delay={50}>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-review-muted text-review">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Draft</div>
              <div className="text-[11px] text-muted-foreground">{drafts.length} pending</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <GitBranch className="size-3 text-muted-foreground" />
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-saffron-muted text-saffron">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Review</div>
              <div className="text-[11px] text-muted-foreground">Approve rules</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight className="size-3 text-muted-foreground" />
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-eligible-muted text-eligible">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Published</div>
              <div className="text-[11px] text-muted-foreground">{versions.length} version{versions.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {!loaded ? (
        <PolicyListSkeleton />
      ) : (
        <>
          {policy && (
            <ScrollReveal delay={100}>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-eligible" />
                  <h2 className="text-sm font-semibold text-foreground">Current version</h2>
                </div>
                <Card className="group transition-all hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-eligible-muted text-eligible transition-transform group-hover:scale-110">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-foreground">{policy.versionLabel}</span>
                          <Badge variant="secondary" className="text-[11px]">Active</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Published {formatDate(policy.publishedAt)} · {totalRules} rules · by {policy.publishedBy}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/app/policies/new")} className="group/btn">
                      New version
                      <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>
          )}

          {/* Version history */}
          {versions.length > 1 && (
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardContent className="flex items-center justify-between py-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <History className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Version history</span>
                      <Badge variant="outline" className="text-[10px]">{versions.length}</Badge>
                    </div>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showHistory && "rotate-180")} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border px-6 py-4">
                    <div className="flex flex-col gap-3">
                      {[...versions].reverse().map((v, i) => (
                        <div key={v.id} className="flex items-center gap-3">
                          <div className={cn(
                            "flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
                            i === 0 ? "bg-eligible text-eligible-foreground" : "bg-muted text-muted-foreground",
                          )}>
                            {i === 0 ? <CheckCircle2 className="size-3.5" /> : versions.length - i}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{v.versionLabel}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(v.publishedAt)} · {v.rules.length} rules · by {v.publishedBy}
                            </div>
                          </div>
                          {i === 0 && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {drafts.length > 0 && (
            <ScrollReveal delay={200}>
              <div>
                <button
                  onClick={() => setShowDrafts(!showDrafts)}
                  className="group mb-3 flex items-center gap-2"
                >
                  <Clock className="size-4 text-review" />
                  <h2 className="text-sm font-semibold text-foreground">Drafts</h2>
                  <Badge variant="outline" className="text-[11px]">{drafts.length}</Badge>
                  <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", !showDrafts && "-rotate-90")} />
                </button>
                {showDrafts && (
                  <div className="flex flex-col gap-2">
                    {drafts.map((draft, i) => (
                      <Card
                        key={draft.id}
                        className="group transition-all hover:shadow-md"
                        style={{
                          opacity: loaded ? 1 : 0,
                          transform: loaded ? "translateY(0)" : "translateY(8px)",
                          transition: "opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.2s",
                          transitionDelay: `${i * 60}ms`,
                        }}
                      >
                        <CardContent className="flex items-center justify-between p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-review-muted text-review transition-transform group-hover:scale-110">
                              <FileText className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-foreground">{draft.name}</span>
                                <Badge variant="outline" className="text-[11px]">Draft</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {draft.rules.length} rules · Updated {formatDate(draft.updatedAt)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/policies/review/${draft.id}`)}
                            className="group/btn"
                          >
                            Review
                            <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          {!policy && drafts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="size-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No policies yet</p>
                  <p className="text-xs text-muted-foreground">Create your first return policy to get started.</p>
                </div>
                <Button onClick={() => navigate("/app/policies/new")} className="group">
                  <Plus className="size-4 transition-transform group-hover:rotate-90" />
                  Create policy
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function PolicyListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
