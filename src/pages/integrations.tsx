import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Clock, Link2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

interface SallaConnection {
  external_store_name: string | null;
  status: "CONNECTING" | "CONNECTED" | "EXPIRED" | "REVOKED" | "ERROR";
  connected_at: string | null;
  last_synced_at: string | null;
}

export function IntegrationsPage() {
  const { user, workspace } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connection, setConnection] = useState<SallaConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"connect" | "test" | "disconnect" | null>(null);

  const loadConnection = useCallback(async () => {
    if (!supabase || !workspace) return setLoading(false);
    const { data, error } = await supabase.from("commerce_connections")
      .select("external_store_name, status, connected_at, last_synced_at")
      .eq("store_id", workspace.storeId).eq("platform", "salla").maybeSingle();
    if (error) toast.error("Could not load the Salla connection.");
    setConnection(data as SallaConnection | null);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { void loadConnection(); }, [loadConnection]);
  useEffect(() => {
    const result = searchParams.get("salla");
    if (!result) return;
    if (result === "connected") toast.success("Salla store connected successfully.");
    else if (result === "cancelled") toast.info("Salla connection was cancelled.");
    else toast.error("Salla could not be connected. Please try again.");
    setSearchParams({}, { replace: true });
    void loadConnection();
  }, [loadConnection, searchParams, setSearchParams]);

  const connect = async () => {
    if (!supabase || !workspace || !user) return;
    setAction("connect");
    const { data, error } = await supabase.functions.invoke("salla-oauth-start", {
      body: { storeId: workspace.storeId, redirectPath: "/app/integrations" },
    });
    if (error || !data?.authorizationUrl) {
      toast.error("Could not start Salla authorization.");
      setAction(null);
      return;
    }
    window.location.assign(data.authorizationUrl);
  };

  const runAction = async (nextAction: "test" | "disconnect") => {
    if (!supabase || !workspace) return;
    setAction(nextAction);
    const { error } = await supabase.functions.invoke("salla-connection", {
      body: { storeId: workspace.storeId, action: nextAction },
    });
    if (error) toast.error(nextAction === "test" ? "Salla did not accept the stored connection." : "Could not disconnect Salla.");
    else toast.success(nextAction === "test" ? "Salla connection is healthy." : "Salla credentials removed from Mujeeb.");
    await loadConnection();
    setAction(null);
  };

  const connected = connection?.status === "CONNECTED";
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
      <ScrollReveal>
        <div>
          <Badge variant="outline" className="mb-3">Commerce</Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Store integrations</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Connect your Salla store so Mujeeb can verify orders against real merchant data.</p>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <Card className="overflow-hidden border-border/70 shadow-[0_22px_70px_-42px_hsl(var(--foreground)/0.28)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><span className="font-display text-lg font-bold">S</span></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">Salla</h2>
                    {loading ? <Badge variant="outline">Checking</Badge> : connected ? (
                      <Badge className="border-eligible/20 bg-eligible-muted text-eligible"><Check className="size-3" /> Connected</Badge>
                    ) : <Badge variant="outline">Not connected</Badge>}
                  </div>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                    {connected ? `${connection.external_store_name ?? "Your store"} is ready for order verification.` : "Authorize read-only order access through Salla. Mujeeb never receives your merchant password."}
                  </p>
                  {connected && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Connected {connection.connected_at ? new Date(connection.connected_at).toLocaleDateString() : "today"}</span>
                    <span>Last checked {connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : "not yet"}</span>
                  </div>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {connected ? <>
                  <Button variant="outline" onClick={() => void runAction("test")} disabled={action !== null}>{action === "test" ? <Spinner /> : <RefreshCw className="size-4" />} Check connection</Button>
                  <Button variant="ghost" className="text-muted-foreground" onClick={() => void runAction("disconnect")} disabled={action !== null}><Unplug className="size-4" /> Disconnect</Button>
                </> : <Button onClick={() => void connect()} disabled={loading || action !== null}>{action === "connect" ? <Spinner /> : <Link2 className="size-4" />} Connect Salla</Button>}
              </div>
            </div>
            <div className="grid border-t border-border/60 bg-muted/20 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-4 text-sm"><ShieldCheck className="size-4 text-primary" /><span>Encrypted credentials</span></div>
              <div className="flex items-center gap-3 border-y border-border/60 p-4 text-sm sm:border-x sm:border-y-0"><Link2 className="size-4 text-primary" /><span>Orders read only</span></div>
              <div className="flex items-center gap-3 p-4 text-sm"><Clock className="size-4 text-primary" /><span>Secure token renewal</span></div>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
