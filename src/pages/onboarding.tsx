import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MujeebLogo } from "@/components/mujeeb-logo";
import { Spinner } from "@/components/ui/spinner";
import { services } from "@/lib/services";
import { toast } from "sonner";
import { Check, Store, Plug, FileText, ArrowRight, ArrowLeft, ShieldCheck, Package, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Store details", "Connect store", "Set up policy", "Test a return"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    await services.connectPlatform("salla");
    setConnecting(false);
    setConnected(true);
    toast.success("Salla connected (simulated)");
  };

  const handleFinish = () => {
    if (storeName) services.setStoreName(storeName);
    services.setOnboarded(true);
    toast.success("Workspace ready");
    navigate("/app");
  };

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-5 py-4">
          <MujeebLogo />
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[640px] px-5 py-12">
          <div className="mb-3">
            <div className="text-xs font-medium uppercase tracking-wider text-primary">Workspace setup</div>
            <p className="mt-1 text-sm text-muted-foreground">Get your first return decision ready in four steps.</p>
          </div>
          <div className="mb-8 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    i < step && "bg-eligible text-eligible-foreground",
                    i === step && "bg-primary text-primary-foreground",
                    i > step && "bg-muted text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <Card>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="size-5" />
                </div>
                <CardTitle className="font-display text-xl">Store details</CardTitle>
                <CardDescription>Tell us about your store to set up your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="store">Store name</Label>
                    <Input id="store" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nova Store" />
                  </div>
                  <Button onClick={() => setStep(1)} disabled={!storeName}>
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plug className="size-5" />
                </div>
                <CardTitle className="font-display text-xl">Connect your store</CardTitle>
                <CardDescription>Connect your commerce platform to sync orders.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">Salla</div>
                        <div className="text-xs text-muted-foreground">Simulated connection</div>
                      </div>
                      {connected ? (
                        <span className="rounded-full bg-eligible-muted px-2.5 py-0.5 text-xs font-medium text-eligible">Connected</span>
                      ) : (
                        <Button size="sm" onClick={handleConnect} disabled={connecting}>
                          {connecting && <Spinner className="mr-1" />}
                          {connecting ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">Zid</div>
                        <div className="text-xs text-muted-foreground">Coming later</div>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Soon</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button onClick={() => setStep(2)} disabled={!connected} className="flex-1">
                      Continue
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <CardTitle className="font-display text-xl">Set up your policy</CardTitle>
                <CardDescription>A sample policy is ready. Review and approve the first rule next.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                    We've prepared a sample returns policy based on common ecommerce practices. You can edit it or paste your own text in the policy workspace.
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-eligible-muted text-eligible">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Policy v1.0 is published</div>
                        <div className="text-xs text-muted-foreground">5 rules active · ready for returns</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/app/policies")} className="self-start">
                      Review policy rules
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1">
                      Continue
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-5" />
                </div>
                <CardTitle className="font-display text-xl">Test a return</CardTitle>
                <CardDescription>See how a customer experiences a return decision.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                    Try the customer return flow with demo order <span className="font-mono font-medium text-foreground">SA-10492</span> and email <span className="font-mono font-medium text-foreground">sara.ahmed@example.com</span>. You'll see the eligibility decision and the rules that produced it.
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => navigate("/return")} className="justify-start">
                      <Zap className="size-4 text-saffron" />
                      Open customer return flow
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/app/cases")} className="self-start">
                      Or view existing cases
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button onClick={handleFinish} className="flex-1">
                      Enter workspace
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
