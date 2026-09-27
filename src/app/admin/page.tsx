import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, CandlestickChart, Coins, LifeBuoy, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTradablePrices } from "@/lib/market";
import { withUsers } from "@/lib/admin-data";
import type { Deposit, Profile, Trade, Withdrawal } from "@/lib/types";
import { formatAmount, formatUsd, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { DailyBars } from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const db = createAdminClient();
  const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const since1 = new Date(Date.now() - 86_400_000).toISOString();

  const [usersCount, newUsers, balancesRes, tradesRes, pendingDep, pendingWd, openTickets, recentUsers, prices] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since7),
    db.from("balances").select("asset, amount, locked"),
    db.from("trades").select("gross_usd, created_at").gte("created_at", since14),
    db.from("deposits").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(6),
    db.from("withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(6),
    db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    db.from("profiles").select("id, email, full_name, country, created_at").order("created_at", { ascending: false }).limit(6),
    getTradablePrices(),
  ]);

  // Assets under custody, valued at live prices
  let aum = 0;
  for (const b of (balancesRes.data as { asset: string; amount: string; locked: string }[] | null) ?? []) {
    aum += (Number(b.amount) + Number(b.locked)) * (prices[b.asset] ?? 0);
  }

  // Daily trade volume (last 14 days, UTC)
  const trades = (tradesRes.data as Pick<Trade, "gross_usd" | "created_at">[] | null) ?? [];
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const volByDay = Object.fromEntries(days.map((d) => [d, 0]));
  let vol24 = 0;
  for (const t of trades) {
    const day = t.created_at.slice(0, 10);
    if (day in volByDay) volByDay[day] += Number(t.gross_usd);
    if (t.created_at >= since1) vol24 += Number(t.gross_usd);
  }
  const volume = days.map((d) => ({ day: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: volByDay[d] }));

  const deposits = await withUsers((pendingDep.data as Deposit[] | null) ?? []);
  const withdrawals = await withUsers((pendingWd.data as Withdrawal[] | null) ?? []);

  const kpis = [
    { label: "Total users", value: String(usersCount.count ?? 0), sub: `+${newUsers.count ?? 0} this week`, icon: Users, href: "/admin/users" },
    { label: "Assets under custody", value: formatUsd(aum, { compact: true }), sub: "At live prices", icon: Coins, href: "/admin/users" },
    { label: "24h trade volume", value: formatUsd(vol24, { compact: true }), sub: `${trades.length} trades in 14d`, icon: CandlestickChart, href: "/admin/trades" },
    { label: "Pending deposits", value: String(deposits.length), sub: "Awaiting confirmation", icon: ArrowDownToLine, href: "/admin/deposits" },
    { label: "Pending withdrawals", value: String(withdrawals.length), sub: "Awaiting review", icon: ArrowUpFromLine, href: "/admin/withdrawals" },
    { label: "Open tickets", value: String(openTickets.count ?? 0), sub: "Need a reply", icon: LifeBuoy, href: "/admin/tickets" },
  ];

  return (
    <>
      <PageHeader title="Admin overview" description="Platform health and everything that needs your attention." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href} className="card group p-5 transition hover:border-brand-500/25">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate">{label}</p>
              <Icon className="size-4 text-muted group-hover:text-brand-400" />
            </div>
            <p className="num mt-3 font-display text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </Link>
        ))}
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="font-semibold text-white">Trade volume · last 14 days</h2>
        <div className="mt-5">
          <DailyBars data={volume} label="Volume" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Queue title="Deposit queue" href="/admin/deposits" empty="No pending deposits.">
          {deposits.map((d) => (
            <QueueItem key={d.id} top={`${formatAmount(d.amount)} ${d.asset}`} sub={`${d.user?.email ?? "-"} · ${timeAgo(d.created_at)}`} />
          ))}
        </Queue>
        <Queue title="Withdrawal queue" href="/admin/withdrawals" empty="No pending withdrawals.">
          {withdrawals.map((w) => (
            <QueueItem key={w.id} top={`${formatAmount(w.amount)} ${w.asset}`} sub={`${w.user?.email ?? "-"} · ${timeAgo(w.created_at)}`} />
          ))}
        </Queue>
        <Queue title="Newest users" href="/admin/users" empty="No users yet.">
          {((recentUsers.data as Pick<Profile, "id" | "email" | "full_name" | "country" | "created_at">[] | null) ?? []).map((u) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{u.full_name ?? u.email}</p>
                  <p className="truncate text-xs text-muted">
                    {u.email} · {u.country ?? "-"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">{timeAgo(u.created_at)}</span>
              </Link>
            </li>
          ))}
        </Queue>
      </div>
    </>
  );
}

function Queue({ title, href, empty, children }: { title: string; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <Link href={href} className="text-sm text-brand-400 hover:text-brand-300">
          Open →
        </Link>
      </div>
      {children.length ? <ul className="mt-2 divide-y divide-white/[0.04]">{children}</ul> : <p className="py-8 text-center text-sm text-slate">{empty}</p>}
    </section>
  );
}

function QueueItem({ top, sub }: { top: string; sub: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="num text-sm font-semibold text-white">{top}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
      <StatusBadge status="pending" />
    </li>
  );
}
