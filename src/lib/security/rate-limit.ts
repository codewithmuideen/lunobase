import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Database-backed fixed-window rate limiter (works across serverless instances).
 * Returns true when the action is allowed.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  } as never);
  if (error) {
    console.error("[rate-limit]", error.message);
    return true; // don't lock everyone out if the limiter itself fails
  }
  return data === true;
}
