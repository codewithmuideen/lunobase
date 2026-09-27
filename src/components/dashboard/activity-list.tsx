import { ArrowDownLeft, ArrowUpRight, Coins, Lock, RotateCcw, Settings2, Undo2 } from "lucide-react";
import type { LedgerEntry } from "@/lib/types";
import { cn, formatAmount, formatDate } from "@/lib/utils";

const META: Record<LedgerEntry["type"], { label: string; icon: typeof Coins; tone: string }> = {
  deposit: { label: "Deposit", icon: ArrowDownLeft, tone: "bg-up/10 text-up" },
  trade_buy: { label: "Buy", icon: Coins, tone: "bg-brand-500/15 text-brand-300" },
  trade_sell: { label: "Sell", icon: RotateCcw, tone: "bg-brand-500/15 text-brand-300" },
  fee: { label: "Trading fee", icon: Settings2, tone: "bg-white/5 text-slate" },
  withdrawal_hold: { label: "Withdrawal on hold", icon: Lock, tone: "bg-warn/10 text-warn" },
  withdrawal: { label: "Withdrawal sent", icon: ArrowUpRight, tone: "bg-white/5 text-silver" },
  withdrawal_refund: { label: "Withdrawal returned", icon: Undo2, tone: "bg-up/10 text-up" },
  adjustment: { label: "Adjustment", icon: Settings2, tone: "bg-white/5 text-silver" },
};

export function ActivityList({ entries, compact }: { entries: LedgerEntry[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-white/[0.04]">
      {entries.map((e) => {
        const m = META[e.type];
        const amt = Number(e.amount);
        const Icon = m.icon;
        return (
          <li key={e.id} className="flex items-center gap-3 py-3">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", m.tone)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {m.label} {e.type !== "fee" && e.asset !== "USD" ? e.asset : ""}
              </p>
              <p className="truncate text-xs text-muted">{compact ? formatDate(e.created_at) : (e.memo ?? formatDate(e.created_at))}</p>
            </div>
            <div className="text-right">
              {amt !== 0 && (
                <p className={cn("num text-sm font-semibold", amt > 0 ? "text-up" : "text-white")}>
                  {amt > 0 ? "+" : "−"}
                  {e.asset === "USD" ? `$${formatAmount(Math.abs(amt), 2)}` : `${formatAmount(Math.abs(amt))} ${e.asset}`}
                </p>
              )}
              {!compact && <p className="text-xs text-muted">{formatDate(e.created_at)}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
