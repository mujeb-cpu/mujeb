import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MujeebLogo } from "@/components/mujeeb-logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollReveal } from "@/components/scroll-reveal";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(mode === "signin" ? "Signed in to demo workspace" : "Demo account ready");
      navigate("/app");
    }, 800);
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Entered demo workspace");
      navigate("/app");
    }, 500);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[420px] flex-col justify-center px-5 py-12">
      <ScrollReveal>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <MujeebLogo />
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">{mode === "signin" ? "Welcome back" : "Start with Mujeeb"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your workspace" : "Create your workspace"}
          </p>
        </div>
      </div>
      </ScrollReveal>
      <ScrollReveal delay={100}>
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Enter your credentials to access your returns workspace."
              : "Set up your store to start managing return decisions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="storeName">Store name</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nova Store"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.sa"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading && <Spinner className="mr-1" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleDemo} disabled={loading}>
            <Sparkles className="size-4 text-primary" />
            Enter demo workspace
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-muted-foreground/70">
            <span>Demo mode</span>
            <span className="text-border">·</span>
            <span>No real credentials stored</span>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>
    </div>
  );
}
