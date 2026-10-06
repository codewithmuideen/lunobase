import { CalendarClock, Headset, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBalances } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Withdrawal } from "@/lib/types";
import { formatAmount, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { WithdrawForm } from "@/components/dashboard/withdraw-form";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Withdraw" };

export default async function WithdrawPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const { profile } = await requireUser();
  const { asset } = await searchParams;
  const supabase = await createClient();
  const [balances, wdRes] = await Promise.all([
    getBalances(profile.id),
    supabase.from("withdrawals").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(15),
  ]);
  const withdrawals = (wdRes.data as Withdrawal[] | null) ?? [];

  const unlockAt = new Date(profile.withdrawal_unlock_at);
  const created = new Date(profile.created_at);
  const locked = !profile.withdrawals_enabled && unlockAt > new Date();
  const frozen = profile.status !== "active";
  const total = Math.max(1, unlockAt.getTime() - created.getTime());
  const progress = Math.min(100, Math.max(0, ((Date.now() - created.getTime()) / total) * 100));
  const daysLeft = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 86_400_000));

  const bal: Record<string, number> = {};
  for (const b of balances) bal[b.asset] = Number(b.amount);

  return (
    <>
      <PageHeader title="Withdraw" description="Send funds to an external wallet or bank account." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="card-raised p-5 sm:p-7">
          {frozen ? (
            <LockedPanel
              icon={Lock}
              title="Your account is frozen"
              text="Trading and withdrawals are paused. Contact support to verify your identity and restore access."
            />
          ) : locked ? (
            <div>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warn/10 text-warn">
                  <CalendarClock className="size-6" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Withdrawals unlock on {formatDate(unlockAt, false)}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate">
                    New accounts have a security holding period that protects you against fraud and account takeover. You can keep depositing and
                    trading as normal in the meantime.
                  </p>
                </div>
              </div>
              <div className="mt-7">
                <div className="flex justify-between text-xs text-slate">
                  <span>Account opened {formatDate(created, false)}</span>
                  <span className="font-semibold text-white">
                    {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="mt-7 rounded-2xl border border-white/5 bg-ink-950/40 p-5">
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Headset className="size-4 text-brand-400" /> Need to withdraw sooner?
                </p>
                <p className="mt-1.5 text-sm text-slate">
                  Our team can review your account for early access. Open a withdrawal ticket and we&apos;ll get back to you, usually within a few hours.
                </p>
                <ButtonLink href="/dashboard/support?new=withdrawal" className="mt-4">
                  Contact support
                </ButtonLink>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-up/[0.07] px-4 py-3 text-sm text-silver">
                <ShieldCheck className="size-4 shrink-0 text-up" /> Withdrawal any time. 
              </div>
              <WithdrawForm balances={bal} defaultAsset={asset?.toUpperCase()} />
            </>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-white">Withdrawal history</h2>
          <p className="mt-1 text-xs text-slate">
            Questions about a payout? Email{" "}
            <a href="mailto:payment@lunobase.com" className="font-semibold text-brand-300 hover:text-brand-200">
              payment@lunobase.com
            </a>
          </p>
          {withdrawals.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">No withdrawals yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.04]">
              {withdrawals.map((w) => (
                <li key={w.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="num text-sm font-semibold text-white">
                      {formatAmount(w.amount)} {w.asset}
                    </p>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted">{w.destination}</p>
                  <p className="text-xs text-muted">
                    {formatDate(w.created_at)}
                    {w.admin_note ? ` · ${w.admin_note}` : ""}
                  </p>
                  {w.tx_hash && <p className="mt-1 truncate font-mono text-[11px] text-brand-300">TX {w.tx_hash}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function LockedPanel({ icon: Icon, title, text }: { icon: typeof Lock; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-warn/10 text-warn">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate">{text}</p>
      <ButtonLink href="/dashboard/support?new=account" className="mt-6">
        Contact support
      </ButtonLink>
    </div>
  );
}
