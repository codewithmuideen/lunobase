import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { withUsers } from "@/lib/admin-data";
import type { Trade } from "@/lib/types";
import { cn, formatAmount, formatDate, formatPrice, formatUsd } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata = { title: "Trades" };

export default async function AdminTrades() {
  const { data } = await createAdminClient().from("trades").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = await withUsers((data as Trade[] | null) ?? []);
  const fees = rows.reduce((s, t) => s + Number(t.fee_usd), 0);
  const volume = rows.reduce((s, t) => s + Number(t.gross_usd), 0);

  return (
    <>
      <PageHeader title="Trades" description={`Latest ${rows.length} orders · ${formatUsd(volume)} volume · ${formatUsd(fees)} fees`} />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Side</th>
                <th className="px-4 py-3 font-medium">Pair</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Gross</th>
                <th className="px-5 py-3 text-right font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3 text-slate">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${t.user_id}`} className="text-white hover:text-brand-300">
                      {t.user?.email ?? "-"}
                    </Link>
                  </td>
                  <td className={cn("px-4 py-3 font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>{t.side}</td>
                  <td className="px-4 py-3 text-white">
                    {t.asset}/{t.quote ?? "USD"}
                  </td>
                  <td className="num px-4 py-3 text-right text-white">{formatAmount(t.quantity)}</td>
                  <td className="num px-4 py-3 text-right text-slate">{formatPrice(Number(t.price))}</td>
                  <td className="num px-4 py-3 text-right text-white">{formatUsd(t.gross_usd)}</td>
                  <td className="num px-5 py-3 text-right text-slate">{formatUsd(t.fee_usd)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-slate">
                    No trades yet.
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
