import { Mail, ShieldCheck, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Deposit } from "@/lib/types";
import { formatAmount, formatDate, shortId } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = { title: "Deposit" };

export default async function DepositPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const { profile } = await requireUser();
  const { asset } = await searchParams;
  const supabase = await createClient();
  const [settings, depRes] = await Promise.all([
    getSettings(),
    supabase.from("deposits").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const deposits = (depRes.data as Deposit[] | null) ?? [];

  return (
    <>
      <PageHeader title="Deposit" description="Fund your wallet with crypto or a bank transfer." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <DepositForm
          addresses={settings.deposit_addresses ?? {}}
          bank={settings.bank_details ?? {}}
          minDeposit={Number(settings.min_deposit_usd)}
          userRef={`LB-${shortId(profile.id)}`}
          defaultAsset={asset?.toUpperCase()}
        />
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-white">How deposits work</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Send funds", "Transfer crypto to your address, or send a bank transfer with your reference."],
                ["Notify us", "Submit the amount and transaction reference below the instructions."],
                ["Get credited", "Once confirmed, your wallet updates instantly. You'll also get an email."],
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
            <div className="mt-5 grid gap-2 text-xs text-slate">
              <span className="flex items-center gap-2">
                <Zap className="size-3.5 text-brand-400" /> No deposit fees
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-brand-400" /> Every deposit verified by our team
              </span>
              <span className="flex items-center gap-2">
                <Mail className="size-3.5 text-brand-400" /> Payment questions?{" "}
                <a href="mailto:payment@lunobase.com" className="font-semibold text-brand-300 hover:text-brand-200">
                  payment@lunobase.com
                </a>
              </span>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-white">Deposit history</h2>
            {deposits.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate">No deposits yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/[0.04]">
                {deposits.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="num text-sm font-semibold text-white">
                        {formatAmount(d.credited ?? d.amount)} {d.asset}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {formatDate(d.created_at)}
                        {d.status === "rejected" && d.admin_note ? ` · ${d.admin_note}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
