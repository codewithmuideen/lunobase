import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata = { title: "Audit log" };

type Row = { id: string; admin_id: string | null; action: string; target_user: string | null; details: Record<string, unknown>; created_at: string };

export default async function AuditPage() {
  const db = createAdminClient();
  const { data } = await db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data as Row[] | null) ?? [];
  const ids = [...new Set(rows.flatMap((r) => [r.admin_id, r.target_user]).filter(Boolean) as string[])];
  const { data: people } = ids.length ? await db.from("profiles").select("id, email").in("id", ids) : { data: [] };
  const email = new Map(((people as { id: string; email: string }[] | null) ?? []).map((p) => [p.id, p.email]));

  return (
    <>
      <PageHeader title="Audit log" description="Every administrative action, permanently recorded." />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04] align-top last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-slate">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-white">{r.admin_id ? email.get(r.admin_id) ?? "-" : "system"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-300">{r.action}</td>
                  <td className="px-4 py-3">
                    {r.target_user ? (
                      <Link href={`/admin/users/${r.target_user}`} className="text-white hover:text-brand-300">
                        {email.get(r.target_user) ?? "-"}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="max-w-[420px] px-5 py-3">
                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-slate">{JSON.stringify(r.details)}</pre>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-slate">
                    No admin actions recorded yet.
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
