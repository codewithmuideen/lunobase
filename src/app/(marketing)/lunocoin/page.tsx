import type { Metadata } from "next";
import { ArrowDownToLine, BadgeCheck, CalendarCheck, CandlestickChart, Check, Coins, MailCheck, Share2, UserPlus } from "lucide-react";
import { LNC, formatLnc } from "@/lib/lunocoin";
import { ButtonLink } from "@/components/ui/button";
import { Container, Faq, PageHero, SectionHeading } from "@/components/marketing/section";
import { LncWaitlist } from "@/components/marketing/lnc-waitlist";

export const metadata: Metadata = {
  title: "LunoCoin rewards",
  description: "Earn LunoCoin (LNC) for signing up, trading, inviting friends and sharing on Lunobase, then pay up to 50% less in trading fees.",
  alternates: { canonical: "/lunocoin" },
};

const r = LNC.rewards;

const ways = [
  { icon: MailCheck, amount: `${r.signup} LNC`, title: "Sign up", text: "Create your account and verify your email." },
  { icon: BadgeCheck, amount: `${r.kyc} LNC`, title: "Verify your identity", text: "A one-time check that protects your account." },
  { icon: ArrowDownToLine, amount: `${r.firstDeposit} LNC`, title: "Make your first deposit", text: "Paid when your first deposit is approved." },
  { icon: CandlestickChart, amount: `${r.tradePer} LNC`, title: `Per ${r.tradeUnit} USDT traded`, text: "Every buy and every sell earns, with no limit." },
  { icon: UserPlus, amount: `${r.referral} LNC`, title: "Invite a friend", text: "For each friend who signs up with your link and trades." },
  { icon: Share2, amount: `${r.share} LNC`, title: "Share Lunobase", text: "On WhatsApp, Facebook, X or Telegram. Once per app, every day." },
  { icon: CalendarCheck, amount: `${r.checkin} LNC`, title: "Check in daily", text: `Plus a ${r.streakBonus} LNC bonus every ${r.streakDays} days in a row.` },
];

const faqs = [
  { q: "What is LunoCoin?", a: "LunoCoin (LNC) is the Lunobase loyalty reward. You earn it for using your account, and the more you hold, the lower your trading fee." },
  { q: "Can I buy LunoCoin?", a: "No. LunoCoin is never sold. The only way to get it is to earn it on Lunobase." },
  { q: "Is LunoCoin worth money?", a: "No. LunoCoin has no cash value and no price. It cannot be sold, transferred or withdrawn, and it is not an investment. Its benefit is the trading fee discount." },
  { q: "How do the fee discounts work?", a: `Hold ${formatLnc(LNC.tiers[1].min)} LNC and your trading fee drops by ${LNC.tiers[1].discount * 100}%. Hold ${formatLnc(LNC.tiers[0].min)} LNC and it drops by ${LNC.tiers[0].discount * 100}%. The discount is applied automatically on every order.` },
  { q: "Does using the discount spend my LunoCoin?", a: "No. You keep your LunoCoin. The discount depends only on how much you hold." },
  { q: "Can rewards be removed?", a: "Yes, if they were earned through fake accounts, self-referrals or automated activity. We may also change reward amounts in the future." },
];

export default function LunoCoinPage() {
  return (
    <>
      <PageHero
        eyebrow="LunoCoin rewards"
        title="Trade more. Earn LunoCoin. Pay lower fees."
        description="LunoCoin (LNC) is our way of saying thank you. Earn it for the things you already do on Lunobase and get up to 50% off your trading fees."
      />

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Ways to earn" title="Seven ways to earn LunoCoin" description="Rewards are added to your account automatically." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ways.map(({ icon: Icon, amount, title, text }) => (
              <li key={title} className="card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600/15 text-brand-300">
                  <Icon className="size-5" />
                </span>
                <p className="num mt-5 font-display text-2xl font-bold text-white">{amount}</p>
                <p className="mt-1 font-semibold text-white">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{text}</p>
              </li>
            ))}
            <li className="card-raised flex flex-col justify-between p-6">
              <div>
                <Coins className="size-7 text-brand-400" />
                <p className="mt-4 font-display text-xl font-bold text-white">Ready to start?</p>
                <p className="mt-1.5 text-sm text-slate">Your first {r.signup} LNC is waiting.</p>
              </div>
              <ButtonLink href="/register" className="mt-6 w-full">
                Create free account
              </ButtonLink>
            </li>
          </ul>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <SectionHeading eyebrow="Fee discounts" title="The more you hold, the less you pay" description="Discounts apply automatically to every buy and sell order." />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[{ name: "Member", min: 0, discount: 0 }, ...[...LNC.tiers].reverse()].map((t, i) => (
              <div key={t.name} className={i === 2 ? "card-raised relative overflow-hidden p-7" : "card p-7"}>
                <p className="eyebrow">{t.name}</p>
                <p className="num mt-4 font-display text-5xl font-extrabold tracking-tight text-white">{t.discount * 100}%</p>
                <p className="mt-1 text-slate">off trading fees</p>
                <p className="mt-6 flex items-center gap-2 border-t border-white/5 pt-5 text-sm text-silver">
                  <Check className="size-4 shrink-0 text-up" />
                  {t.min ? `Hold ${formatLnc(t.min)} LNC or more` : "Every new account"}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading align="left" eyebrow="FAQ" title="Good to know" />
            <div className="card mt-8 p-6">
              <p className="font-semibold text-white">Get LunoCoin news</p>
              <p className="mt-1 text-sm text-slate">New ways to earn and new benefits, straight to your inbox.</p>
              <div className="mt-4">
                <LncWaitlist />
              </div>
            </div>
          </div>
          <Faq items={faqs} />
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">
            LunoCoin is a loyalty reward, not a cryptocurrency or an investment. It is not for sale, has no cash value and cannot be sold, transferred or
            withdrawn. Reward amounts and benefits may change. Trading crypto involves risk and you can lose money.
          </p>
        </Container>
      </section>
    </>
  );
}
