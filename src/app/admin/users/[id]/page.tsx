import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTradablePrices } from "@/lib/market";
import { describeDevice } from "@/lib/security/request";
import type { Balance, Deposit, LedgerEntry, Profile, SecurityEvent, Withdrawal } from "@/lib/types";
import { formatAmount, formatDate, formatUsd, shortId } from "@/lib/utils";
import { ActivityList } from "@/components/dashboard/activity-list";
import { AdjustBalanceForm, UserControls } from "@/components/admin/user-controls";
import { Badge, StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "User" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  const user = p as Profile | null;
  if (!user) notFound();

  const [bal, ledger, deps, wds, events, prices] = await Promise.all([
    db.from("balances").select("*").eq("user_id", id),
    db.from("ledger").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(15),
    db.from("deposits").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(8),
    db.from("withdrawals").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(8),
    db.from("security_events").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
    getTradablePrices(),
  ]);
  const balances = ((bal.data as Balance[] | null) ?? []).filter((b) => Number(b.amount) > 0 || Number(b.locked) > 0 || b.asset === "USD");
  const total = balances.reduce((s, b) => s + (Number(b.amount) + Number(b.locked)) * (prices[b.asset] ?? 0), 0);

  return (
    <>
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-white">
        <ArrowLeft className="size-4" /> All users
      </Link>
      <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-2xl font-bold text-white sm:text-3xl">
            {user.full_name ?? user.email}
            <StatusBadge status={user.status} />
            {user.role === "admin" && <Badge tone="brand">admin</Badge>}
          </h1>
          <p className="mt-1 text-sm text-slate">
            {user.email} · LB-{shortId(user.id)} · {user.country ?? "-"} · joined {formatDate(user.created_at, false)}
          </p>
        </div>
        <div className="card px-5 py-3 text-right">
          <p className="text-xs text-muted">Portfolio value</p>
          <p className="num font-display text-2xl font-bold text-white">{formatUsd(total)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Account controls</h2>
            <div className="mt-5">
              <UserControls user={user} />
            </div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Credit / debit balance</h2>
            <p className="mt-1 text-sm text-slate">The user&apos;s dashboard updates instantly. Every adjustment is written to the ledger and audit log.</p>
            <div className="mt-5">
              <AdjustBalanceForm userId={user.id} />
            </div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Ledger</h2>
            {(ledger.data ?? []).length ? <ActivityList entries={ledger.data as LedgerEntry[]} /> : <p className="py-6 text-sm text-slate">No activity.</p>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Balances</h2>
            <ul className="mt-3 divide-y divide-white/[0.04]">
              {balances.map((b) => (
                <li key={b.asset} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-white">{b.asset}</span>
                  <span className="text-right">
                    <span className="num block text-white">{formatAmount(b.amount)}</span>
                    {Number(b.locked) > 0 && <span className="num block text-xs text-warn">{formatAmount(b.locked)} on hold</span>}
                    <span className="num block text-xs text-muted">{formatUsd((Number(b.amount) + Number(b.locked)) * (prices[b.asset] ?? 0))}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <MiniList title="Deposits" rows={((deps.data as Deposit[] | null) ?? []).map((d) => [`${formatAmount(d.amount)} ${d.asset}`, formatDate(d.created_at), d.status])} />
          <MiniList title="Withdrawals" rows={((wds.data as Withdrawal[] | null) ?? []).map((w) => [`${formatAmount(w.amount)} ${w.asset}`, formatDate(w.created_at), w.status])} />
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Security events</h2>
            <ul className="mt-3 divide-y divide-white/[0.04] text-sm">
              {((events.data as SecurityEvent[] | null) ?? []).map((e) => (
                <li key={e.id} className="py-2.5">
                  <p className="font-medium text-white">{e.event.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">
                    {e.ip ?? "-"} · {e.user_agent ? describeDevice(e.user_agent) : "-"} · {formatDate(e.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function MiniList({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-slate">None.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.04]">
          {rows.map(([a, b, s], i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="num block text-sm font-semibold text-white">{a}</span>
                <span className="text-xs text-muted">{b}</span>
              </span>
              <StatusBadge status={s} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
