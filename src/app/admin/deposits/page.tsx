import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { withUsers } from "@/lib/admin-data";
import type { Deposit } from "@/lib/types";
import { formatAmount, formatDate, shortId } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusTabs } from "@/components/admin/status-tabs";
import { DepositReview } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Deposits" };

const TABS = ["pending", "approved", "rejected"];

export default async function AdminDeposits({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = TABS.includes(raw ?? "") ? raw! : "pending";
  const { data } = await createAdminClient()
    .from("deposits")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(200);
  const rows = await withUsers((data as Deposit[] | null) ?? []);

  return (
    <>
      <PageHeader title="Deposits" description="Confirm incoming payments. Approving credits the user's wallet instantly." />
      <StatusTabs base="/admin/deposits" current={status} tabs={TABS} />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">{status === "pending" ? "Action" : "Reviewed"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3.5 text-slate">
                    {formatDate(d.created_at)}
                    <span className="block font-mono text-[11px] text-muted">{shortId(d.id)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/users/${d.user_id}`} className="text-white hover:text-brand-300">
                      {d.user?.full_name ?? "-"}
                      <span className="block text-xs text-slate">{d.user?.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-slate">{d.method === "bank" ? "Bank transfer" : `Crypto · ${d.network ?? ""}`}</td>
                  <td className="num px-4 py-3.5 text-right font-semibold text-white">
                    {formatAmount(d.credited ?? d.amount)} {d.asset}
                  </td>
                  <td className="max-w-[220px] break-all px-4 py-3.5 font-mono text-xs text-silver">{d.reference}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={d.status} />
                    {d.admin_note && <span className="mt-1 block text-xs text-muted">{d.admin_note}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {d.status === "pending" ? (
                      <DepositReview id={d.id} amount={Number(d.amount)} asset={d.asset} email={d.user?.email ?? ""} />
                    ) : (
                      <span className="text-xs text-slate">{d.reviewed_at ? formatDate(d.reviewed_at) : "-"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate">
                    No {status} deposits.
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
