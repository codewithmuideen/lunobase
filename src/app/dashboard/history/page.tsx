import Link from "next/link";
import { History } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Deposit, LedgerEntry, Trade, Withdrawal } from "@/lib/types";
import { cn, formatAmount, formatDate, formatPrice, formatUsd, shortId } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { ActivityList } from "@/components/dashboard/activity-list";
import { CsvButton } from "@/components/dashboard/csv-button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "History" };

const TABS = [
  { id: "activity", label: "All activity" },
  { id: "trades", label: "Trades" },
  { id: "deposits", label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { profile } = await requireUser();
  const { tab: rawTab } = await searchParams;
  const tab: TabId = (TABS.find((t) => t.id === rawTab)?.id ?? "activity") as TabId;
  const supabase = await createClient();
  const table = tab === "activity" ? "ledger" : tab;
  const { data } = await supabase.from(table).select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown[];

  const csvRows: Record<string, unknown>[] =
    tab === "activity"
      ? (rows as LedgerEntry[]).map((r) => ({ date: r.created_at, type: r.type, asset: r.asset, amount: r.amount, balance_after: r.balance_after, memo: r.memo }))
      : tab === "trades"
        ? (rows as Trade[]).map((r) => ({ date: r.created_at, side: r.side, asset: r.asset, quantity: r.quantity, price: r.price, gross_usd: r.gross_usd, fee_usd: r.fee_usd }))
        : tab === "deposits"
          ? (rows as Deposit[]).map((r) => ({ date: r.created_at, id: r.id, method: r.method, asset: r.asset, amount: r.amount, credited: r.credited, status: r.status, reference: r.reference }))
          : (rows as Withdrawal[]).map((r) => ({ date: r.created_at, id: r.id, asset: r.asset, network: r.network, amount: r.amount, destination: r.destination, status: r.status, tx_hash: r.tx_hash }));

  return (
    <>
      <PageHeader title="History" description="Every movement in your account, permanently recorded." actions={<CsvButton rows={csvRows} filename={`lunobase-${tab}.csv`} />} />
      <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/history?tab=${t.id}`}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-white/[0.08] text-white" : "text-slate hover:text-white",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={History} title="Nothing here yet" text="Your transactions will appear here as soon as you make them." />
        ) : tab === "activity" ? (
          <div className="px-5 sm:px-6">
            <ActivityList entries={rows as LedgerEntry[]} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/5 text-xs text-muted">
                {tab === "trades" ? (
                  <tr>
                    <Th>Date</Th>
                    <Th>Pair</Th>
                    <Th>Side</Th>
                    <Th right>Price</Th>
                    <Th right>Quantity</Th>
                    <Th right>Fee</Th>
                    <Th right>Total</Th>
                  </tr>
                ) : (
                  <tr>
                    <Th>Date</Th>
                    <Th>ID</Th>
                    <Th>Asset</Th>
                    <Th right>Amount</Th>
                    <Th>{tab === "deposits" ? "Method / reference" : "Destination"}</Th>
                    <Th>Status</Th>
                  </tr>
                )}
              </thead>
              <tbody>
                {tab === "trades" &&
                  (rows as Trade[]).map((t) => (
                    <tr key={t.id} className="border-b border-white/[0.04] last:border-0">
                      <Td muted>{formatDate(t.created_at)}</Td>
                      <Td>{t.asset}/USD</Td>
                      <Td className={cn("font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>{t.side}</Td>
                      <Td right>{formatPrice(Number(t.price))}</Td>
                      <Td right>{formatAmount(t.quantity)}</Td>
                      <Td right muted>
                        {formatUsd(t.fee_usd)}
                      </Td>
                      <Td right className="font-semibold">
                        {formatUsd(t.side === "buy" ? Number(t.gross_usd) + Number(t.fee_usd) : Number(t.gross_usd) - Number(t.fee_usd))}
                      </Td>
                    </tr>
                  ))}
                {tab === "deposits" &&
                  (rows as Deposit[]).map((d) => (
                    <tr key={d.id} className="border-b border-white/[0.04] last:border-0">
                      <Td muted>{formatDate(d.created_at)}</Td>
                      <Td muted className="font-mono text-xs">
                        {shortId(d.id)}
                      </Td>
                      <Td>{d.asset}</Td>
                      <Td right>{formatAmount(d.credited ?? d.amount)}</Td>
                      <Td muted className="max-w-[240px] truncate">
                        {d.method === "bank" ? "Bank" : d.network} · {d.reference}
                      </Td>
                      <Td>
                        <StatusBadge status={d.status} />
                      </Td>
                    </tr>
                  ))}
                {tab === "withdrawals" &&
                  (rows as Withdrawal[]).map((w) => (
                    <tr key={w.id} className="border-b border-white/[0.04] last:border-0">
                      <Td muted>{formatDate(w.created_at)}</Td>
                      <Td muted className="font-mono text-xs">
                        {shortId(w.id)}
                      </Td>
                      <Td>{w.asset}</Td>
                      <Td right>{formatAmount(w.amount)}</Td>
                      <Td muted className="max-w-[240px] truncate font-mono text-xs">
                        {w.destination}
                      </Td>
                      <Td>
                        <StatusBadge status={w.status} />
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn("px-5 py-3 font-medium", right && "text-right")}>{children}</th>;
}

function Td({ children, right, muted, className }: { children: React.ReactNode; right?: boolean; muted?: boolean; className?: string }) {
  return <td className={cn("num px-5 py-3.5", right && "text-right", muted ? "text-slate" : "text-white", className)}>{children}</td>;
}
