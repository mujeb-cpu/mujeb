import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const DEMO_ACCESS_KEY = "mujeeb-demo-access";

interface Workspace {
  storeId: string;
  storeName: string;
  role: "owner" | "admin" | "member";
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
  configured: boolean;
  demoMode: boolean;
  enterDemo: () => void;
  leaveDemo: () => void;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState(() =>
    !isSupabaseConfigured || sessionStorage.getItem(DEMO_ACCESS_KEY) === "true",
  );

  const loadWorkspace = async (userId: string) => {
    if (!supabase) return setWorkspace(null);
    const { data } = await supabase
      .from("memberships")
      .select("store_id, role, stores(name)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const relation = data?.stores as unknown as { name?: string } | null;
    setWorkspace(data ? {
      storeId: data.store_id as string,
      storeName: relation?.name ?? "My Store",
      role: data.role as Workspace["role"],
    } : null);
  };

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadWorkspace(data.session.user.id);
      if (active) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) setWorkspace(null);
      else setTimeout(() => { if (active) void loadWorkspace(nextSession.user.id); }, 0);
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    workspace,
    loading,
    configured: isSupabaseConfigured,
    demoMode,
    enterDemo: () => {
      sessionStorage.setItem(DEMO_ACCESS_KEY, "true");
      setDemoMode(true);
    },
    leaveDemo: () => {
      sessionStorage.removeItem(DEMO_ACCESS_KEY);
      setDemoMode(false);
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      sessionStorage.removeItem(DEMO_ACCESS_KEY);
      setDemoMode(false);
    },
    refreshWorkspace: async () => {
      if (session) await loadWorkspace(session.user.id);
    },
  }), [demoMode, loading, session, workspace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function RequireMerchantAccess() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <div className="flex min-h-svh items-center justify-center"><Spinner className="size-6 text-primary" /></div>;
  if (!auth.user && !auth.demoMode) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
