"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, Info, Search, ShieldCheck, Timer, TrendingDown, TrendingUp } from "lucide-react";
import type { MarketCoin } from "@/lib/market";
import type { Trade } from "@/lib/types";
import { QUOTE, TRADABLE_ASSETS } from "@/lib/assets";
import { useMarkets } from "@/hooks/use-markets";
import { placeOrderAction } from "@/actions/trade";
import { cn, formatAmount, formatDate, formatPrice, formatUsd } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { CandleChart } from "./candle-chart";

const QUOTE_TTL = 15;

export function TradeTerminal({
  asset,
  initialMarkets,
  balances,
  feeBps,
  minTrade,
  trades,
  tradingEnabled,
  accountActive,
  avgCost,
}: {
  asset: string;
  initialMarkets: MarketCoin[];
  balances: Record<string, number>;
  feeBps: number;
  minTrade: number;
  trades: Trade[];
  tradingEnabled: boolean;
  accountActive: boolean;
  /** Average price the user paid per unit of this asset (0 if unknown). */
  avgCost: number;
}) {
  const router = useRouter();
  const { bySymbol } = useMarkets(initialMarkets, 20_000);
  const coin = bySymbol[asset];
  const info = TRADABLE_ASSETS.find((a) => a.symbol === asset)!;
  const price = coin?.current_price ?? 0;

  // Which way did the price just move? Drives the up/down arrow next to the live price.
  const lastPrice = useRef(price);
  const [tick, setTick] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (!price || price === lastPrice.current) return;
    setTick(price > lastPrice.current ? "up" : "down");
    lastPrice.current = price;
  }, [price]);

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [input, setInput] = useState("");
  const [review, setReview] = useState<{ price: number; at: number } | null>(null);
  const [left, setLeft] = useState(QUOTE_TTL);
  const [pending, start] = useTransition();

  const usd = balances[QUOTE] ?? 0; // spendable USDT
  const held = balances[asset] ?? 0;
  const fee = feeBps / 10000;
  const amount = Number(input) || 0;

  const calc = useMemo(() => {
    const p = review?.price ?? price;
    if (!p || !amount) return null;
    if (side === "buy") {
      const gross = amount / (1 + fee);
      return { qty: gross / p, gross, fee: amount - gross, total: amount, price: p };
    }
    const gross = amount * p;
    return { qty: amount, gross, fee: gross * fee, total: gross - gross * fee, price: p };
  }, [amount, side, price, fee, review]);

  const error =
    !amount
      ? null
      : side === "buy" && amount > usd
        ? "Insufficient USDT balance"
        : side === "sell" && amount > held
          ? `Insufficient ${asset} balance`
          : calc && calc.gross < minTrade
            ? `Minimum order is ${minTrade} USDT`
            : null;

  const disabledReason = !tradingEnabled ? "Trading is paused for maintenance" : !accountActive ? "Your account is frozen" : null;

  // Quote countdown
  useEffect(() => {
    if (!review) return;
    setLeft(QUOTE_TTL);
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [review]);
  useEffect(() => {
    if (review && left <= 0) setReview({ price, at: Date.now() }); // auto-refresh expired quote
  }, [left, review, price]);

  const setPct = (pct: number) => {
    if (side === "buy") setInput(usd > 0 ? (Math.floor(usd * pct * 100) / 100).toString() : "");
    else setInput(held > 0 ? (Math.floor(held * pct * 1e8) / 1e8).toString() : "");
  };

  const submit = () => {
    if (!review) return;
    start(async () => {
      const res = await placeOrderAction({ side, asset, amount, quotedPrice: review.price });
      if (res.ok) {
        toast.success(side === "buy" ? "Buy order filled" : "Sell order filled", { description: res.message });
        setReview(null);
        setInput("");
        router.refresh();
      } else {
        toast.error("Order not placed", { description: res.error });
        setReview(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Pair header */}
      <div className="card flex flex-wrap items-center gap-x-8 gap-y-4 p-4 sm:px-5">
        <PairSelector current={asset} bySymbol={bySymbol} />
        <div>
          <p
            className={cn(
              "num flex items-center gap-1.5 font-display text-2xl font-bold transition-colors duration-500",
              tick === "up" ? "text-up" : tick === "down" ? "text-down" : "text-white",
            )}
          >
            {price ? formatPrice(price) : "-"}
            {tick === "up" && <ArrowUp className="size-5" aria-label="Price moved up" />}
            {tick === "down" && <ArrowDown className="size-5" aria-label="Price moved down" />}
          </p>
          <p className="text-xs text-muted">Live · USDT</p>
        </div>
        <Stat label="24h change">
          <Change value={coin?.price_change_percentage_24h} />
        </Stat>
        <Stat label="24h high">{coin ? formatPrice(coin.high_24h) : "-"}</Stat>
        <Stat label="24h low">{coin ? formatPrice(coin.low_24h) : "-"}</Stat>
        <Stat label="24h volume" className="hidden md:block">
          {coin ? formatUsd(coin.total_volume, { compact: true }) : "-"}
        </Stat>
        <Stat label="Market cap" className="hidden lg:block">
          {coin ? formatUsd(coin.market_cap, { compact: true }) : "-"}
        </Stat>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        {/* Chart */}
        <div className="card h-[420px] overflow-hidden sm:h-[520px]">
          <CandleChart coinId={info.id} livePrice={price} />
        </div>

        {/* Order panel */}
        <div className="card-raised p-5">
          <div className="grid grid-cols-2 rounded-xl bg-ink-950/60 p-1">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSide(s);
                  setInput("");
                }}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-semibold capitalize transition",
                  side === s ? (s === "buy" ? "bg-up text-ink-950" : "bg-down text-white") : "text-slate hover:text-white",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-muted">Order type</span>
            <span className="rounded-md bg-white/[0.06] px-2 py-1 font-medium text-silver">Market</span>
          </div>

          <label className="mt-4 block">
            <span className="flex justify-between text-xs text-muted">
              <span>{side === "buy" ? "You spend" : "You sell"}</span>
              <span>
                Available:{" "}
                <button onClick={() => setPct(1)} className="num font-medium text-silver hover:text-white">
                  {side === "buy" ? `${formatAmount(usd, 2)} USDT` : `${formatAmount(held)} ${asset}`}
                </button>
              </span>
            </span>
            <div className="relative mt-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
                inputMode="decimal"
                placeholder="0.00"
                className={cn(
                  "num h-14 w-full rounded-xl border bg-ink-950/70 pl-4 pr-20 text-xl font-semibold text-white outline-none transition placeholder:text-muted",
                  error ? "border-down/50" : "border-white/10 focus:border-brand-500",
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate">{side === "buy" ? "USDT" : asset}</span>
            </div>
          </label>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <button key={p} onClick={() => setPct(p)} className="rounded-lg bg-white/[0.05] py-1.5 text-xs font-semibold text-slate transition hover:bg-white/10 hover:text-white">
                {p === 1 ? "Max" : `${p * 100}%`}
              </button>
            ))}
          </div>

          <dl className="mt-5 space-y-2.5 rounded-xl border border-white/5 bg-ink-950/40 p-4 text-sm">
            <Row label="Price">{price ? formatPrice(price) : "-"}</Row>
            <Row label={side === "buy" ? "You receive (est.)" : "Gross proceeds"}>
              {calc ? (side === "buy" ? `${formatAmount(calc.qty)} ${asset}` : formatUsd(calc.gross)) : "-"}
            </Row>
            <Row label={`Fee (${(feeBps / 100).toFixed(2)}%)`}>{calc ? formatUsd(calc.fee) : "-"}</Row>
            <div className="border-t border-white/5 pt-2.5">
              <Row label={side === "buy" ? "Total cost" : "You receive"} strong>
                {calc ? formatUsd(calc.total) : "-"}
              </Row>
            </div>
          </dl>

          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-down">
              <AlertTriangle className="size-4" /> {error}
            </p>
          )}

          {disabledReason ? (
            <p className="mt-4 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">{disabledReason}</p>
          ) : side === "buy" && usd <= 0 ? (
            <Link
              href="/dashboard/deposit?asset=USDT"
              className="mt-4 flex h-12 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-[#1a63ff]"
            >
              Deposit USDT to buy
            </Link>
          ) : (
            <Button
              size="lg"
              variant={side === "buy" ? "success" : "danger"}
              className="mt-4 w-full"
              disabled={!amount || !!error || !price}
              onClick={() => setReview({ price, at: Date.now() })}
            >
              Review {side} {asset}
            </Button>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Market orders fill instantly at the live price. If the price moves more than 2% before execution, the order is cancelled for your
            protection.
          </p>
        </div>
      </div>

      {/* Your position: holdings, cost and live gain / loss */}
      {(() => {
        const value = held * price;
        const cost = held * avgCost;
        const pnl = avgCost > 0 ? value - cost : 0;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        const gain = pnl >= 0;
        const day = coin?.price_change_percentage_24h ?? 0;
        return (
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Your {asset} position</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  day >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down",
                )}
              >
                {day >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {asset} is {day >= 0 ? "up" : "down"} {Math.abs(day).toFixed(2)}% today
              </span>
            </div>
            {held > 0 ? (
              <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted">You hold</dt>
                  <dd className="num mt-1 font-semibold text-white">
                    {formatAmount(held)} {asset}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Current value</dt>
                  <dd className="num mt-1 font-semibold text-white">{formatAmount(value, 2)} USDT</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Average buy price</dt>
                  <dd className="num mt-1 font-semibold text-white">{avgCost > 0 ? formatPrice(avgCost) : "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{avgCost > 0 ? (gain ? "Gain so far" : "Loss so far") : "Gain / loss"}</dt>
                  <dd className={cn("num mt-1 flex items-center gap-1.5 font-semibold", avgCost <= 0 ? "text-slate" : gain ? "text-up" : "text-down")}>
                    {avgCost > 0 ? (
                      <>
                        {gain ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                        {gain ? "+" : "-"}
                        {formatAmount(Math.abs(pnl), 2)} USDT ({gain ? "+" : "-"}
                        {Math.abs(pnlPct).toFixed(2)}%)
                      </>
                    ) : (
                      "Not available for deposited coins"
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate">You don&apos;t hold any {asset} yet. After you buy, your gain or loss shows here and updates with the live price.</p>
            )}
            <p className="mt-4 text-xs text-muted">Gain or loss is unrealised until you sell, and changes as the price moves. Prices can go down as well as up.</p>
          </div>
        );
      })()}

      {/* Order history */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-white">Your {asset} orders</h2>
          <Link href="/dashboard/history?tab=trades" className="text-sm text-brand-400 hover:text-brand-300">
            All orders →
          </Link>
        </div>
        {trades.length === 0 ? (
          <p className="px-5 pb-8 pt-2 text-sm text-slate">No {asset} orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-y border-white/5 text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Side</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-right font-medium">Fee</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3 text-slate">{formatDate(t.created_at)}</td>
                    <td className={cn("px-4 py-3 font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>{t.side}</td>
                    <td className="num px-4 py-3 text-right text-white">{formatPrice(Number(t.price))}</td>
                    <td className="num px-4 py-3 text-right text-white">{formatAmount(t.quantity)}</td>
                    <td className="num px-4 py-3 text-right text-slate">{formatUsd(t.fee_usd)}</td>
                    <td className="num px-5 py-3 text-right font-medium text-white">
                      {formatUsd(t.side === "buy" ? Number(t.gross_usd) + Number(t.fee_usd) : Number(t.gross_usd) - Number(t.fee_usd))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal
        open={!!review}
        onClose={() => !pending && setReview(null)}
        title={`Confirm ${side} ${info.name}`}
        description="Review your order before it's executed."
      >
        {calc && (
          <div>
            <div className="rounded-2xl border border-white/5 bg-ink-950/50 p-5 text-center">
              <CoinIcon src={coin?.image} symbol={asset} className="mx-auto size-12" />
              <p className="num mt-3 font-display text-3xl font-bold text-white">
                {side === "buy" ? "+" : "−"}
                {formatAmount(calc.qty)} {asset}
              </p>
              <p className="mt-1 text-sm text-slate">at {formatPrice(calc.price)} per {asset}</p>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              <Row label="Order type">Market</Row>
              <Row label={side === "buy" ? "Spend" : "Proceeds"}>{formatUsd(calc.gross)}</Row>
              <Row label="Fee">{formatUsd(calc.fee)}</Row>
              <Row label={side === "buy" ? "Total cost" : "You receive"} strong>
                {formatUsd(calc.total)}
              </Row>
            </dl>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-xs text-slate">
              <span className="flex items-center gap-2">
                <Timer className="size-4 text-brand-400" /> Quote refreshes in {Math.max(left, 0)}s
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-up" /> 2% slippage guard
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setReview(null)} disabled={pending}>
                Cancel
              </Button>
              <Button variant={side === "buy" ? "success" : "danger"} onClick={submit} loading={pending}>
                Confirm {side}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted">{label}</p>
      <div className="num mt-0.5 text-sm font-medium text-white">{children}</div>
    </div>
  );
}

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate">{label}</dt>
      <dd className={cn("num text-right", strong ? "font-semibold text-white" : "text-silver")}>{children}</dd>
    </div>
  );
}

function PairSelector({ current, bySymbol }: { current: string; bySymbol: Record<string, MarketCoin> }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const coin = bySymbol[current];
  const list = TRADABLE_ASSETS.filter((a) => a.symbol !== QUOTE).filter(
    (a) => !q || a.symbol.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 rounded-xl py-1 pr-2 transition hover:bg-white/5">
        <CoinIcon src={coin?.image} symbol={current} className="size-9" />
        <span className="text-left">
          <span className="flex items-center gap-1 font-display text-lg font-bold text-white">
            {current}/USDT <ChevronDown className="size-4 text-slate" />
          </span>
          <span className="block text-xs text-muted">{coin?.name}</span>
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-14 z-40 w-80 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl animate-fade-up">
          <div className="border-b border-white/5 p-3">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search assets"
                className="h-10 w-full rounded-lg border border-white/10 bg-ink-950 pl-9 pr-3 text-sm text-white outline-none focus:border-brand-500"
              />
            </label>
          </div>
          <ul className="max-h-80 overflow-y-auto p-1.5">
            {list.map((a) => {
              const m = bySymbol[a.symbol];
              return (
                <li key={a.symbol}>
                  <Link
                    href={`/dashboard/trade?asset=${a.symbol}`}
                    onClick={() => setOpen(false)}
                    className={cn("flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/5", a.symbol === current && "bg-white/5")}
                  >
                    <span className="flex items-center gap-2.5">
                      <CoinIcon src={m?.image} symbol={a.symbol} className="size-6" />
                      <span className="text-sm font-semibold text-white">{a.symbol}</span>
                      <span className="text-xs text-muted">{a.name}</span>
                    </span>
                    <span className="text-right">
                      <span className="num block text-xs text-white">{m ? formatPrice(m.current_price) : "-"}</span>
                      <Change value={m?.price_change_percentage_24h} className="text-[11px]" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
