import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CandlestickChart,
  Eye,
  Fingerprint,
  KeyRound,
  LineChart,
  Lock,
  MailCheck,
  Snowflake,
  Wallet,
  Zap,
} from "lucide-react";
import { getMarkets } from "@/lib/market";
import { TRADABLE_ASSETS } from "@/lib/assets";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Spotlight } from "@/components/ui/motion";
import { Container, Faq, SectionHeading } from "@/components/marketing/section";
import { Hero } from "@/components/marketing/hero";
import { Ticker } from "@/components/marketing/ticker";
import { MarketHighlights } from "@/components/marketing/market-highlights";
import { MarketTable } from "@/components/market/market-table";
import {
  InsightsPreview,
  NotifyPreview,
  RealtimePreview,
  TerminalPreview,
  WalletPreview,
} from "@/components/marketing/feature-visuals";

export const revalidate = 60;

const faqs = [
  {
    q: "Is Lunobase safe to use?",
    a: "Every sign-in requires your password plus a one-time code sent to your email. Every withdrawal is reviewed by our security team before it's released. You can set an anti-phishing code, see every login to your account, and freeze your account instantly if something looks wrong.",
  },
  {
    q: "How do I fund my account?",
    a: "Open Wallet → Deposit and choose Bitcoin, Ethereum or USDT. Copy your deposit address (or scan the QR code), send your funds and submit the transaction hash. Your balance updates automatically, in real time, the moment the deposit is confirmed.",
  },
  {
    q: "When can I withdraw?",
    a: "You can request a withdrawal at any time, including the same day you deposit. There is no waiting period. Withdrawals are not automatic: every request is reviewed and approved by our team before funds are sent, and the amount is held in your account while it is under review. You can follow the status on the Withdraw page.",
  },
  {
    q: "What does it cost to trade?",
    a: "There are no deposit fees and no account fees. All coins are bought and sold with USDT, and you pay a simple, flat trading fee shown before you confirm every order. See the Fees page for details.",
  },
  {
    q: "Which assets can I trade?",
    a: `You can currently buy and sell ${TRADABLE_ASSETS.length} leading assets including Bitcoin, Ethereum, Solana, XRP, USDT and USDC, with live pricing from global markets.`,
  },
];

const steps = [
  { n: "01", title: "Create your account", text: "Sign up in under two minutes, verify your email and secure your login with a one-time code." },
  { n: "02", title: "Fund your wallet", text: "Send Bitcoin, Ethereum or USDT to your deposit address. Your balance updates live the moment it's confirmed." },
  { n: "03", title: "Buy your first crypto", text: "Pick an asset, enter an amount and review the exact price, fee and total before you confirm." },
];

export default async function HomePage() {
  const markets = await getMarkets(100);

  return (
    <>
      <Hero initial={markets} />
      <Ticker initial={markets} />

      {/* ---------------------------------------------------- Highlights */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal className="flex flex-col items-center text-center">
            <p className="eyebrow">Featured markets</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Today&apos;s crypto at a glance</h2>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <MarketHighlights initial={markets} />
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Markets */}
      <section className="pb-24 sm:pb-28">
        <Container>
          <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow="Live markets"
              title="Today's crypto prices"
              description="Real-time prices for the world's leading digital assets, updated automatically."
            />
            <ButtonLink href="/markets" variant="secondary" className="self-start rounded-full sm:self-auto">
              View all markets <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
          <Reveal delay={100} className="card ring-gradient mt-10 p-2 sm:p-4">
            <MarketTable initial={markets} limit={8} compact />
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Features */}
      <section className="relative overflow-hidden py-24 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-40 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[140px]" />
        <Container className="relative">
          <Reveal>
            <SectionHeading
              eyebrow="Why Lunobase"
              title={
                <>
                  Simple enough for day one.
                  <br className="hidden sm:block" /> <span className="text-gradient">Powerful enough</span> for every day after.
                </>
              }
            />
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-6">
            <FeatureCard
              className="md:col-span-4"
              icon={CandlestickChart}
              title="A pro trading screen that stays simple"
              text="Candlestick charts, live pricing and one-tap market orders. Every order shows the exact price, fee and total before you confirm."
            >
              <TerminalPreview />
            </FeatureCard>
            <FeatureCard
              className="md:col-span-2"
              delay={80}
              icon={Zap}
              title="Real-time balances"
              text="Your dashboard updates live the moment a trade fills or a deposit is confirmed. No refresh needed."
            >
              <RealtimePreview />
            </FeatureCard>
            <FeatureCard
              className="md:col-span-2"
              icon={Wallet}
              title="One wallet, every asset"
              text={`Hold USDT and ${TRADABLE_ASSETS.length - 1} other leading cryptocurrencies side by side, with clear profit and loss for each.`}
            >
              <WalletPreview />
            </FeatureCard>
            <FeatureCard
              className="md:col-span-2"
              delay={80}
              icon={LineChart}
              title="Portfolio insights"
              text="Allocation, 7-day performance and cost basis for every holding, at a glance."
            >
              <InsightsPreview />
            </FeatureCard>
            <FeatureCard
              className="md:col-span-2"
              delay={160}
              icon={Bell}
              title="Always in the loop"
              text="Instant in-app and email notifications for every deposit, trade and withdrawal."
            >
              <NotifyPreview />
            </FeatureCard>
          </div>
          <p className="mt-4 text-center text-xs text-muted">Product previews are illustrative.</p>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Facts band */}
      <section className="pb-24">
        <Container>
          <Reveal className="ring-gradient grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.06] lg:grid-cols-4">
            {[
              ["$0", "Deposit & account fees"],
              ["0.50%", "Flat trading fee"],
              ["2-step", "Verification on every login"],
              ["24/7", "Live markets & support"],
            ].map(([big, small]) => (
              <div key={small} className="bg-ink-900 px-6 py-8 text-center sm:py-10">
                <p className="num font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  <span className="text-gradient">{big}</span>
                </p>
                <p className="mt-2 text-sm text-slate">{small}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Steps */}
      <section className="pb-24 sm:pb-28">
        <Container>
          <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              align="left"
              eyebrow="Get started"
              title={
                <>
                  Your first trade in <span className="text-gradient">three steps.</span>
                </>
              }
            />
            <p className="max-w-md text-slate">No paperwork maze and no hidden costs. Most people go from sign-up to their first purchase in minutes.</p>
          </Reveal>
          <div className="group/steps mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div
                  className={
                    i === 1
                      ? "relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a6bff] to-brand-700 p-7 shadow-[0_30px_60px_-20px_rgb(0_82_255/0.6)] transition duration-300 hover:-translate-y-1 sm:p-8"
                      : "relative h-full rounded-3xl border border-white/[0.08] bg-ink-850/80 p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-500/40 sm:p-8"
                  }
                >
                  {i === 1 && <div aria-hidden className="bg-grid absolute inset-0 opacity-25" />}
                  <div className="relative">
                    <p className={i === 1 ? "font-display text-2xl font-bold text-white/70" : "font-display text-2xl font-bold text-brand-400"}>{s.n}.</p>
                    <h3 className="mt-8 font-display text-xl font-semibold text-white">{s.title}</h3>
                    <p className={i === 1 ? "mt-3 leading-relaxed text-brand-50/85" : "mt-3 leading-relaxed text-slate"}>{s.text}</p>
                    <Link
                      href="/register"
                      className={
                        i === 1
                          ? "mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white"
                          : "mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200"
                      }
                    >
                      Get started <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Security */}
      <section className="pb-24 sm:pb-28">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[32px] border border-white/10">
            <Image src="/brand/wave.png" alt="" fill sizes="100vw" className="object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-ink-950/30 via-ink-950/40 to-ink-950/90" />
            <div className="relative grid gap-12 p-7 sm:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">Security</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">Your account is guarded at every step.</h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-50/80">
                  Security isn&apos;t a feature we bolted on. It&apos;s in how you sign in, how money moves and how we talk to you.
                </p>
                <ButtonLink href="/security" variant="light" className="mt-8 rounded-full">
                  How we protect you <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  [MailCheck, "Email code on every login", "Your password alone is never enough."],
                  [Fingerprint, "Anti-phishing code", "A secret phrase in every genuine email."],
                  [Eye, "Login history", "See every device and IP that accessed your account."],
                  [Snowflake, "Instant freeze", "Lock trading and withdrawals in one tap."],
                  [KeyRound, "Breached-password check", "We block passwords exposed in known leaks."],
                  [Lock, "Reviewed withdrawals", "A human checks every withdrawal before it leaves."],
                ].map(([Icon, title, text]) => {
                  const I = Icon as typeof Lock;
                  return (
                    <div
                      key={title as string}
                      className="rounded-2xl border border-white/10 bg-ink-950/55 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-ink-950/70 sm:p-5"
                    >
                      <I className="size-5 text-brand-300" />
                      <p className="mt-3 text-sm font-semibold leading-snug text-white sm:text-base">{title as string}</p>
                      <p className="mt-1 text-xs leading-relaxed text-silver/80 sm:text-sm">{text as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- FAQ */}
      <section className="pb-24 sm:pb-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="FAQ"
              title="Questions, answered"
              description={
                <>
                  Can&apos;t find what you need?{" "}
                  <Link href="/support" className="text-brand-400 hover:text-brand-300">
                    Visit the help center
                  </Link>
                  .
                </>
              }
            />
          </Reveal>
          <Reveal delay={100}>
            <Faq items={faqs} />
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------------------- CTA */}
      <section className="pb-24 sm:pb-28">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[32px] border border-brand-500/20 bg-gradient-to-br from-brand-700 via-brand-600 to-[#2a4fd6] px-6 py-16 text-center sm:px-16 sm:py-20">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-30" />
            <div aria-hidden className="absolute -bottom-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-white/20 blur-[100px]" />
            <Image
              src="/brand/mark-white.png"
              alt=""
              width={420}
              height={420}
              className="pointer-events-none absolute -right-16 -top-10 animate-float opacity-[0.08]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Start building your crypto portfolio today.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-brand-50/85">
                Join Lunobase in minutes. No account fees, no deposit fees, and security that works as hard as you do.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/register" variant="light" size="lg" className="rounded-full">
                  Create free account <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/markets" size="lg" className="rounded-full border border-white/25 bg-none bg-white/10 shadow-none hover:bg-white/15">
                  Explore markets
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
  className,
  children,
  delay = 0,
}: {
  icon: typeof Lock;
  title: string;
  text: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <Spotlight className="h-full rounded-3xl">
        <div className="card-raised flex h-full flex-col overflow-hidden rounded-3xl p-6 transition duration-300 sm:p-8">
          <div className="grid size-11 place-items-center rounded-xl border border-brand-500/25 bg-brand-500/10 shadow-[0_0_24px_-6px_rgb(79_127_255/0.6)]">
            <Icon className="size-5 text-brand-400" />
          </div>
          <h3 className="mt-5 font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-md leading-relaxed text-slate">{text}</p>
          <div className="mt-auto">{children}</div>
        </div>
      </Spotlight>
    </Reveal>
  );
}
