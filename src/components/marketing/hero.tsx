"use client";

import Link from "next/link";
import { ArrowDownUp, ArrowRight, MailCheck, ShieldCheck, Zap } from "lucide-react";
import type { MarketCoin } from "@/lib/market";
import { useMarkets } from "@/hooks/use-markets";
import { cn, formatPrice } from "@/lib/utils";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { Sparkline } from "@/components/market/sparkline";

export function Hero({ initial }: { initial: MarketCoin[] }) {
  const { bySymbol } = useMarkets(initial);
  const btc = bySymbol.BTC;
  const chips = [
    { s: "ETH", cls: "left-[4%] top-[18%]" },
    { s: "SOL", cls: "left-[9%] top-[40%]" },
    { s: "XRP", cls: "right-[5%] top-[20%]" },
    { s: "BNB", cls: "right-[9%] top-[42%]" },
  ];

  return (
    <section className="relative -mt-[76px] overflow-hidden pt-[76px] lg:-mt-[84px] lg:pt-[84px]">
      {/* Backdrop: grid, arc glow, waves */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-50" />
        <div className="hero-arc absolute left-1/2 top-[-420px] size-[1300px] -translate-x-1/2 rounded-full opacity-90" />
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <Waves />
      </div>

      {/* Floating live chips (desktop) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
        {chips.map(({ s, cls }, i) => {
          const c = bySymbol[s];
          if (!c) return null;
          return (
            <div
              key={s}
              className={cn("glass absolute flex animate-float items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 shadow-xl", cls)}
              style={{ animationDelay: `${i * 0.9}s` }}
            >
              <CoinIcon src={c.image} symbol={s} className="size-7" />
              <span className="text-sm font-semibold text-white">{s}</span>
              <Change value={c.price_change_percentage_24h} className="text-xs" />
            </div>
          );
        })}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <Link
          href="/security"
          className="group inline-flex animate-fade-up items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.08] py-1.5 pl-1.5 pr-4 text-sm text-brand-100 backdrop-blur transition hover:border-brand-500/60 hover:bg-brand-500/15"
        >
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">New</span>
          2-step verification on every login
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          className="mx-auto mt-7 max-w-4xl animate-fade-up font-display text-[42px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-[84px]"
          style={{ animationDelay: "80ms" }}
        >
          Step into the future of <span className="text-gradient">secure crypto.</span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-slate sm:text-xl"
          style={{ animationDelay: "160ms" }}
        >
          Buy, sell and manage Bitcoin, Ethereum and more with live prices, a beautifully simple dashboard and security that never takes a day
          off.
        </p>

        <form
          action="/register"
          className="mx-auto mt-9 flex max-w-lg animate-fade-up flex-col gap-2 rounded-2xl border border-white/10 bg-ink-950/60 p-2 backdrop-blur-xl sm:flex-row sm:rounded-full"
          style={{ animationDelay: "240ms" }}
        >
          <label htmlFor="hero-email" className="sr-only">
            Email address
          </label>
          <input
            id="hero-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            className="h-12 flex-1 rounded-xl bg-transparent px-4 text-base text-white placeholder:text-muted outline-none sm:rounded-full"
          />
          <button className="btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2a6bff] to-brand-600 px-7 font-semibold text-white shadow-[0_10px_30px_-8px_rgb(0_82_255/0.9)] transition hover:shadow-[0_14px_40px_-8px_rgb(0_82_255/1)] sm:rounded-full">
            Get started <ArrowRight className="size-4" />
          </button>
        </form>

        <div
          className="mt-7 flex animate-fade-up flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm text-slate"
          style={{ animationDelay: "300ms" }}
        >
          {[
            [MailCheck, "Email OTP on every sign-in"],
            [ShieldCheck, "Reviewed withdrawals"],
            [Zap, "Instant market orders"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Zap;
            return (
              <span key={label as string} className="inline-flex items-center gap-2">
                <I className="size-4 text-brand-400" /> {label as string}
              </span>
            );
          })}
        </div>

        {/* Product cards */}
        <div
          className="relative mx-auto mt-16 grid max-w-5xl animate-fade-up items-end gap-5 text-left md:grid-cols-[1fr_1.15fr_1fr] lg:mt-20"
          style={{ animationDelay: "380ms" }}
        >
          <MarketsCard bySymbol={bySymbol} />
          <BalanceCard btc={btc} />
          <QuickBuyCard btc={btc} />
        </div>
      </div>
    </section>
  );
}

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "ring-gradient rounded-3xl bg-gradient-to-b from-ink-800/95 to-ink-900/95 p-5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MarketsCard({ bySymbol }: { bySymbol: Record<string, MarketCoin> }) {
  const rows = ["BTC", "ETH", "SOL", "XRP"].map((s) => bySymbol[s]).filter(Boolean);
  return (
    <CardShell className="hidden md:block md:translate-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Markets</p>
        <Link href="/markets" className="text-xs font-medium text-brand-400 hover:text-brand-300">
          See all
        </Link>
      </div>
      <ul className="mt-3 space-y-1">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/price/${c.id}`} className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]">
              <CoinIcon src={c.image} symbol={c.symbol} className="size-7" />
              <span className="w-10 text-sm font-semibold text-white">{c.symbol}</span>
              <span className="flex-1">
                <Sparkline data={c.sparkline_in_7d?.price} width={60} height={22} fill={false} />
              </span>
              <span className="text-right">
                <span className="num block text-xs font-semibold text-white">{formatPrice(c.current_price)}</span>
                <Change value={c.price_change_percentage_24h} className="text-[10px]" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function BalanceCard({ btc }: { btc?: MarketCoin }) {
  return (
    <CardShell className="relative md:-translate-y-2">
      <div aria-hidden className="absolute -inset-x-6 -top-10 -z-10 h-40 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="flex items-center justify-between">
        <div className="flex rounded-full bg-white/[0.05] p-1 text-[11px] font-semibold">
          <span className="rounded-full bg-brand-600 px-3 py-1 text-white">Portfolio</span>
          <span className="px-3 py-1 text-muted">Spot</span>
          <span className="px-3 py-1 text-muted">History</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-up">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-up" /> Live
        </span>
      </div>
      <p className="mt-5 text-xs text-muted">Total balance</p>
      <p className="num mt-1 font-display text-4xl font-bold tracking-tight text-white">
        $24,583<span className="text-2xl text-slate">.20</span>
      </p>
      <p className="num mt-1 text-xs font-medium text-up">+$1,432.49 (+6.19%) this week</p>
      <div className="-mx-1 mt-4">
        <Sparkline data={btc?.sparkline_in_7d?.price} width={320} height={96} positive responsive />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link href="/register" className="rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1a63ff]">
          Deposit
        </Link>
        <Link href="/register" className="rounded-xl bg-white/[0.06] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10">
          Buy crypto
        </Link>
      </div>
    </CardShell>
  );
}

function QuickBuyCard({ btc }: { btc?: MarketCoin }) {
  const spend = 500;
  const receive = btc ? (spend * 0.995) / btc.current_price : 0;
  return (
    <CardShell className="hidden md:block md:translate-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Quick buy</p>
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-silver">Market</span>
      </div>
      <div className="mt-3 rounded-2xl bg-ink-950/70 p-3">
        <p className="text-[11px] text-muted">You pay</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="num text-lg font-semibold text-white">$500.00</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] py-1 pl-1 pr-2.5 text-xs font-semibold text-white">
            <CoinIcon symbol="USD" className="size-5 text-[10px]" /> USD
          </span>
        </div>
      </div>
      <div className="relative z-10 -my-2.5 flex justify-center">
        <span className="grid size-8 place-items-center rounded-full border-4 border-ink-850 bg-brand-600 text-white">
          <ArrowDownUp className="size-3.5" />
        </span>
      </div>
      <div className="rounded-2xl bg-ink-950/70 p-3">
        <p className="text-[11px] text-muted">You receive</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="num text-lg font-semibold text-white">{receive ? receive.toFixed(6) : "-"}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] py-1 pl-1 pr-2.5 text-xs font-semibold text-white">
            <CoinIcon src={btc?.image} symbol="BTC" className="size-5" /> BTC
          </span>
        </div>
      </div>
      <p className="num mt-3 text-center text-[11px] text-muted">1 BTC = {btc ? formatPrice(btc.current_price) : "-"}</p>
      <Link
        href="/register"
        className="btn-shine mt-3 block rounded-xl bg-up py-2.5 text-center text-sm font-bold text-ink-950 transition hover:brightness-110"
      >
        Buy BTC
      </Link>
    </CardShell>
  );
}

/** Soft animated wave lines (pure SVG + CSS). */
function Waves() {
  const lines = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[55%] w-[112%] animate-wave opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="wave-stroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0" />
          <stop offset="45%" stopColor="#4F7FFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#EDF2FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((i) => (
        <path
          key={i}
          d={`M0 ${250 + i * 9} C 240 ${150 + i * 14}, 480 ${330 - i * 6}, 720 ${230 + i * 7} S 1200 ${120 + i * 16}, 1440 ${210 + i * 8}`}
          fill="none"
          stroke="url(#wave-stroke)"
          strokeWidth="1"
          opacity={1 - i * 0.08}
        />
      ))}
    </svg>
  );
}
