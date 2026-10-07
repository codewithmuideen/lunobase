import { createAdminClient } from "@/lib/supabase/admin";
import { LNC, formatLnc, lncTier } from "@/lib/lunocoin";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { LncGrant } from "@/components/admin/lnc-grant";

export const metadata = { title: "LunoCoin" };

export default async function AdminLncPage() {
  const db = createAdminClient();
  const [balRes, recentRes, waitRes] = await Promise.all([
    db.from("lnc_balances").select("user_id, amount").gt("amount", 0).order("amount", { ascending: false }).limit(1000),
    db.from("lnc_ledger").select("id, user_id, kind, amount, memo, created_at").order("created_at", { ascending: false }).limit(25),
    db.from("lnc_waitlist").select("email, created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  if (balRes.error) {
    return (
      <>
        <PageHeader title="LunoCoin" description="Loyalty rewards." />
        <div className="card p-6 text-sm text-silver">
          LunoCoin is not set up yet. Run <span className="font-mono text-white">supabase/migrations/0004_lunocoin_rewards.sql</span> in the Supabase SQL Editor.
        </div>
      </>
    );
  }

  const holders = (balRes.data as { user_id: string; amount: string }[] | null) ?? [];
  const recent = (recentRes.data as { id: string; user_id: string; kind: string; amount: string; memo: string | null; created_at: string }[] | null) ?? [];
  const waitlist = (waitRes.data as { email: string; created_at: string }[] | null) ?? [];
  const ids = [...new Set([...holders.slice(0, 15).map((h) => h.user_id), ...recent.map((x) => x.user_id)])];
  const usersRes = ids.length ? await db.from("profiles").select("id, email").in("id", ids) : { data: [] };
  const email = new Map(((usersRes.data as { id: string; email: string }[] | null) ?? []).map((u) => [u.id, u.email]));

  const total = holders.reduce((s, h) => s + Number(h.amount), 0);
  const discounted = holders.filter((h) => lncTier(Number(h.amount)).discount > 0).length;
  const stats = [
    ["LNC in circulation", formatLnc(total)],
    ["Holders", String(holders.length)],
    ["Users with a fee discount", String(discounted)],
    ["News sign-ups", String(waitlist.length)],
  ];

  return (
    <>
      <PageHeader title="LunoCoin" description="Loyalty rewards: balances, recent rewards and manual adjustments." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card min-w-0 p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
            <p className="num mt-2 break-words font-display text-xl font-bold text-white sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="card h-fit p-5 sm:p-6">
          <h2 className="font-semibold text-white">Add or remove {LNC.symbol}</h2>
          <p className="mt-1 text-sm text-slate">Recorded in the audit log. The user is notified when LunoCoin is added.</p>
          <div className="mt-5">
            <LncGrant />
          </div>
        </section>

        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 font-semibold text-white sm:px-6">Top holders</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted">
                  <th className="px-5 py-3 font-medium sm:px-6">User</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">Balance</th>
                </tr>
              </thead>
              <tbody>
                {holders.slice(0, 15).map((h) => (
                  <tr key={h.user_id} className="border-b border-white/[0.04] last:border-0">
                    <td className="max-w-[220px] truncate px-5 py-3 text-white sm:px-6">{email.get(h.user_id) ?? h.user_id}</td>
                    <td className="px-4 py-3 text-slate">{lncTier(Number(h.amount)).name}</td>
                    <td className="num px-5 py-3 text-right font-semibold text-white sm:px-6">{formatLnc(h.amount)}</td>
                  </tr>
                ))}
                {holders.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate">
                      No LunoCoin has been earned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-white">Recent rewards</h2>
          <ul className="mt-3 divide-y divide-white/[0.04]">
            {recent.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-white">{email.get(x.user_id) ?? x.user_id}</span>
                  <span className="block truncate text-xs text-muted">
                    {x.kind.replace("_", " ")} · {x.memo ?? ""} · {formatDate(x.created_at)}
                  </span>
                </span>
                <span className={`num shrink-0 font-semibold ${Number(x.amount) >= 0 ? "text-up" : "text-down"}`}>
                  {Number(x.amount) >= 0 ? "+" : ""}
                  {formatLnc(x.amount)}
                </span>
              </li>
            ))}
            {recent.length === 0 && <li className="py-8 text-center text-sm text-slate">Nothing yet.</li>}
          </ul>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-white">LunoCoin news sign-ups</h2>
          <ul className="mt-3 max-h-96 divide-y divide-white/[0.04] overflow-y-auto">
            {waitlist.map((w) => (
              <li key={w.email} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="min-w-0 break-all text-white">{w.email}</span>
                <span className="shrink-0 text-xs text-muted">{formatDate(w.created_at, false)}</span>
              </li>
            ))}
            {waitlist.length === 0 && <li className="py-8 text-center text-sm text-slate">No sign-ups yet.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
