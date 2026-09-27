import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMarkets, type MarketCoin } from "@/lib/market";
import { ASSET_BY_SYMBOL, TRADABLE_ASSETS } from "@/lib/assets";
import type { AppSettings, Balance } from "@/lib/types";

export type Holding = {
  asset: string;
  name: string;
  image: string | null;
  amount: number;
  locked: number;
  price: number;
  value: number;
  lockedValue: number;
  avgCost: number;
  pnl: number;
  pnlPct: number;
  change24h: number;
  sparkline: number[];
  allocation: number;
};

export type Portfolio = {
  holdings: Holding[];
  totalValue: number;
  availableValue: number;
  lockedValue: number;
  cash: number;
  cryptoValue: number;
  change24hUsd: number;
  change24hPct: number;
  history: { t: number; v: number }[];
  prices: Record<string, number>;
  markets: MarketCoin[];
};

export const getSettings = cache(async (): Promise<AppSettings> => {
  const { data } = await createAdminClient().from("app_settings").select("*").eq("id", 1).single();
  return data as AppSettings;
});

/** Balances via the user's own RLS-scoped client (defense in depth). */
export const getBalances = cache(async (userId: string): Promise<Balance[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("balances").select("*").eq("user_id", userId);
  return (data as Balance[] | null) ?? [];
});

export const getPortfolio = cache(async (userId: string): Promise<Portfolio> => {
  const [balances, markets] = await Promise.all([getBalances(userId), getMarkets(250)]);
  const byId = new Map(markets.map((m) => [m.id, m]));

  const prices: Record<string, number> = { USD: 1 };
  for (const a of TRADABLE_ASSETS) {
    const m = byId.get(a.id);
    if (m) prices[a.symbol] = m.current_price;
  }

  let change24hUsd = 0;
  const raw = balances
    .map((b) => {
      const amount = Number(b.amount);
      const locked = Number(b.locked);
      const info = ASSET_BY_SYMBOL[b.asset];
      const m = info ? byId.get(info.id) : undefined;
      const price = b.asset === "USD" ? 1 : (m?.current_price ?? 0);
      const value = amount * price;
      const lockedValue = locked * price;
      const avgCost = Number(b.avg_cost);
      const costBasis = avgCost * amount;
      const pnl = b.asset === "USD" || !avgCost ? 0 : value - costBasis;
      const change24h = b.asset === "USD" ? 0 : (m?.price_change_percentage_24h ?? 0);
      change24hUsd += (value + lockedValue) - (value + lockedValue) / (1 + change24h / 100);
      return {
        asset: b.asset,
        name: b.asset === "USD" ? "US Dollar" : (info?.name ?? b.asset),
        image: m?.image ?? null,
        amount,
        locked,
        price,
        value,
        lockedValue,
        avgCost,
        pnl,
        pnlPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
        change24h,
        sparkline: m?.sparkline_in_7d?.price ?? [],
        allocation: 0,
      } satisfies Holding;
    })
    .filter((h) => h.amount > 0 || h.locked > 0 || h.asset === "USD");

  const totalValue = raw.reduce((s, h) => s + h.value + h.lockedValue, 0);
  const holdings = raw
    .map((h) => ({ ...h, allocation: totalValue > 0 ? ((h.value + h.lockedValue) / totalValue) * 100 : 0 }))
    .sort((a, b) => b.value + b.lockedValue - (a.value + a.lockedValue));

  const cashH = holdings.find((h) => h.asset === "USD");
  const cash = cashH?.value ?? 0;
  const lockedValue = holdings.reduce((s, h) => s + h.lockedValue, 0);

  // 7-day value of the CURRENT holdings, reconstructed from each asset's hourly sparkline.
  const crypto = holdings.filter((h) => h.asset !== "USD" && h.sparkline.length > 1);
  const len = crypto.length ? Math.min(...crypto.map((h) => h.sparkline.length)) : 0;
  const now = Date.now();
  const history =
    len > 1
      ? Array.from({ length: len }, (_, i) => ({
          t: now - (len - 1 - i) * 3600_000,
          v:
            (cashH ? cashH.value + cashH.lockedValue : 0) +
            crypto.reduce((s, h) => s + (h.amount + h.locked) * h.sparkline[h.sparkline.length - len + i], 0),
        }))
      : [];

  return {
    holdings,
    totalValue,
    availableValue: totalValue - lockedValue,
    lockedValue,
    cash,
    cryptoValue: totalValue - cash - (cashH?.lockedValue ?? 0),
    change24hUsd,
    change24hPct: totalValue - change24hUsd > 0 ? (change24hUsd / (totalValue - change24hUsd)) * 100 : 0,
    history,
    prices,
    markets,
  };
});

export async function getUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
