import Link from "next/link";
import { ArrowDownToLine, BadgeCheck, CandlestickChart, Check, Coins, Crown, History, MailCheck, Percent, Share2, Trophy, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";
import { getCheckinState, getLncBalance, syncLncMilestones, type LncEntry } from "@/lib/lnc";
import { LNC, SHARE_CHANNELS, dayKey, formatLnc, lncTier, nextLncTier, type ShareChannel } from "@/lib/lunocoin";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { LncCheckIn, LncShare } from "@/components/dashboard/lnc-earn";

export const metadata = { title: "LunoCoin rewards" };

const KIND_LABEL: Record<string, string> = {
  signup: "Welcome bonus",
  kyc: "Identity verified",
  first_deposit: "First deposit",
  trade: "Trading reward",
  referral: "Referral reward",
  share: "Share reward",
  checkin: "Daily check-in",
  streak: "Streak bonus",
  admin: "Adjustment",
};

export default async function RewardsPage() {
  const { profile } = await requireUser();
  const first = await getLncBalance(profile.id);

  if (!first.ready) {
    return (
      <>
        <PageHeader title="LunoCoin rewards" description="Earn LunoCoin for using Lunobase and pay lower trading fees." />
        <div className="card p-6 text-sm text-silver">LunoCoin rewards are being set up. Please check back shortly.</div>
      </>
    );
  }

  await syncLncMilestones(profile);
  const db = createAdminClient();
  const [{ balance }, checkin, ledgerRes, topRes, friendsRes] = await Promise.all([
    getLncBalance(profile.id),
    getCheckinState(profile.id),
    db.from("lnc_ledger").select("id, kind, amount, memo, ref, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(200),
    db.from("lnc_balances").select("user_id, amount").gt("amount", 0).order("amount", { ascending: false }).limit(10),
    db.from("lnc_ledger").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("kind", "referral"),
  ]);

  const ledger = (ledgerRes.data as (LncEntry & { ref: string })[] | null) ?? [];
  const kinds = new Set(ledger.map((l) => l.kind));
  const today = dayKey();
  const sharedToday = ledger
    .filter((l) => l.kind === "share" && l.ref.endsWith(`:${today}`))
    .map((l) => l.ref.split(":")[0])
    .filter((c): c is ShareChannel => SHARE_CHANNELS.includes(c as ShareChannel));

  const top = (topRes.data as { user_id: string; amount: string }[] | null) ?? [];
  const namesRes = top.length ? await db.from("profiles").select("id, email").in("id", top.map((t) => t.user_id)) : { data: [] };
  const emailById = new Map(((namesRes.data as { id: string; email: string }[] | null) ?? []).map((p) => [p.id, p.email]));

  const tier = lncTier(balance);
  const next = nextLncTier(balance);
  const progress = next ? Math.min(100, (balance / next.min) * 100) : 100;
  const link = profile.referral_code ? `${SITE_URL}/register?ref=${profile.referral_code}` : `${SITE_URL}/register`;
  const r = LNC.rewards;

  const ways = [
    { icon: MailCheck, title: "Sign up and verify your email", reward: r.signup, done: kinds.has("signup") },
    { icon: BadgeCheck, title: "Complete identity verification", reward: r.kyc, done: kinds.has("kyc"), href: "/dashboard/verify", cta: profile.kyc_status === "pending" ? "Under review" : "Verify now" },
    { icon: ArrowDownToLine, title: "Get your first deposit approved", reward: r.firstDeposit, done: kinds.has("first_deposit"), href: "/dashboard/deposit", cta: "Deposit" },
    { icon: CandlestickChart, title: `Trade: ${r.tradePer} ${LNC.symbol} for every ${r.tradeUnit} USDT`, reward: null, repeat: "Every trade", href: "/dashboard/trade", cta: "Trade" },
    { icon: UserPlus, title: "Refer a friend who makes a trade", reward: r.referral, repeat: `${friendsRes.count ?? 0} so far, no limit`, href: "/dashboard/referrals", cta: "Invite" },
    { icon: Share2, title: "Share Lunobase on social media", reward: r.share, repeat: "Per app, every day" },
  ];

  return (
    <>
      <PageHeader title="LunoCoin rewards" description={`Earn ${LNC.symbol} for the things you already do on Lunobase, then pay lower trading fees.`} />

      <div className="space-y-6">
        {/* Balance and tier */}
        <section className="card-raised relative overflow-hidden p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-600/25 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm text-slate">
                <Coins className="size-4 text-brand-400" /> Your {LNC.name}
              </p>
              <p className="num mt-2 break-words font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {formatLnc(balance)} <span className="text-xl font-semibold text-brand-300 sm:text-2xl">{LNC.symbol}</span>
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white">
                <Crown className={cn("size-3.5", tier.discount ? "text-warn" : "text-muted")} />
                {tier.name} level{tier.discount ? `: ${Math.round(tier.discount * 100)}% off trading fees` : ""}
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex items-end justify-between gap-3 text-sm">
                <p className="text-silver">
                  {next ? (
                    <>
                      <span className="num font-semibold text-white">{formatLnc(Math.max(0, next.min - balance))} {LNC.symbol}</span> to {next.name}
                    </>
                  ) : (
                    "You're at the top level"
                  )}
                </p>
                {next && <p className="shrink-0 text-xs font-semibold text-brand-300">{Math.round(next.discount * 100)}% off fees</p>}
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${Math.max(progress, 2)}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {[...LNC.tiers].reverse().map((t) => {
                  const reached = balance >= t.min;
                  return (
                    <div key={t.name} className={cn("rounded-xl border p-3", reached ? "border-brand-500/40 bg-brand-600/10" : "border-white/[0.06] bg-white/[0.02]")}>
                      <p className="flex items-center gap-1.5 text-xs text-slate">
                        <Percent className="size-3.5" /> {t.name}
                        {reached && <Check className="ml-auto size-3.5 text-up" />}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{Math.round(t.discount * 100)}% off fees</p>
                      <p className="num text-xs text-muted">from {formatLnc(t.min)} {LNC.symbol}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Share and earn */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Share2 className="size-4 text-brand-400" /> Share and earn
            </h2>
            <p className="mt-1 text-sm text-slate">
              Earn {r.share} {LNC.symbol} each time you share Lunobase, once per app per day. Your referral link is included automatically.
            </p>
            <div className="mt-4">
              <LncShare link={link} claimed={sharedToday} />
            </div>
          </section>

          {/* Daily check-in */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Daily check-in</h2>
            <p className="mt-1 text-sm text-slate">
              Check in every day for {r.checkin} {LNC.symbol}. Reach day {r.streakDays} for a {r.streakBonus} {LNC.symbol} bonus.
            </p>
            <div className="mt-4">
              <LncCheckIn streak={checkin.streak} checkedInToday={checkin.checkedInToday} />
            </div>
          </section>
        </div>

        {/* Ways to earn */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-white">Ways to earn</h2>
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {ways.map(({ icon: Icon, title, reward, done, repeat, href, cta }) => (
              <li key={title} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", done ? "bg-up/10 text-up" : "bg-brand-600/15 text-brand-300")}>
                  {done ? <Check className="size-5" /> : <Icon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className={cn("text-sm font-medium", done ? "text-slate" : "text-white")}>{title}</p>
                  <p className="text-xs text-muted">{done ? "Completed" : (repeat ?? "One time")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {reward !== null && (
                    <span className="num text-sm font-semibold text-brand-300">
                      +{formatLnc(reward)} {LNC.symbol}
                    </span>
                  )}
                  {!done && href && (
                    <Link href={href} className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15">
                      {cta}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* History */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-white">Your rewards history</h2>
            {ledger.length === 0 ? (
              <EmptyState icon={History} title="Nothing yet" text="Your LunoCoin rewards will show up here." />
            ) : (
              <ul className="mt-3 divide-y divide-white/[0.04]">
                {ledger.slice(0, 12).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-white">{KIND_LABEL[l.kind] ?? "Reward"}</span>
                      <span className="block truncate text-xs text-muted">{l.memo ? `${l.memo} · ` : ""}{formatDate(l.created_at)}</span>
                    </span>
                    <span className={cn("num shrink-0 font-semibold", Number(l.amount) >= 0 ? "text-up" : "text-down")}>
                      {Number(l.amount) >= 0 ? "+" : ""}
                      {formatLnc(l.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Leaderboard */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Trophy className="size-4 text-warn" /> Top earners
            </h2>
            {top.length === 0 ? (
              <EmptyState icon={Trophy} title="Be the first" text="Start earning to take the top spot." />
            ) : (
              <ol className="mt-3 divide-y divide-white/[0.04]">
                {top.map((t, i) => {
                  const me = t.user_id === profile.id;
                  return (
                    <li key={t.user_id} className={cn("flex items-center gap-3 py-3 text-sm", me && "-mx-2 rounded-xl bg-brand-600/10 px-2")}>
                      <span className={cn("num grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", i < 3 ? "bg-warn/15 text-warn" : "bg-white/[0.06] text-slate")}>{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-white">{me ? "You" : `${(emailById.get(t.user_id) ?? "me").slice(0, 2)}•••••`}</span>
                      <span className="num shrink-0 font-semibold text-white">{formatLnc(t.amount)} <span className="text-xs font-normal text-muted">{LNC.symbol}</span></span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          {LNC.name} is a loyalty reward for Lunobase customers. It is earned, not bought. It has no cash value, cannot be sold, transferred or withdrawn, and is not
          an investment. Rewards from fake accounts, self-referrals or automated activity may be removed. See our{" "}
          <Link href="/legal/terms#lunocoin" className="text-brand-400 hover:text-brand-300">
            Terms
          </Link>
          .
        </p>
      </div>
    </>
  );
}
