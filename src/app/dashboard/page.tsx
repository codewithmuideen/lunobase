import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Clock, History, Lock, Unlock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPortfolio } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ASSET_BY_ID } from "@/lib/assets";
import type { Deposit, LedgerEntry } from "@/lib/types";
import { cn, formatAmount, formatDate, formatPrice, formatUsd } from "@/lib/utils";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { AllocationDonut } from "@/components/dashboard/charts";
import { ActivityList } from "@/components/dashboard/activity-list";
import { EmptyState } from "@/components/dashboard/page-header";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { Sparkline } from "@/components/market/sparkline";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [portfolio, ledgerRes, pendingRes] = await Promise.all([
    getPortfolio(profile.id),
    supabase.from("ledger").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(7),
    supabase.from("deposits").select("*").eq("user_id", profile.id).eq("status", "pending").order("created_at", { ascending: false }),
  ]);
  const ledger = (ledgerRes.data as LedgerEntry[] | null) ?? [];
  const pending = (pendingRes.data as Deposit[] | null) ?? [];

  const unlockAt = new Date(profile.withdrawal_unlock_at);
  const withdrawLocked = !profile.withdrawals_enabled && unlockAt > new Date();
  const daysLeft = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 86_400_000));

  const movers = portfolio.markets
    .filter((m) => ASSET_BY_ID[m.id])
    .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
    .slice(0, 5);

  const crypto = portfolio.holdings.filter((h) => h.asset !== "USD");
  const firstName = profile.full_name?.split(" ")[0];

  const checklist = [
    { done: true, label: "Verify your email" },
    { done: true, label: "Enable login verification" },
    { done: !!profile.anti_phishing_code, label: "Set an anti-phishing code", href: "/dashboard/security" },
    { done: ledger.some((l) => l.type === "deposit"), label: "Make your first deposit", href: "/dashboard/deposit" },
    { done: ledger.some((l) => l.type === "trade_buy"), label: "Buy your first crypto", href: "/dashboard/trade" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate">Here&apos;s what&apos;s happening with your portfolio today.</p>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-warn/20 bg-warn/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Clock className="size-5 shrink-0 text-warn" />
            <p className="text-sm text-silver">
              <span className="font-semibold text-white">
                {pending.length} deposit{pending.length > 1 ? "s" : ""} awaiting confirmation
              </span>{" "}
              · {pending.map((d) => `${formatAmount(d.amount)} ${d.asset}`).join(", ")}. Your balance updates automatically once confirmed.
            </p>
          </div>
          <StatusBadge status="pending" />
        </div>
      )}

      <BalanceCard
        total={portfolio.totalValue}
        available={portfolio.availableValue}
        onHold={portfolio.lockedValue}
        cash={portfolio.cash}
        change24hUsd={portfolio.change24hUsd}
        change24hPct={portfolio.change24hPct}
        history={portfolio.history}
        withdrawLocked={withdrawLocked}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Holdings */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-6">
            <h2 className="font-semibold text-white">Your assets</h2>
            <Link href="/dashboard/wallet" className="text-sm text-brand-400 hover:text-brand-300">
              Wallet →
            </Link>
          </div>
          {crypto.length === 0 && portfolio.cash === 0 ? (
            <EmptyState
              icon={History}
              title="Your portfolio is empty"
              text="Deposit funds to buy your first crypto. Your balance updates live as soon as your deposit is confirmed."
              action={<ButtonLink href="/dashboard/deposit">Deposit funds</ButtonLink>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-muted">
                    <th className="px-5 py-3 font-medium sm:px-6">Asset</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Holdings</th>
                    <th className="hidden px-4 py-3 text-right font-medium md:table-cell">P&amp;L</th>
                    <th className="hidden px-5 py-3 text-right font-medium sm:table-cell sm:px-6">7d</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h) => (
                    <tr key={h.asset} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 sm:px-6">
                        <Link href={h.asset === "USD" ? "/dashboard/wallet" : `/dashboard/trade?asset=${h.asset}`} className="flex items-center gap-3">
                          <CoinIcon src={h.image} symbol={h.asset} />
                          <span>
                            <span className="block text-sm font-semibold text-white">{h.name}</span>
                            <span className="text-xs text-muted">{h.asset}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="num text-sm text-white">{formatPrice(h.price)}</p>
                        {h.asset !== "USD" && <Change value={h.change24h} className="text-xs" />}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="num text-sm font-semibold text-white">{formatUsd(h.value + h.lockedValue)}</p>
                        <p className="num text-xs text-muted">
                          {h.asset === "USD" ? `${h.allocation.toFixed(1)}%` : `${formatAmount(h.amount + h.locked)} ${h.asset}`}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3.5 text-right md:table-cell">
                        {h.asset === "USD" || !h.avgCost ? (
                          <span className="text-xs text-muted">-</span>
                        ) : (
                          <>
                            <p className={cn("num text-sm font-medium", h.pnl >= 0 ? "text-up" : "text-down")}>
                              {h.pnl >= 0 ? "+" : "−"}
                              {formatUsd(Math.abs(h.pnl))}
                            </p>
                            <Change value={h.pnlPct} className="text-xs" />
                          </>
                        )}
                      </td>
                      <td className="hidden px-5 py-2 sm:table-cell sm:px-6">
                        <div className="flex justify-end">{h.asset !== "USD" && <Sparkline data={h.sparkline} width={96} height={32} />}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Allocation */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-white">Allocation</h2>
          <div className="mt-5">
            <AllocationDonut slices={portfolio.holdings.map((h) => ({ label: h.asset, value: h.value + h.lockedValue }))} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity */}
        <section className="card p-5 sm:p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent activity</h2>
            <Link href="/dashboard/history" className="text-sm text-brand-400 hover:text-brand-300">
              All →
            </Link>
          </div>
          {ledger.length ? (
            <div className="mt-2">
              <ActivityList entries={ledger} compact />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate">No activity yet.</p>
          )}
        </section>

        {/* Movers */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Top movers today</h2>
            <Link href="/dashboard/markets" className="text-sm text-brand-400 hover:text-brand-300">
              Markets →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-white/[0.04]">
            {movers.map((m) => (
              <li key={m.id}>
                <Link href={`/dashboard/trade?asset=${m.symbol}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="flex items-center gap-3">
                    <CoinIcon src={m.image} symbol={m.symbol} />
                    <span>
                      <span className="block text-sm font-semibold text-white">{m.symbol}</span>
                      <span className="text-xs text-muted">{m.name}</span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="num block text-sm text-white">{formatPrice(m.current_price)}</span>
                    <Change value={m.price_change_percentage_24h} className="text-xs" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Account status */}
        <section className="space-y-6">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-10 place-items-center rounded-xl", withdrawLocked ? "bg-warn/10 text-warn" : "bg-up/10 text-up")}>
                {withdrawLocked ? <Lock className="size-5" /> : <Unlock className="size-5" />}
              </span>
              <div>
                <p className="font-semibold text-white">{withdrawLocked ? "Withdrawals locked" : "Withdrawals available"}</p>
                <p className="text-xs text-slate">
                  {withdrawLocked ? `Unlocks ${formatDate(unlockAt, false)} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Every withdrawal is reviewed for your safety."}
                </p>
              </div>
            </div>
            <Link
              href={withdrawLocked ? "/dashboard/support?new=withdrawal" : "/dashboard/withdraw"}
              className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-silver transition hover:bg-white/[0.07] hover:text-white"
            >
              {withdrawLocked ? "Need access sooner? Contact support" : "Request a withdrawal"} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Getting started</p>
              <span className="num text-xs text-slate">
                {doneCount}/{checklist.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label}>
                  {c.done || !c.href ? (
                    <span className={cn("flex items-center gap-2.5 text-sm", c.done ? "text-slate line-through decoration-white/20" : "text-silver")}>
                      {c.done ? <CheckCircle2 className="size-4 text-up" /> : <Circle className="size-4 text-muted" />} {c.label}
                    </span>
                  ) : (
                    <Link href={c.href} className="flex items-center gap-2.5 text-sm text-white hover:text-brand-300">
                      <Circle className="size-4 text-muted" /> {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
