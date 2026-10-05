"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { currentAdmin, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEPOSITABLE } from "@/lib/assets";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { friendlyError } from "@/lib/errors";
import { formatAmount } from "@/lib/utils";
import type { AccountStatus, ActionResult, Deposit, Withdrawal } from "@/lib/types";

const DENIED = { ok: false as const, error: "Admin access required." };

async function audit(adminId: string, action: string, targetUser: string | null, details: Record<string, unknown>) {
  await createAdminClient().from("audit_log").insert({ admin_id: adminId, action, target_user: targetUser, details } as never);
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------- deposits
export async function approveDepositAction(input: { id: string; amount?: number; note?: string }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  const amount = input.amount && Number(input.amount) > 0 ? Number(input.amount) : null;

  const { data, error } = await createAdminClient().rpc("approve_deposit", {
    p_deposit: input.id,
    p_admin: admin.profile.id,
    p_amount: amount,
    p_note: input.note?.trim() || null,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  const dep = data as Deposit;
  const user = await getProfile(dep.user_id);
  if (user) {
    after(() => sendEmail(
      user.email,
      templates.depositApproved({
        name: user.full_name,
        amount: formatAmount(dep.credited ?? dep.amount),
        asset: dep.asset,
        antiPhishing: user.anti_phishing_code,
      }),
    ));
  }
  refresh();
  return { ok: true, message: `Credited ${formatAmount(dep.credited ?? dep.amount)} ${dep.asset}.` };
}

export async function rejectDepositAction(input: { id: string; note: string }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  const note = input.note?.trim();
  if (!note) return { ok: false, error: "Add a reason the user will see." };

  const { data, error } = await createAdminClient().rpc("reject_deposit", {
    p_deposit: input.id,
    p_admin: admin.profile.id,
    p_note: note,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  const dep = data as Deposit;
  const user = await getProfile(dep.user_id);
  if (user) {
    after(() => sendEmail(
      user.email,
      templates.depositRejected({
        name: user.full_name,
        amount: formatAmount(dep.amount),
        asset: dep.asset,
        note,
        antiPhishing: user.anti_phishing_code,
      }),
    ));
  }
  refresh();
  return { ok: true, message: "Deposit rejected." };
}

// ------------------------------------------------------------- withdrawals
export async function reviewWithdrawalAction(input: {
  id: string;
  approve: boolean;
  txHash?: string;
  note?: string;
}): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  if (!input.approve && !input.note?.trim()) return { ok: false, error: "Add a reason the user will see." };

  const { data, error } = await createAdminClient().rpc("review_withdrawal", {
    p_withdrawal: input.id,
    p_admin: admin.profile.id,
    p_approve: !!input.approve,
    p_tx_hash: input.txHash?.trim() || null,
    p_note: input.note?.trim() || null,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  const wd = data as Withdrawal;
  const user = await getProfile(wd.user_id);
  if (user) {
    after(() => sendEmail(
      user.email,
      templates.withdrawalUpdate({
        name: user.full_name,
        amount: formatAmount(wd.amount),
        asset: wd.asset,
        approved: !!input.approve,
        txHash: wd.tx_hash,
        note: wd.admin_note,
        antiPhishing: user.anti_phishing_code,
      }),
    ));
  }
  refresh();
  return { ok: true, message: input.approve ? "Withdrawal marked as completed." : "Withdrawal rejected and funds returned." };
}

// ------------------------------------------------------------------- users
export async function adjustBalanceAction(input: { userId: string; asset: string; delta: number; memo: string }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  const asset = String(input.asset).toUpperCase();
  const delta = Number(input.delta);
  if (!DEPOSITABLE.includes(asset)) return { ok: false, error: "Unsupported asset." };
  if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: "Enter a non-zero amount (negative to debit)." };
  if (!input.memo?.trim()) return { ok: false, error: "Add a memo for the audit log." };

  const { error } = await createAdminClient().rpc("admin_adjust_balance", {
    p_admin: admin.profile.id,
    p_user: input.userId,
    p_asset: asset,
    p_delta: delta,
    p_memo: input.memo.trim(),
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };
  refresh();
  return { ok: true, message: `${delta > 0 ? "Credited" : "Debited"} ${formatAmount(Math.abs(delta))} ${asset}.` };
}

export async function updateUserControlsAction(input: {
  userId: string;
  status: AccountStatus;
  role: "user" | "admin";
  kyc_status: "unverified" | "pending" | "verified" | "rejected";
  withdrawal_unlock_at: string;
  withdrawals_enabled: boolean;
}): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  if (input.userId === admin.profile.id && (input.role !== "admin" || input.status !== "active")) {
    return { ok: false, error: "You can't demote or lock your own admin account." };
  }
  if (!["active", "frozen", "suspended"].includes(input.status)) return { ok: false, error: "Invalid status." };
  if (!["user", "admin"].includes(input.role)) return { ok: false, error: "Invalid role." };
  const unlock = new Date(input.withdrawal_unlock_at);
  if (Number.isNaN(unlock.getTime())) return { ok: false, error: "Invalid unlock date." };

  const before = await getProfile(input.userId);
  if (!before) return { ok: false, error: "User not found." };

  const patch = {
    status: input.status,
    role: input.role,
    kyc_status: input.kyc_status,
    withdrawal_unlock_at: unlock.toISOString(),
    withdrawals_enabled: !!input.withdrawals_enabled,
  };
  const { error } = await createAdminClient().from("profiles").update(patch as never).eq("id", input.userId);
  if (error) return { ok: false, error: "Could not update user." };

  await audit(admin.profile.id, "user.update", input.userId, {
    before: {
      status: before.status,
      role: before.role,
      kyc_status: before.kyc_status,
      withdrawal_unlock_at: before.withdrawal_unlock_at,
      withdrawals_enabled: before.withdrawals_enabled,
    },
    after: patch,
  });

  if (before.status !== input.status) {
    await sendEmail(
      before.email,
      templates.accountStatus({ name: before.full_name, status: input.status, antiPhishing: before.anti_phishing_code }),
    );
  }
  if (!before.withdrawals_enabled && input.withdrawals_enabled) {
    await createAdminClient().from("notifications").insert({
      user_id: input.userId,
      kind: "withdrawal",
      title: "Withdrawals unlocked",
      body: "Your account can now request withdrawals.",
      link: "/dashboard/withdraw",
    } as never);
  }
  refresh();
  return { ok: true, message: "User updated." };
}

// ----------------------------------------------------------------- tickets
export async function adminReplyTicketAction(input: { ticketId: string; message: string; close?: boolean }): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  const message = String(input.message ?? "").trim().slice(0, 5000);
  const db = createAdminClient();
  const { data: t } = await db.from("support_tickets").select("*").eq("id", input.ticketId).maybeSingle();
  const ticket = t as { id: string; user_id: string; subject: string } | null;
  if (!ticket) return { ok: false, error: "Ticket not found." };

  if (message) {
    await db.from("ticket_messages").insert({ ticket_id: ticket.id, author_id: admin.profile.id, is_staff: true, body: message } as never);
    await db.from("notifications").insert({
      user_id: ticket.user_id,
      kind: "support",
      title: "Support replied",
      body: ticket.subject,
      link: `/dashboard/support/${ticket.id}`,
    } as never);
    const user = await getProfile(ticket.user_id);
    if (user) {
      await sendEmail(
        user.email,
        templates.ticketReply({ name: user.full_name, subject: ticket.subject, message, ticketId: ticket.id, antiPhishing: user.anti_phishing_code }),
      );
    }
  }
  await db
    .from("support_tickets")
    .update({ status: input.close ? "closed" : message ? "answered" : "open", updated_at: new Date().toISOString() } as never)
    .eq("id", ticket.id);
  refresh();
  return { ok: true, message: input.close ? "Ticket closed." : "Reply sent." };
}

// ---------------------------------------------------------------- settings
export async function updateSettingsAction(input: {
  withdrawal_lock_days: number;
  trading_fee_bps: number;
  min_deposit_usd: number;
  min_trade_usd: number;
  trading_enabled: boolean;
  signups_enabled: boolean;
  deposit_addresses: Record<string, Record<string, string>>;
  bank_details: Record<string, string>;
}): Promise<ActionResult> {
  const admin = await currentAdmin();
  if (!admin) return DENIED;
  const lock = Math.round(Number(input.withdrawal_lock_days));
  const fee = Math.round(Number(input.trading_fee_bps));
  if (!(lock >= 0 && lock <= 3650)) return { ok: false, error: "Lock period must be 0-3650 days." };
  if (!(fee >= 0 && fee <= 1000)) return { ok: false, error: "Fee must be 0-1000 bps (0-10%)." };

  const clean = (o: Record<string, string>) =>
    Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, String(v).trim()]).filter(([, v]) => v));
  const addresses = Object.fromEntries(
    Object.entries(input.deposit_addresses ?? {})
      .map(([asset, nets]) => [asset, clean(nets)] as const)
      .filter(([, nets]) => Object.keys(nets).length),
  );

  const patch = {
    withdrawal_lock_days: lock,
    trading_fee_bps: fee,
    min_deposit_usd: Math.max(0, Number(input.min_deposit_usd) || 0),
    min_trade_usd: Math.max(0, Number(input.min_trade_usd) || 0),
    trading_enabled: !!input.trading_enabled,
    signups_enabled: !!input.signups_enabled,
    deposit_addresses: addresses,
    bank_details: clean(input.bank_details),
    updated_at: new Date().toISOString(),
  };
  const { error } = await createAdminClient().from("app_settings").update(patch as never).eq("id", 1);
  if (error) return { ok: false, error: "Could not save settings." };
  await audit(admin.profile.id, "settings.update", null, patch);
  refresh();
  return { ok: true, message: "Settings saved." };
}
