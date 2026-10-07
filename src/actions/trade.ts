"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { after } from "next/server";
import { ASSET_BY_SYMBOL, QUOTE } from "@/lib/assets";
import { getExecutionPrice } from "@/lib/market";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { templates } from "@/lib/email/templates";
import { friendlyError } from "@/lib/errors";
import { formatAmount, formatPrice, formatUsd } from "@/lib/utils";
import { getSettings } from "@/lib/data";
import { awardLnc, getLncBalance } from "@/lib/lnc";
import { LNC, discountedFeeBps, tradeReward } from "@/lib/lunocoin";
import type { ActionResult, Trade } from "@/lib/types";

const MAX_SLIPPAGE = 0.02; // reject if price moved >2% since the user saw the quote

export type OrderInput = {
  side: "buy" | "sell";
  asset: string;
  /** buy: USDT to spend (fee included). sell: quantity of the asset. */
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
  if (!ASSET_BY_SYMBOL[asset] || asset === QUOTE) return { ok: false, error: "This asset isn't supported." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (profile.status !== "active") return { ok: false, error: friendlyError("ACCOUNT_FROZEN") };

  if (!(await rateLimit(`trade:${profile.id}`, 20, 60))) {
    return { ok: false, error: "You're placing orders too quickly. Please wait a moment." };
  }

  const db = createAdminClient();
  const settings = await getSettings();
  if (!settings.trading_enabled) return { ok: false, error: friendlyError("TRADING_DISABLED") };

  // Live USD prices for the asset and for USDT, fetched in parallel; the order is priced in USDT.
  let price: number;
  try {
    const [assetUsd, quoteUsd] = await Promise.all([getExecutionPrice(asset), getExecutionPrice(QUOTE).catch(() => 1)]);
    price = assetUsd / (quoteUsd > 0.9 && quoteUsd < 1.1 ? quoteUsd : 1);
  } catch {
    return { ok: false, error: friendlyError("PRICE_UNAVAILABLE") };
  }
  if (input.quotedPrice > 0 && Math.abs(price - input.quotedPrice) / input.quotedPrice > MAX_SLIPPAGE) {
    return { ok: false, error: `The price moved to ${formatPrice(price)}. Please review and try again.` };
  }

  // LunoCoin holders pay a lower fee (20% off from 1,000 LNC, 50% off from 10,000 LNC).
  const feeBps = discountedFeeBps(settings.trading_fee_bps, (await getLncBalance(profile.id)).balance);
  const feeRate = feeBps / 10000;
  let quantity: number;
  if (side === "buy") {
    if (amount < Number(settings.min_trade_usd)) {
      return { ok: false, error: `Minimum order is ${settings.min_trade_usd} ${QUOTE}.` };
    }
    const gross = amount / (1 + feeRate);
    quantity = Math.floor((gross / price) * 1e8) / 1e8;
  } else {
    quantity = Math.floor(amount * 1e8) / 1e8;
    if (quantity * price < Number(settings.min_trade_usd)) {
      return { ok: false, error: `Minimum order is ${settings.min_trade_usd} ${QUOTE}.` };
    }
  }
  if (quantity <= 0) return { ok: false, error: "Amount is too small." };

  const { data, error } = await db.rpc("execute_trade_quote", {
    p_user: profile.id,
    p_side: side,
    p_asset: asset,
    p_quote: QUOTE,
    p_quantity: quantity,
    p_price: price,
    p_fee_bps: feeBps,
  } as never);
  if (error) {
    if (error.code === "PGRST202" || /execute_trade_quote/.test(error.message)) {
      console.error("[trade] run supabase/migrations/0002_usdt_quote.sql");
      return { ok: false, error: "Trading is being upgraded. Please try again shortly." };
    }
    return { ok: false, error: friendlyError(error.message) };
  }

  const trade = data as Trade;
  if (profile.trade_emails) {
    const total = side === "buy" ? Number(trade.gross_usd) + Number(trade.fee_usd) : Number(trade.gross_usd) - Number(trade.fee_usd);
    // Send the receipt after the response, so the order confirms instantly.
    after(() =>
      sendEmail(
      profile.email,
      templates.tradeFilled({
        name: profile.full_name,
        side: side === "buy" ? "Buy" : "Sell",
        quantity: formatAmount(trade.quantity),
        asset,
        price: formatPrice(Number(trade.price)),
        fee: `${formatAmount(trade.fee_usd, 2)} ${QUOTE}`,
        total: `${formatAmount(total, 2)} ${QUOTE}`,
        antiPhishing: profile.anti_phishing_code,
      }),
    ),
    );
  }

  // LunoCoin: 2 LNC per 10 USDT traded, plus a one-off reward to whoever referred this user.
  const earned = await awardLnc(profile.id, "trade", tradeReward(Number(trade.gross_usd)), trade.id, `${side === "buy" ? "Bought" : "Sold"} ${asset}`);
  if (profile.referred_by) {
    after(() => awardLnc(profile.referred_by!, "referral", LNC.rewards.referral, profile.id, "A friend you referred made a trade"));
  }

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    data: trade,
    message: `${side === "buy" ? "Bought" : "Sold"} ${formatAmount(trade.quantity)} ${asset} at ${formatPrice(Number(trade.price))}${earned ? `. +${earned} ${LNC.symbol} earned` : ""}`,
  };
}
