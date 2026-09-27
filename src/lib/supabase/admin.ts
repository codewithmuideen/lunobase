import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, serverEnv } from "@/lib/env";

// Untyped (no generated DB types yet); rows are cast to the types in lib/types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: SupabaseClient<any> | null = null;

/**
 * Service-role client. Bypasses RLS - only ever used on the server, after the caller's
 * identity (and admin role, where relevant) has been verified.
 */
export function createAdminClient() {
  if (!cached) {
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || serverEnv("SUPABASE_SECRET_KEY");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached = createClient<any>(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
