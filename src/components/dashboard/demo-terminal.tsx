"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { demoResetAction, demoTradeAction } from "@/actions/features";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { cn, formatAmount, formatPrice } from "@/lib/utils";

export function DemoTerminal({
  assets,
  balances,
}: {
  assets: { symbol: string; name: string; price: number }[];
  balances: Record<string, number>;
}) {
  const router = useRouter();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [asset, setAsset] = useState(assets[0]?.symbol ?? "BTC");
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();

  const price = assets.find((a) => a.symbol === asset)?.price ?? 0;
  const usdt = balances.USDT ?? 0;
  const held = balances[asset] ?? 0;
  const amount = Number(input) || 0;
  const available = side === "buy" ? usdt : held;
  const error = amount > available ? `Not enough practice ${side === "buy" ? "USDT" : asset}` : null;
  const estimate = !amount || !price ? null : side === "buy" ? `${formatAmount(amount / price)} ${asset}` : `${formatAmount(amount * price, 2)} USDT`;

  const submit = () =>
    start(async () => {
      const res = await demoTradeAction({ side, asset, amount });
      if (res.ok) {
        toast.success("Practice order filled", { description: res.message });
        setInput("");
        router.refresh();
      } else toast.error(res.error);
    });

  const reset = () =>
    start(async () => {
      const res = await demoResetAction();
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="card-raised p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">Practice order</h2>
        <button onClick={reset} disabled={pending} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate transition hover:text-white disabled:opacity-50">
          <RotateCcw className="size-3.5" /> Reset to 10,000
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-ink-950/60 p-1">
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

      <Field label="Coin" className="mt-4">
        <Select value={asset} onChange={(e) => setAsset(e.target.value)}>
          {assets.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.symbol} · {a.name} · {formatPrice(a.price)}
            </option>
          ))}
        </Select>
      </Field>

      <label className="mt-4 block">
        <span className="flex justify-between text-xs text-muted">
          <span>{side === "buy" ? "Practice USDT to spend" : `${asset} to sell`}</span>
          <button type="button" onClick={() => setInput(String(side === "buy" ? Math.floor(available * 100) / 100 : available))} className="num font-medium text-silver hover:text-white">
            Available: {formatAmount(available, side === "buy" ? 2 : 8)} {side === "buy" ? "USDT" : asset}
          </button>
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
          inputMode="decimal"
          placeholder="0.00"
          className={cn(
            "num mt-2 h-13 w-full rounded-xl border bg-ink-950/70 px-4 text-lg font-semibold text-white outline-none transition placeholder:text-muted",
            error ? "border-down/50" : "border-white/10 focus:border-brand-500",
          )}
        />
      </label>

      <p className="mt-3 flex justify-between text-sm">
        <span className="text-slate">You {side === "buy" ? "receive" : "get"} (est.)</span>
        <span className="num font-medium text-white">{estimate ?? "-"}</span>
      </p>
      {error && <p className="mt-2 text-sm text-down">{error}</p>}

      <Button size="lg" variant={side === "buy" ? "success" : "danger"} className="mt-4 w-full" onClick={submit} loading={pending} disabled={!amount || !!error || !price}>
        Practice {side} {asset}
      </Button>
      <p className="mt-3 text-center text-xs text-muted">No real money is used. No fees in demo mode.</p>
    </div>
  );
}
