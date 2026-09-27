import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { withUsers } from "@/lib/admin-data";
import type { Ticket } from "@/lib/types";
import { shortId, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusTabs } from "@/components/admin/status-tabs";
import { Badge, StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Support" };

const TABS = ["open", "answered", "closed"];

export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = TABS.includes(raw ?? "") ? raw! : "open";
  const { data } = await createAdminClient()
    .from("support_tickets")
    .select("*")
    .eq("status", status)
    .order("updated_at", { ascending: status === "open" })
    .limit(200);
  const rows = await withUsers((data as Ticket[] | null) ?? []);

  return (
    <>
      <PageHeader title="Support tickets" description="Withdrawal-access requests and customer questions." />
      <StatusTabs base="/admin/tickets" current={status} tabs={TABS} />
      <div className="card overflow-hidden">
        <ul className="divide-y divide-white/[0.04]">
          {rows.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/tickets/${t.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{t.subject}</p>
                  <p className="text-xs text-slate">
                    #{shortId(t.id)} · {t.user?.email ?? "-"} · updated {timeAgo(t.updated_at)}
                  </p>
                </div>
                <Badge tone={t.category === "withdrawal" || t.category === "security" ? "warning" : "neutral"}>{t.category}</Badge>
                <StatusBadge status={t.status} />
              </Link>
            </li>
          ))}
          {rows.length === 0 && <li className="px-5 py-14 text-center text-sm text-slate">No {status} tickets.</li>}
        </ul>
      </div>
    </>
  );
}
