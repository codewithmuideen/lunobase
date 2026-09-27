import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserLite = { id: string; email: string; full_name: string | null };

/** Attaches `user` (email + name) to rows that have a `user_id`. */
export async function withUsers<T extends { user_id: string }>(rows: T[]): Promise<(T & { user: UserLite | null })[]> {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (!ids.length) return rows.map((r) => ({ ...r, user: null }));
  const { data } = await createAdminClient().from("profiles").select("id, email, full_name").in("id", ids);
  const map = new Map(((data as UserLite[] | null) ?? []).map((u) => [u.id, u]));
  return rows.map((r) => ({ ...r, user: map.get(r.user_id) ?? null }));
}
