import { requireUser } from "@/lib/auth";
import { getBalances, getSettings } from "@/lib/data";
import { getMarkets } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { ASSET_BY_ID, ASSET_BY_SYMBOL, QUOTE } from "@/lib/assets";
import type { Trade } from "@/lib/types";
import { TradeTerminal } from "@/components/trade/trade-terminal";

export const metadata = { title: "Trade" };

export default async function TradePage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const { profile } = await requireUser();
  const { asset: raw } = await searchParams;
  const wanted = raw?.toUpperCase();
  const asset = wanted && ASSET_BY_SYMBOL[wanted] && wanted !== QUOTE ? wanted : "BTC";

  const supabase = await createClient();
  const [balances, settings, markets, tradesRes] = await Promise.all([
    getBalances(profile.id),
    getSettings(),
    getMarkets(250),
    supabase.from("trades").select("*").eq("user_id", profile.id).eq("asset", asset).order("created_at", { ascending: false }).limit(10),
  ]);

  const tradable = markets.filter((m) => ASSET_BY_ID[m.id]).map((m) => ({ ...m, sparkline_in_7d: undefined }));
  const bal: Record<string, number> = {};
  for (const b of balances) bal[b.asset] = Number(b.amount);
  const avgCost = Number(balances.find((b) => b.asset === asset)?.avg_cost ?? 0);

  return (
    <TradeTerminal
      key={asset}
      asset={asset}
      initialMarkets={tradable}
      balances={bal}
      feeBps={settings.trading_fee_bps}
      minTrade={Number(settings.min_trade_usd)}
      trades={(tradesRes.data as Trade[] | null) ?? []}
      tradingEnabled={settings.trading_enabled}
      accountActive={profile.status === "active"}
      avgCost={avgCost}
    />
  );
}
