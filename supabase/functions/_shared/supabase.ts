import { createClient } from "npm:@supabase/supabase-js@2";
import { env } from "./http.ts";

export function adminClient() {
  const secret = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("Missing Supabase server key");
  return createClient(env("SUPABASE_URL"), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(authorization: string) {
  const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!key) throw new Error("Missing Supabase publishable key");
  return createClient(env("SUPABASE_URL"), key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
