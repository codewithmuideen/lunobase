"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEPOSITABLE, ASSET_BY_SYMBOL } from "@/lib/assets";
import { SITE_URL } from "@/lib/env";
import { verifyPassword } from "@/lib/security/verify-password";
import { rateLimit } from "@/lib/security/rate-limit";
import { requestMeta } from "@/lib/security/request";
import { logSecurityEvent } from "@/lib/security/events";
import { sendAdminAlert, sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { friendlyError } from "@/lib/errors";
import { formatAmount } from "@/lib/utils";
import type { ActionResult, AppSettings } from "@/lib/types";

export async function submitDepositAction(input: {
  method: "crypto" | "bank";
  asset: string;
  network?: string;
  amount: number;
  reference: string;
}): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const { profile } = ctx;

  const method = input.method === "bank" ? "bank" : "crypto";
  const asset = method === "bank" ? "USD" : String(input.asset).toUpperCase();
  const amount = Number(input.amount);
  const reference = String(input.reference ?? "").trim().slice(0, 200);

  if (!DEPOSITABLE.includes(asset)) return { ok: false, error: "This asset isn't supported." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (reference.length < 4) {
    return { ok: false, error: method === "bank" ? "Enter your bank transfer reference." : "Enter the transaction hash (TXID)." };
  }
  if (method === "crypto" && input.network && !ASSET_BY_SYMBOL[asset]?.networks.includes(input.network)) {
    return { ok: false, error: "Select a valid network." };
  }

  const db = createAdminClient();
  const { data: s } = await db.from("app_settings").select("min_deposit_usd").eq("id", 1).single();
  if (asset === "USD" && amount < Number((s as Pick<AppSettings, "min_deposit_usd">).min_deposit_usd)) {
    return { ok: false, error: `Minimum bank deposit is $${(s as AppSettings).min_deposit_usd}.` };
  }
  if (!(await rateLimit(`deposit:${profile.id}`, 5, 3600))) {
    return { ok: false, error: "Too many deposit notices. Please wait before submitting another." };
  }

  const { error } = await db.from("deposits").insert({
    user_id: profile.id,
    method,
    asset,
    network: method === "crypto" ? input.network ?? null : null,
    amount,
    reference,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  await Promise.all([
    sendEmail(
      profile.email,
      templates.depositSubmitted({
        name: profile.full_name,
        amount: formatAmount(amount),
        asset,
        reference,
        antiPhishing: profile.anti_phishing_code,
      }),
    ),
    sendAdminAlert(
      templates.adminAlert({
        title: "New deposit awaiting confirmation",
        lines: [
          ["User", profile.email],
          ["Amount", `${formatAmount(amount)} ${asset}`],
          ["Method", method === "bank" ? "Bank transfer" : `Crypto · ${input.network ?? ""}`],
          ["Reference", reference],
        ],
        url: `${SITE_URL}/admin/deposits`,
      }),
    ),
  ]);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Deposit submitted. Your wallet updates automatically once it's confirmed." };
}

export async function requestWithdrawalAction(input: {
  asset: string;
  network: string;
  amount: number;
  destination: string;
  password: string;
}): Promise<ActionResult> {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const { profile } = ctx;

  const locked = !profile.withdrawals_enabled && new Date(profile.withdrawal_unlock_at) > new Date();
  if (locked) return { ok: false, error: friendlyError("WITHDRAWAL_LOCKED") };

  const asset = String(input.asset).toUpperCase();
  const amount = Number(input.amount);
  const destination = String(input.destination ?? "").trim();
  if (!DEPOSITABLE.includes(asset)) return { ok: false, error: "This asset isn't supported." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (destination.length < 10 || destination.length > 200 || /\s{2,}|[<>]/.test(destination)) {
    return { ok: false, error: asset === "USD" ? "Enter your full bank account details." : "Enter a valid wallet address." };
  }

  if (!(await rateLimit(`withdraw:${profile.id}`, 5, 3600))) {
    return { ok: false, error: "Too many withdrawal attempts. Please try again later." };
  }
  if (!(await verifyPassword(profile.email, String(input.password ?? "")))) {
    return { ok: false, error: "Incorrect password." };
  }

  const { error } = await createAdminClient().rpc("request_withdrawal", {
    p_user: profile.id,
    p_asset: asset,
    p_network: input.network || null,
    p_amount: amount,
    p_destination: destination,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  const { ip, userAgent } = await requestMeta();
  await Promise.all([
    logSecurityEvent(profile.id, "withdrawal_requested", { ip, userAgent, asset, amount }),
    sendEmail(
      profile.email,
      templates.withdrawalRequested({
        name: profile.full_name,
        amount: formatAmount(amount),
        asset,
        destination,
        antiPhishing: profile.anti_phishing_code,
      }),
    ),
    sendAdminAlert(
      templates.adminAlert({
        title: "Withdrawal request needs review",
        lines: [
          ["User", profile.email],
          ["Amount", `${formatAmount(amount)} ${asset}`],
          ["Network", input.network || "-"],
          ["Destination", destination],
          ["IP", ip],
        ],
        url: `${SITE_URL}/admin/withdrawals`,
      }),
    ),
  ]);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Withdrawal submitted for security review. Funds are on hold until it's processed." };
}
