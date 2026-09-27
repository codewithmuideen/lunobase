import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Lock, Repeat, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPortfolio } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { TRADABLE_ASSETS } from "@/lib/assets";
import type { Deposit, Withdrawal } from "@/lib/types";
import { formatAmount, formatDate, formatPrice, formatUsd } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [portfolio, depRes, wdRes] = await Promise.all([
    getPortfolio(profile.id),
    supabase.from("deposits").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("withdrawals").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const deposits = (depRes.data as Deposit[] | null) ?? [];
  const withdrawals = (wdRes.data as Withdrawal[] | null) ?? [];
  const locked = !profile.withdrawals_enabled && new Date(profile.withdrawal_unlock_at) > new Date();

  const held = new Set(portfolio.holdings.map((h) => h.asset));
  const zero = TRADABLE_ASSETS.filter((a) => !held.has(a.symbol)).slice(0, 6);
  const imgBySymbol = Object.fromEntries(portfolio.markets.map((m) => [m.symbol, m.image]));

  return (
    <>
      <PageHeader
        title="Wallet"
        description="All your balances in one place."
        actions={
          <>
            <ButtonLink href="/dashboard/deposit">
              <ArrowDownToLine className="size-4" /> Deposit
            </ButtonLink>
            <ButtonLink href="/dashboard/withdraw" variant="secondary">
              {locked ? <Lock className="size-4" /> : <ArrowUpFromLine className="size-4" />} Withdraw
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total balance", portfolio.totalValue],
          ["Available", portfolio.availableValue],
          ["On hold (pending withdrawals)", portfolio.lockedValue],
        ].map(([k, v]) => (
          <div key={k as string} className="card p-5">
            <p className="text-sm text-slate">{k as string}</p>
            <p className="num mt-2 font-display text-2xl font-bold text-white">{formatUsd(v as number)}</p>
          </div>
        ))}
      </div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 font-semibold text-white sm:px-6">Balances</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-y border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium sm:px-6">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">On hold</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h) => (
                <tr key={h.asset} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <CoinIcon src={h.image} symbol={h.asset} />
                      <div>
                        <p className="text-sm font-semibold text-white">{h.asset}</p>
                        <p className="text-xs text-muted">
                          {h.name}
                          {h.asset !== "USD" && (
                            <>
                              {" "}
                              · {formatPrice(h.price)} <Change value={h.change24h} className="text-[11px]" />
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-4 py-4 text-right text-sm text-white">{h.asset === "USD" ? formatUsd(h.amount) : formatAmount(h.amount)}</td>
                  <td className="num px-4 py-4 text-right text-sm text-slate">
                    {h.locked > 0 ? (h.asset === "USD" ? formatUsd(h.locked) : formatAmount(h.locked)) : "-"}
                  </td>
                  <td className="num px-4 py-4 text-right text-sm font-semibold text-white">{formatUsd(h.value + h.lockedValue)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex justify-end gap-1.5">
                      <IconLink href={`/dashboard/deposit?asset=${h.asset}`} label="Deposit" icon={ArrowDownToLine} />
                      {h.asset !== "USD" && <IconLink href={`/dashboard/trade?asset=${h.asset}`} label="Trade" icon={Repeat} />}
                      <IconLink href={`/dashboard/withdraw?asset=${h.asset}`} label="Withdraw" icon={locked ? Lock : ArrowUpFromLine} />
                    </div>
                  </td>
                </tr>
              ))}
              {zero.map((a) => (
                <tr key={a.symbol} className="border-b border-white/[0.04] opacity-60 last:border-0">
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <CoinIcon src={imgBySymbol[a.symbol]} symbol={a.symbol} />
                      <div>
                        <p className="text-sm font-semibold text-white">{a.symbol}</p>
                        <p className="text-xs text-muted">{a.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-4 py-3.5 text-right text-sm text-slate">0</td>
                  <td className="px-4 py-3.5 text-right text-sm text-slate">-</td>
                  <td className="num px-4 py-3.5 text-right text-sm text-slate">$0.00</td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex justify-end">
                      <Link href={`/dashboard/trade?asset=${a.symbol}`} className="text-xs font-semibold text-brand-400 hover:text-brand-300">
                        Buy {a.symbol}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentList title="Recent deposits" href="/dashboard/history?tab=deposits" empty="No deposits yet.">
          {deposits.map((d) => (
            <Item key={d.id} left={`${formatAmount(d.amount)} ${d.asset}`} sub={`${d.method === "bank" ? "Bank transfer" : d.network ?? "Crypto"} · ${formatDate(d.created_at)}`} status={d.status} />
          ))}
        </RecentList>
        <RecentList title="Recent withdrawals" href="/dashboard/history?tab=withdrawals" empty="No withdrawals yet.">
          {withdrawals.map((w) => (
            <Item key={w.id} left={`${formatAmount(w.amount)} ${w.asset}`} sub={`${w.destination.slice(0, 18)}… · ${formatDate(w.created_at)}`} status={w.status} />
          ))}
        </RecentList>
      </div>
    </>
  );
}

function IconLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Lock }) {
  return (
    <Link href={href} title={label} aria-label={label} className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-silver transition hover:bg-white/10 hover:text-white">
      <Icon className="size-4" />
    </Link>
  );
}

function RecentList({ title, href, empty, children }: { title: string; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <Link href={href} className="text-sm text-brand-400 hover:text-brand-300">
          View all →
        </Link>
      </div>
      {children.length ? <ul className="mt-3 divide-y divide-white/[0.04]">{children}</ul> : <EmptyState icon={Wallet} title={empty} />}
    </section>
  );
}

function Item({ left, sub, status }: { left: string; sub: string; status: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="num text-sm font-semibold text-white">{left}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
      <StatusBadge status={status} />
    </li>
  );
}
