import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
    );
  }
  return browserClient;
}
