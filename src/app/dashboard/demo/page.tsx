import { FlaskConical } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMarkets } from "@/lib/market";
import { ASSET_BY_ID, ASSET_BY_SYMBOL, QUOTE } from "@/lib/assets";
import { cn, formatAmount, formatDate, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { DemoTerminal } from "@/components/dashboard/demo-terminal";
import { CoinIcon } from "@/components/market/coin-icon";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Demo account" };

const START = 10_000;

export default async function DemoPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [balRes, tradesRes, markets] = await Promise.all([
    supabase.from("demo_balances").select("asset, amount, avg_cost").eq("user_id", profile.id),
    supabase.from("demo_trades").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(15),
    getMarkets(250),
  ]);

  const notReady = !!balRes.error;
  const rows = (balRes.data as { asset: string; amount: string; avg_cost: string }[] | null) ?? [];
  const trades = (tradesRes.data as { id: string; side: string; asset: string; quantity: string; price: string; gross: string; created_at: string }[] | null) ?? [];
  const tradable = markets.filter((m) => ASSET_BY_ID[m.id] && m.symbol !== QUOTE);
  const priceOf = Object.fromEntries(tradable.map((m) => [m.symbol, m.current_price]));
  const imageOf = Object.fromEntries(tradable.map((m) => [m.symbol, m.image]));

  // A brand-new demo account has no rows yet and starts with the full practice balance.
  const balances: Record<string, number> = rows.length ? Object.fromEntries(rows.map((r) => [r.asset, Number(r.amount)])) : { USDT: START };
  const holdings = rows
    .filter((r) => r.asset !== "USDT" && Number(r.amount) > 0)
    .map((r) => {
      const amount = Number(r.amount);
      const price = priceOf[r.asset] ?? 0;
      const cost = Number(r.avg_cost) * amount;
      const value = amount * price;
      return { asset: r.asset, amount, price, value, pnl: value - cost, pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
    });
  const total = (balances.USDT ?? 0) + holdings.reduce((s, h) => s + h.value, 0);
  const result = total - START;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Demo account
            <span className="rounded-md bg-warn px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink-950">Practice</span>
          </span>
        }
        description="Learn to trade with pretend funds at live market prices. Nothing here is real money."
        actions={<ButtonLink href="/dashboard/trade">Trade for real</ButtonLink>}
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warn/25 bg-warn/[0.07] p-4 text-sm text-silver">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-warn" />
        <p>
          <strong className="text-white">This is a simulator.</strong> Demo funds have no value, can&apos;t be withdrawn or converted, and are
          completely separate from your real wallet. Results here don&apos;t predict real trading results.
        </p>
      </div>

      {notReady ? (
        <div className="card p-6 text-sm text-silver">The demo account is being set up. Please check back shortly.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Tile label="Demo portfolio value" value={`${formatAmount(total, 2)} USDT`} />
              <Tile label="Practice USDT" value={formatAmount(balances.USDT ?? 0, 2)} />
              <Tile
                label={result >= 0 ? "Practice gain" : "Practice loss"}
                value={`${result >= 0 ? "+" : "-"}${formatAmount(Math.abs(result), 2)} USDT`}
                tone={result >= 0 ? "up" : "down"}
              />
            </div>

            <section className="card overflow-hidden">
              <h2 className="px-5 pt-5 font-semibold text-white sm:px-6">Practice holdings</h2>
              {holdings.length === 0 ? (
                <p className="px-5 pb-8 pt-3 text-sm text-slate sm:px-6">Nothing yet. Place a practice buy to see how a position gains or loses value.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-y border-white/5 text-xs text-muted">
                      <tr>
                        <th className="px-5 py-3 font-medium sm:px-6">Coin</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                        <th className="px-4 py-3 text-right font-medium">Value</th>
                        <th className="px-5 py-3 text-right font-medium sm:px-6">Gain / loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h) => (
                        <tr key={h.asset} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="flex items-center gap-3">
                              <CoinIcon src={imageOf[h.asset]} symbol={h.asset} />
                              <span>
                                <span className="block font-semibold text-white">{h.asset}</span>
                                <span className="text-xs text-muted">{ASSET_BY_SYMBOL[h.asset]?.name}</span>
                              </span>
                            </span>
                          </td>
                          <td className="num px-4 py-3.5 text-right text-white">{formatAmount(h.amount)}</td>
                          <td className="num px-4 py-3.5 text-right text-white">{formatAmount(h.value, 2)}</td>
                          <td className={cn("num px-5 py-3.5 text-right font-medium sm:px-6", h.pnl >= 0 ? "text-up" : "text-down")}>
                            {h.pnl >= 0 ? "+" : "-"}
                            {formatAmount(Math.abs(h.pnl), 2)} ({h.pnl >= 0 ? "+" : "-"}
                            {Math.abs(h.pnlPct).toFixed(2)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card overflow-hidden">
              <h2 className="px-5 pt-5 font-semibold text-white sm:px-6">Practice orders</h2>
              {trades.length === 0 ? (
                <p className="px-5 pb-8 pt-3 text-sm text-slate sm:px-6">No practice orders yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-white/[0.04]">
                  {trades.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm sm:px-6">
                      <span>
                        <span className={cn("font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>{t.side}</span>{" "}
                        <span className="num text-white">
                          {formatAmount(t.quantity)} {t.asset}
                        </span>
                        <span className="block text-xs text-muted">{formatDate(t.created_at)}</span>
                      </span>
                      <span className="num text-right text-slate">
                        @ {formatPrice(Number(t.price))}
                        <span className="block text-xs">{formatAmount(t.gross, 2)} USDT</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <DemoTerminal assets={tradable.map((m) => ({ symbol: m.symbol, name: m.name, price: m.current_price }))} balances={balances} />
        </div>
      )}
    </>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("num mt-2 font-display text-xl font-bold sm:text-2xl", tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white")}>{value}</p>
    </div>
  );
}
