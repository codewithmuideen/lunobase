import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Re-checks a user's password (step-up auth for withdrawals / password change)
 * without touching their current browser session.
 * Server-only: must never be exported from a "use server" file.
 */
export async function verifyPassword(email: string, password: string) {
  if (!password) return false;
  const probe = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  if (!error) await probe.auth.signOut();
  return !error;
}
