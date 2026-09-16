import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { formatDate, formatDateTime } from "@/lib/domain";
import { toast } from "sonner";
import { AlertCircle, Wifi, WifiOff, Clock, Zap, Check, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntegrationsPage() {
  const connections = useMemo(() => services.getConnections(), []);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [localConns, setLocalConns] = useState(connections);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; latencyMs: number; message: string } | null>>({});

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      await services.connectPlatform(platformId);
      setLocalConns(services.getConnections());
      toast.success("Connected (simulated)");
    } catch {
      toast.error("Could not connect");
    }
    setConnecting(null);
  };

  const handleDisconnect = (platformId: string) => {
    services.disconnectPlatform(platformId);
    setLocalConns(services.getConnections());
    toast.success("Disconnected");
  };

  const handleTest = (platformId: string) => {
    setTesting(platformId);
    setTimeout(() => {
      const result = services.testConnection(platformId);
      setTestResult({ ...testResult, [platformId]: result });
      setTesting(null);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connect your commerce platform to sync orders.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Platforms</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{localConns.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Connected</div>
            <div className="mt-1 text-xl font-semibold text-eligible">{localConns.filter((conn) => conn.state === "connected").length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Order sync</div>
            <div className="mt-1 text-xl font-semibold text-foreground">Simulated</div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {localConns.map((conn) => {
            const isConnected = conn.state === "connected";
            const isConnecting = connecting === conn.platformId;
            const isTesting = testing === conn.platformId;
            const result = testResult[conn.platformId];

            return (
              <Card key={conn.platformId} className={cn(!conn.available && "opacity-70")}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        isConnected ? "bg-eligible-muted text-eligible" : "bg-muted text-muted-foreground",
                      )}>
                        {isConnected ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{conn.platformName}</CardTitle>
                        <CardDescription className="text-xs">
                          {conn.available ? "Commerce platform" : "Coming later"}
                        </CardDescription>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge className="bg-eligible-muted text-eligible border-eligible/20">Connected</Badge>
                    ) : conn.available ? (
                      <Badge variant="outline">Disconnected</Badge>
                    ) : (
                      <Badge variant="outline"><Clock className="size-3" /> Soon</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {isConnected && (
                      <>
                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Connected</span>
                            <span className="font-medium text-foreground">{conn.connectedAt ? formatDate(conn.connectedAt) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last sync</span>
                            <span className="font-medium text-foreground">{conn.lastSyncAt ? formatDateTime(conn.lastSyncAt) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Store</span>
                            <span className="font-medium text-foreground">{conn.storeName ?? "—"}</span>
                          </div>
                          {conn.isSimulated && (
                            <div className="mt-1 flex items-center gap-1 text-muted-foreground/70">
                              <Activity className="size-3" />
                              Simulated connection
                            </div>
                          )}
                        </div>
                        {result && (
                          <div className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                            result.ok ? "border-eligible/20 bg-eligible-muted text-eligible" : "border-not-eligible/20 bg-not-eligible-muted text-not-eligible",
                          )}>
                            {result.ok ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                            {result.message}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleTest(conn.platformId)} disabled={isTesting}>
                            {isTesting ? <Spinner className="mr-1" /> : <Zap className="size-3.5" />}
                            {isTesting ? "Testing..." : "Test connection"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDisconnect(conn.platformId)} className="text-muted-foreground">
                            Disconnect
                          </Button>
                        </div>
                      </>
                    )}
                    {!conn.available && (
                      <div className="rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground">
                        This platform is not yet available. The adapter is ready — integration will be enabled once selected.
                      </div>
                    )}
                    {conn.available && !isConnected && (
                      <Button size="sm" onClick={() => handleConnect(conn.platformId)} disabled={isConnecting}>
                        {isConnecting && <Spinner className="mr-1" />}
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">About simulated connections</p>
              <p className="text-xs text-muted-foreground">
                The Salla connection is simulated for this demo. No real API calls are made. The adapter interface supports live OAuth integration when ready for production.
              </p>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
