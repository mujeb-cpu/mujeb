import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { DEMO_CREDENTIALS } from "@/lib/fixtures";
import { Search, AlertCircle, Sparkles, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReturnVerifyPage() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const order = services.verifyOrder(orderNumber, email);
      setLoading(false);
      if (order) {
        sessionStorage.setItem("mujeeb-verified-order", JSON.stringify(order));
        navigate("/return/details");
      } else {
        setError("We couldn't verify this order. Please check your order number and email and try again.");
      }
    }, 600);
  };

  const fillDemo = () => {
    setOrderNumber(DEMO_CREDENTIALS.orderNumber);
    setEmail(DEMO_CREDENTIALS.email);
  };

  return (
    <div className="flex flex-col gap-5">
      <ProgressIndicator currentStep={1} />

      <ScrollReveal>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Start a return</h1>
          <p className="text-sm text-muted-foreground">Verify your order to check return eligibility.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Card className="animate-scale-in">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="orderNumber">Order number</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="SA-10492"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email or mobile</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={loading || !orderNumber || !email} className="mt-2 group">
                {loading ? <Spinner className="mr-1" /> : <Search className="size-4" />}
                Verify order
              </Button>
            </form>
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="size-3 text-primary" />
          Demo helper
          {showDemo ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </ScrollReveal>

      {showDemo && (
        <Card className="border-dashed bg-muted/20 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">Use these demo credentials to try the flow:</p>
              <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs">
                <div>Order: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.orderNumber}</span></div>
                <div>Email: <span className="font-medium text-foreground">{DEMO_CREDENTIALS.email}</span></div>
              </div>
              <Button variant="outline" size="sm" onClick={fillDemo}>Fill demo credentials</Button>
              <p className="text-[11px] text-muted-foreground/70">These are synthetic fixtures, not real customer data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Verify", "Details", "Answer"];
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              isDone && "bg-eligible text-eligible-foreground",
              isCurrent && "bg-primary text-primary-foreground",
              !isDone && !isCurrent && "bg-muted text-muted-foreground",
            )}>
              {isDone ? <Check className="size-3" /> : stepNum}
            </span>
            <span className={cn(isCurrent ? "font-medium text-foreground" : "")}>{label}</span>
            {i < steps.length - 1 && <span className="text-border">/</span>}
          </div>
        );
      })}
    </div>
  );
}
