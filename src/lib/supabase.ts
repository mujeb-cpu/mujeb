export { isSupabaseConfigured } from "@/lib/supabase/env";
export { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Browser Supabase client; null when env is unset or during SSR. */
export const supabase = getSupabaseBrowserClient();
