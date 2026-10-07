import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { LNC, dayKey } from "@/lib/lunocoin";
import type { Profile } from "@/lib/types";

export type LncEntry = { id: string; kind: string; amount: string; memo: string | null; created_at: string };

/** A user's LNC balance. `ready` is false until migration 0004 has been run. */
export async function getLncBalance(userId: string): Promise<{ ready: boolean; balance: number }> {
  const { data, error } = await createAdminClient().from("lnc_balances").select("amount").eq("user_id", userId).maybeSingle();
  if (error) return { ready: false, balance: 0 };
  return { ready: true, balance: Number((data as { amount: string } | null)?.amount ?? 0) };
}

/**
 * Award LNC once per (user, kind, ref). Returns the amount actually added (0 if already given).
 * Never throws: a reward problem must not break a deposit, trade or sign-up.
 */
export async function awardLnc(userId: string, kind: string, amount: number, ref: string, memo: string): Promise<number> {
  if (!(amount > 0) && kind !== "admin") return 0;
  try {
    const { data, error } = await createAdminClient().rpc("lnc_award", {
      p_user: userId,
      p_kind: kind,
      p_amount: amount,
      p_ref: ref,
      p_memo: memo,
    } as never);
    if (error) return 0;
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Makes sure one-off milestone rewards are paid, including for accounts that reached
 * the milestone before LunoCoin launched. Safe to call often: each reward is paid once.
 */
export async function syncLncMilestones(profile: Profile) {
  const db = createAdminClient();
  const jobs: Promise<unknown>[] = [awardLnc(profile.id, "signup", LNC.rewards.signup, "once", "Welcome bonus for joining Lunobase")];
  if (profile.kyc_status === "verified") {
    jobs.push(awardLnc(profile.id, "kyc", LNC.rewards.kyc, "once", "Identity verification completed"));
  }
  const { data } = await db.from("deposits").select("id").eq("user_id", profile.id).eq("status", "approved").limit(1);
  if (data?.length) jobs.push(awardLnc(profile.id, "first_deposit", LNC.rewards.firstDeposit, "once", "First deposit approved"));
  await Promise.all(jobs);
}

/** Number of days in a row the user has checked in, counting today or yesterday as the latest. */
export async function getCheckinState(userId: string): Promise<{ streak: number; checkedInToday: boolean }> {
  const { data } = await createAdminClient()
    .from("lnc_ledger")
    .select("ref")
    .eq("user_id", userId)
    .eq("kind", "checkin")
    .order("created_at", { ascending: false })
    .limit(60);
  const days = new Set(((data as { ref: string }[] | null) ?? []).map((r) => r.ref));
  const today = dayKey();
  const checkedInToday = days.has(today);
  let streak = 0;
  const cursor = new Date();
  if (!checkedInToday) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { streak, checkedInToday };
}
