"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Eye, EyeOff, Lock, Repeat } from "lucide-react";
import { cn, formatUsd } from "@/lib/utils";
import { PortfolioChart } from "./charts";
import { hasConsent } from "@/lib/consent";

export function BalanceCard({
  total,
  available,
  onHold,
  cash,
  change24hUsd,
  change24hPct,
  history,
  withdrawLocked,
}: {
  total: number;
  available: number;
  onHold: number;
  cash: number;
  change24hUsd: number;
  change24hPct: number;
  history: { t: number; v: number }[];
  withdrawLocked: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem("lb-hide-balance") === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = () => {
    setHidden((h) => {
      try {
        if (hasConsent("preferences")) localStorage.setItem("lb-hide-balance", h ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !h;
    });
  };

  const mask = (s: string) => (hidden ? "••••••" : s);
  const up = change24hUsd >= 0;

  return (
    <div className="card-raised relative overflow-hidden p-6 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm text-slate">
            Total balance
            <button onClick={toggle} className="rounded-md p-1 text-muted hover:text-white" aria-label={hidden ? "Show balance" : "Hide balance"}>
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="num mt-2 font-display break-words text-[32px] font-bold leading-tight tracking-tight text-white min-[380px]:text-4xl sm:text-5xl">{mask(formatUsd(total))}</p>
          <p className={cn("num mt-2 text-sm font-medium", up ? "text-up" : "text-down")}>
            {mask(`${up ? "+" : "−"}${formatUsd(Math.abs(change24hUsd))}`)} ({up ? "+" : ""}
            {change24hPct.toFixed(2)}%) <span className="font-normal text-muted">today</span>
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-white/5 pt-5 text-sm min-[420px]:grid-cols-3 [&>div]:min-w-0 [&_dd]:break-words">
            <div>
              <dt className="text-xs text-muted">Available</dt>
              <dd className="num mt-1 font-semibold text-white">{mask(formatUsd(available))}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">USDT balance</dt>
              <dd className="num mt-1 font-semibold text-white">{mask(formatUsd(cash))}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">On hold</dt>
              <dd className="num mt-1 font-semibold text-white">{mask(formatUsd(onHold))}</dd>
            </div>
          </dl>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Action href="/dashboard/deposit" icon={ArrowDownToLine} label="Deposit" primary />
            <Action href="/dashboard/trade" icon={Repeat} label="Trade" />
            <Action href="/dashboard/withdraw" icon={withdrawLocked ? Lock : ArrowUpFromLine} label="Withdraw" />
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <p className="mb-2 text-xs text-muted">Value of current holdings · last 7 days</p>
          <PortfolioChart data={history} />
        </div>
      </div>
    </div>
  );
}

function Action({
  href,
  icon: Icon,
  label,
  primary,
}: {
  href: string;
  icon: typeof Lock;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-semibold transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm",
        primary ? "bg-brand-600 text-white hover:bg-[#1a63ff]" : "bg-white/[0.06] text-white hover:bg-white/10",
      )}
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}
