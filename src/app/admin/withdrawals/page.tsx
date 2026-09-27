import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { withUsers } from "@/lib/admin-data";
import type { Withdrawal } from "@/lib/types";
import { formatAmount, formatDate, shortId } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusTabs } from "@/components/admin/status-tabs";
import { WithdrawalReview } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Withdrawals" };

const TABS = ["pending", "completed", "rejected"];

export default async function AdminWithdrawals({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = TABS.includes(raw ?? "") ? raw! : "pending";
  const { data } = await createAdminClient()
    .from("withdrawals")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(200);
  const rows = await withUsers((data as Withdrawal[] | null) ?? []);

  return (
    <>
      <PageHeader
        title="Withdrawals"
        description="Funds are already on hold. Send the payment externally, then mark it completed with the transaction reference."
      />
      <StatusTabs base="/admin/withdrawals" current={status} tabs={TABS} />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Network</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">{status === "pending" ? "Action" : "Reviewed"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3.5 text-slate">
                    {formatDate(w.created_at)}
                    <span className="block font-mono text-[11px] text-muted">{shortId(w.id)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/users/${w.user_id}`} className="text-white hover:text-brand-300">
                      {w.user?.full_name ?? "-"}
                      <span className="block text-xs text-slate">{w.user?.email}</span>
                    </Link>
                  </td>
                  <td className="num px-4 py-3.5 text-right font-semibold text-white">
                    {formatAmount(w.amount)} {w.asset}
                  </td>
                  <td className="px-4 py-3.5 text-slate">{w.network ?? "-"}</td>
                  <td className="max-w-[240px] break-all px-4 py-3.5 font-mono text-xs text-silver">{w.destination}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={w.status} />
                    {w.tx_hash && <span className="mt-1 block max-w-[160px] truncate font-mono text-[11px] text-brand-300">{w.tx_hash}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {w.status === "pending" ? (
                      <WithdrawalReview id={w.id} amount={Number(w.amount)} asset={w.asset} destination={w.destination} />
                    ) : (
                      <span className="text-xs text-slate">{w.reviewed_at ? formatDate(w.reviewed_at) : "-"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate">
                    No {status} withdrawals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
