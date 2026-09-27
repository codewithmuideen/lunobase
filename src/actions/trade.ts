"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_BY_SYMBOL } from "@/lib/assets";
import { getExecutionPrice } from "@/lib/market";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { friendlyError } from "@/lib/errors";
import { formatAmount, formatPrice, formatUsd } from "@/lib/utils";
import type { ActionResult, AppSettings, Trade } from "@/lib/types";

const MAX_SLIPPAGE = 0.02; // reject if price moved >2% since the user saw the quote

export type OrderInput = {
  side: "buy" | "sell";
  asset: string;
  /** buy: USD to spend (fee included). sell: quantity of the asset. */
  amount: number;
  /** Price shown to the user when they clicked; used for the slippage guard. */
  quotedPrice: number;
};

export async function placeOrderAction(input: OrderInput): Promise<ActionResult<Trade>> {
  const ctx = await currentUser();
  if (!ctx) return { ok: false, error: "Your session has expired. Please sign in again." };
  const { profile } = ctx;

  const side = input.side === "sell" ? "sell" : "buy";
  const asset = String(input.asset).toUpperCase();
  const amount = Number(input.amount);
  if (!ASSET_BY_SYMBOL[asset]) return { ok: false, error: "This asset isn't supported." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (profile.status !== "active") return { ok: false, error: friendlyError("ACCOUNT_FROZEN") };

  if (!(await rateLimit(`trade:${profile.id}`, 20, 60))) {
    return { ok: false, error: "You're placing orders too quickly. Please wait a moment." };
  }

  const db = createAdminClient();
  const { data: s } = await db.from("app_settings").select("*").eq("id", 1).single();
  const settings = s as AppSettings;
  if (!settings.trading_enabled) return { ok: false, error: friendlyError("TRADING_DISABLED") };

  let price: number;
  try {
    price = await getExecutionPrice(asset);
  } catch {
    return { ok: false, error: friendlyError("PRICE_UNAVAILABLE") };
  }
  if (input.quotedPrice > 0 && Math.abs(price - input.quotedPrice) / input.quotedPrice > MAX_SLIPPAGE) {
    return { ok: false, error: `The price moved to ${formatPrice(price)}. Please review and try again.` };
  }

  const feeRate = settings.trading_fee_bps / 10000;
  let quantity: number;
  if (side === "buy") {
    if (amount < Number(settings.min_trade_usd)) {
      return { ok: false, error: `Minimum order is ${formatUsd(settings.min_trade_usd)}.` };
    }
    const gross = amount / (1 + feeRate);
    quantity = Math.floor((gross / price) * 1e8) / 1e8;
  } else {
    quantity = Math.floor(amount * 1e8) / 1e8;
    if (quantity * price < Number(settings.min_trade_usd)) {
      return { ok: false, error: `Minimum order is ${formatUsd(settings.min_trade_usd)}.` };
    }
  }
  if (quantity <= 0) return { ok: false, error: "Amount is too small." };

  const { data, error } = await db.rpc("execute_trade", {
    p_user: profile.id,
    p_side: side,
    p_asset: asset,
    p_quantity: quantity,
    p_price: price,
    p_fee_bps: settings.trading_fee_bps,
  } as never);
  if (error) return { ok: false, error: friendlyError(error.message) };

  const trade = data as Trade;
  if (profile.trade_emails) {
    const total = side === "buy" ? Number(trade.gross_usd) + Number(trade.fee_usd) : Number(trade.gross_usd) - Number(trade.fee_usd);
    await sendEmail(
      profile.email,
      templates.tradeFilled({
        name: profile.full_name,
        side: side === "buy" ? "Buy" : "Sell",
        quantity: formatAmount(trade.quantity),
        asset,
        price: formatPrice(Number(trade.price)),
        fee: formatUsd(trade.fee_usd),
        total: formatUsd(total),
        antiPhishing: profile.anti_phishing_code,
      }),
    );
  }

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    data: trade,
    message: `${side === "buy" ? "Bought" : "Sold"} ${formatAmount(trade.quantity)} ${asset} at ${formatPrice(Number(trade.price))}`,
  };
}
