import Link from "next/link";
import { Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Users" };

const FILTERS = ["all", "active", "frozen", "suspended", "admin"] as const;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const f = FILTERS.includes(sp.f as (typeof FILTERS)[number]) ? sp.f! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const size = 25;

  let query = createAdminClient()
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
  }
  if (f === "admin") query = query.eq("role", "admin");
  else if (f !== "all") query = query.eq("status", f);

  const { data, count } = await query;
  const users = (data as Profile[] | null) ?? [];
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const qs = (p: Record<string, string | number>) => new URLSearchParams({ ...(q && { q }), f, page: String(page), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) }).toString();

  return (
    <>
      <PageHeader title="Users" description={`${count ?? 0} accounts`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((x) => (
            <Link
              key={x}
              href={`/admin/users?${qs({ f: x, page: 1 })}`}
              className={cn("rounded-lg px-3.5 py-2 text-sm font-medium capitalize", f === x ? "bg-white/[0.08] text-white" : "text-slate hover:text-white")}
            >
              {x}
            </Link>
          ))}
        </div>
        <form className="relative sm:w-80">
          <input type="hidden" name="f" value={f} />
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            className="h-10 w-full rounded-xl border border-white/10 bg-ink-950/60 pl-10 pr-3 text-sm text-white outline-none focus:border-brand-500"
          />
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/5 text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Withdrawals</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const locked = !u.withdrawals_enabled && new Date(u.withdrawal_unlock_at) > new Date();
                return (
                  <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/users/${u.id}`} className="block">
                        <span className="flex items-center gap-2 font-semibold text-white">
                          {u.full_name ?? "-"} {u.role === "admin" && <Badge tone="brand">admin</Badge>}
                        </span>
                        <span className="text-xs text-slate">{u.email}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate">{u.country ?? "-"}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {locked ? <span className="text-warn">Locked until {formatDate(u.withdrawal_unlock_at, false)}</span> : <span className="text-up">Enabled</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate">{formatDate(u.created_at, false)}</td>
                    <td className="px-5 py-3.5 text-slate">{u.last_login_at ? timeAgo(u.last_login_at) : "Never"}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/users?${qs({ page: page - 1 })}`} className="rounded-lg bg-white/[0.05] px-3 py-1.5 hover:text-white">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={`/admin/users?${qs({ page: page + 1 })}`} className="rounded-lg bg-white/[0.05] px-3 py-1.5 hover:text-white">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
