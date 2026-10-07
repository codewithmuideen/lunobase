"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin, currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { requestMeta } from "@/lib/security/request";
import { awardLnc, getCheckinState, getLncBalance } from "@/lib/lnc";
import { LNC, SHARE_CHANNELS, dayKey, formatLnc, type ShareChannel } from "@/lib/lunocoin";
import type { ActionResult } from "@/lib/types";

const EXPIRED = { ok: false as const, error: "Your session has expired. Please sign in again." };
const NOT_READY = { ok: false as const, error: "LunoCoin rewards are being set up. Please try again shortly." };

const CHANNEL_LABEL: Record<ShareChannel, string> = { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", telegram: "Telegram" };

/** 20 LNC for sharing, once per channel per day. */
export async function claimShareAction(channel: string): Promise<ActionResult<{ earned: number }>> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  if (!SHARE_CHANNELS.includes(channel as ShareChannel)) return { ok: false, error: "Unknown share option." };
  if (ctx.profile.status !== "active") return { ok: false, error: "Your account can't earn rewards right now." };
  if (!(await rateLimit(`lnc-share:${ctx.profile.id}`, 12, 3600))) return { ok: false, error: "Slow down a little and try again later." };
  if (!(await getLncBalance(ctx.profile.id)).ready) return NOT_READY;

  const label = CHANNEL_LABEL[channel as ShareChannel];
  const earned = await awardLnc(ctx.profile.id, "share", LNC.rewards.share, `${channel}:${dayKey()}`, `Shared Lunobase on ${label}`);
  revalidatePath("/dashboard", "layout");
  if (!earned) return { ok: true, data: { earned: 0 }, message: `You already earned today's ${label} reward. Come back tomorrow.` };
  return { ok: true, data: { earned }, message: `+${earned} ${LNC.symbol} for sharing on ${label}` };
}

/** Daily check-in, with a bonus on every 7th day in a row. */
export async function checkInAction(): Promise<ActionResult<{ earned: number; streak: number }>> {
  const ctx = await currentUser();
  if (!ctx) return EXPIRED;
  if (ctx.profile.status !== "active") return { ok: false, error: "Your account can't earn rewards right now." };
  if (!(await rateLimit(`lnc-checkin:${ctx.profile.id}`, 10, 3600))) return { ok: false, error: "Please try again later." };
  if (!(await getLncBalance(ctx.profile.id)).ready) return NOT_READY;

  const today = dayKey();
  let earned = await awardLnc(ctx.profile.id, "checkin", LNC.rewards.checkin, today, "Daily check-in");
  if (!earned) return { ok: true, data: { earned: 0, streak: 0 }, message: "You already checked in today. Come back tomorrow." };

  const { streak } = await getCheckinState(ctx.profile.id);
  if (streak > 0 && streak % LNC.rewards.streakDays === 0) {
    earned += await awardLnc(ctx.profile.id, "streak", LNC.rewards.streakBonus, today, `${streak} day check-in streak bonus`);
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, data: { earned, streak }, message: `+${earned} ${LNC.symbol}. ${streak} day streak.` };
}

/** Public: email me LunoCoin news. */
export async function joinLncWaitlistAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  const { ip } = await requestMeta();
  if (!(await rateLimit(`lnc-waitlist:${ip}`, 5, 3600))) return { ok: false, error: "Too many attempts. Please try again later." };

  const { error } = await createAdminClient().from("lnc_waitlist").upsert({ email } as never, { onConflict: "email", ignoreDuplicates: true });
  if (error) return NOT_READY;
  return { ok: true, message: "You're on the list. We'll email you when there is LunoCoin news." };
}

/** Admin: add or remove LNC on a user's account (negative amount removes). */
export async function adminGrantLncAction(input: { email: string; amount: number; memo: string }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Admin access required." };
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const memo = input.memo?.trim().slice(0, 140);
  if (!Number.isFinite(amount) || amount === 0) return { ok: false, error: "Enter a non-zero amount (negative to remove)." };
  if (Math.abs(amount) > 1_000_000) return { ok: false, error: "That amount is too large." };
  if (!memo) return { ok: false, error: "Add a note for the audit log." };

  const db = createAdminClient();
  const { data: user } = await db.from("profiles").select("id, email").eq("email", input.email.trim().toLowerCase()).maybeSingle();
  if (!user) return { ok: false, error: "No user with that email." };
  const target = user as { id: string; email: string };

  const { data, error } = await db.rpc("lnc_award", { p_user: target.id, p_kind: "admin", p_amount: amount, p_ref: crypto.randomUUID(), p_memo: memo } as never);
  if (error) return NOT_READY;
  if (!Number(data)) return { ok: false, error: "Nothing was changed." };
  await db.from("audit_log").insert({ admin_id: admin.profile.id, action: "lnc.adjust", target_user: target.id, details: { amount, memo } } as never);
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `${amount > 0 ? "Added" : "Removed"} ${formatLnc(Math.abs(amount))} ${LNC.symbol} ${amount > 0 ? "to" : "from"} ${target.email}.` };
}
