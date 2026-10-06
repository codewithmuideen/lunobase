import { Gift, Link2, UserPlus, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { formatAmount, formatDate, maskEmail } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { CopyField } from "@/components/ui/copy-field";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const { profile } = await requireUser();
  const db = createAdminClient();
  const code = (profile as { referral_code?: string | null }).referral_code ?? null;

  const [friendsRes, earnedRes, settingsRes] = await Promise.all([
    db.from("profiles").select("email, created_at").eq("referred_by", profile.id).order("created_at", { ascending: false }).limit(50),
    db.from("ledger").select("amount, asset, created_at").eq("user_id", profile.id).eq("memo", "Referral commission").order("created_at", { ascending: false }).limit(500),
    db.from("app_settings").select("referral_commission_bps").eq("id", 1).maybeSingle(),
  ]);
  const ready = !!code && !friendsRes.error;
  const friends = (friendsRes.data as { email: string; created_at: string }[] | null) ?? [];
  const payouts = (earnedRes.data as { amount: string; asset: string; created_at: string }[] | null) ?? [];
  const earned = payouts.reduce((s, p) => s + Number(p.amount), 0);
  const rate = ((settingsRes.data as { referral_commission_bps?: number } | null)?.referral_commission_bps ?? 2000) / 100;
  const link = `${SITE_URL}/register?ref=${code ?? ""}`;

  return (
    <>
      <PageHeader title="Refer a friend" description={`Earn ${rate}% of the trading fees your friends pay, every time they trade.`} />

      {!ready ? (
        <div className="card p-6 text-sm text-silver">The referral programme is being set up. Please check back shortly.</div>
      ) : (
        <div className="space-y-6">
          <section className="card-raised relative overflow-hidden p-6 sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-600/25 blur-3xl" />
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-300">
                <Link2 className="size-4" /> Your referral link
              </p>
              <CopyField value={link} label="referral link" className="mt-3" />
              <p className="mt-4 text-sm text-slate">
                Or share your code: <span className="font-mono font-semibold text-white">{code}</span>
              </p>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Users, label: "Friends joined", value: String(friends.length) },
              { icon: Wallet, label: "Commission earned", value: `${formatAmount(earned, 2)} USDT` },
              { icon: Gift, label: "Your rate", value: `${rate}% of fees` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-5">
                <Icon className="size-5 text-brand-400" />
                <p className="mt-3 text-xs uppercase tracking-wider text-muted">{label}</p>
                <p className="num mt-1 font-display text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold text-white">How it works</h2>
              <ol className="mt-4 space-y-4">
                {[
                  ["Share your link", "Send it to friends or post it wherever you like."],
                  ["They sign up and trade", "They create an account with your link and start trading."],
                  [`You earn ${rate}%`, "Each time they pay a trading fee, your share is added to your USDT balance automatically."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-300">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t}</p>
                      <p className="text-sm text-slate">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-white/5 pt-4 text-xs leading-relaxed text-muted">
                Commission comes only from fees your friends actually pay. There is no payment for sign-ups alone, and earnings are not
                guaranteed. Self-referrals and fake accounts are not allowed and may lead to account closure.
              </p>
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold text-white">Friends you referred</h2>
              {friends.length === 0 ? (
                <EmptyState icon={UserPlus} title="No referrals yet" text="Share your link to get started." />
              ) : (
                <ul className="mt-3 divide-y divide-white/[0.04]">
                  {friends.map((f) => (
                    <li key={f.email} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="text-white">{maskEmail(f.email)}</span>
                      <span className="text-xs text-muted">Joined {formatDate(f.created_at, false)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
