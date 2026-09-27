import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCoinDetail, getMarkets } from "@/lib/market";
import { ASSET_BY_ID } from "@/lib/assets";
import { SITE_URL } from "@/lib/env";
import { formatAmount, formatPrice, formatUsd } from "@/lib/utils";
import { Container } from "@/components/marketing/section";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { PriceChart } from "@/components/market/price-chart";
import { ButtonLink } from "@/components/ui/button";

export const revalidate = 120;

export async function generateStaticParams() {
  const coins = await getMarkets(30);
  return coins.map((c) => ({ id: c.id }));
}

async function load(id: string) {
  const markets = await getMarkets(250);
  return markets.find((c) => c.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const coin = await load(id);
  if (!coin) return { title: "Coin not found" };
  const title = `${coin.name} (${coin.symbol}) Price Today - Live Chart & Market Cap`;
  const description = `${coin.name} price today is ${formatPrice(coin.current_price)} with a 24-hour volume of ${formatUsd(coin.total_volume, { compact: true })}. Track ${coin.symbol} live and buy ${coin.name} securely on Lunobase.`;
  return {
    title,
    description,
    alternates: { canonical: `/price/${id}` },
    openGraph: { title, description, url: `${SITE_URL}/price/${id}` },
  };
}

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [coin, detail] = await Promise.all([load(id), getCoinDetail(id)]);
  if (!coin) notFound();
  const tradable = !!ASSET_BY_ID[coin.id];
  const range = coin.high_24h - coin.low_24h || 1;
  const pos = ((coin.current_price - coin.low_24h) / range) * 100;

  const stats: [string, string][] = [
    ["Market cap", formatUsd(coin.market_cap, { compact: true })],
    ["24h volume", formatUsd(coin.total_volume, { compact: true })],
    ["Circulating supply", `${formatAmount(coin.circulating_supply, 0)} ${coin.symbol}`],
    ["Max supply", coin.max_supply ? `${formatAmount(coin.max_supply, 0)} ${coin.symbol}` : "∞"],
    ["All-time high", formatPrice(coin.ath)],
    ["Market cap rank", `#${coin.market_cap_rank}`],
  ];

  return (
    <div className="relative">
      <div aria-hidden className="bg-radial-brand absolute inset-x-0 top-0 h-[420px]" />
      <Container className="relative py-10 sm:py-14">
        <Link href="/markets" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-white">
          <ArrowLeft className="size-4" /> All markets
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <CoinIcon src={coin.image} symbol={coin.symbol} className="size-11" />
              <h1 className="font-display text-3xl font-bold text-white">{coin.name}</h1>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-sm font-medium text-silver">{coin.symbol}</span>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate">Rank #{coin.market_cap_rank}</span>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <p className="num font-display text-5xl font-bold tracking-tight text-white">{formatPrice(coin.current_price)}</p>
              <Change value={coin.price_change_percentage_24h} pill icon className="mb-2 text-base" />
            </div>

            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-xs text-slate">
                <span>24h low {formatPrice(coin.low_24h)}</span>
                <span>24h high {formatPrice(coin.high_24h)}</span>
              </div>
              <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down via-warn to-up" style={{ width: `${Math.min(100, Math.max(0, pos))}%` }} />
              </div>
            </div>

            <div className="card mt-8 p-4 sm:p-6">
              <PriceChart coinId={coin.id} />
            </div>

            {detail?.description && (
              <section className="mt-10">
                <h2 className="font-display text-2xl font-bold text-white">About {coin.name}</h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-slate">
                  {detail.description.split("\n").slice(0, 4).join("\n").slice(0, 1400)}
                </p>
                {detail.homepage && (
                  <a
                    href={detail.homepage}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300"
                  >
                    Official website <ExternalLink className="size-3.5" />
                  </a>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card-raised p-6">
              <p className="font-display text-lg font-semibold text-white">
                {tradable ? `Buy ${coin.name}` : `${coin.name} on Lunobase`}
              </p>
              <p className="mt-2 text-sm text-slate">
                {tradable
                  ? `Buy, sell and hold ${coin.symbol} with live pricing and a flat, transparent fee.`
                  : `${coin.symbol} isn't tradable on Lunobase yet. Track its price here and explore the assets you can trade today.`}
              </p>
              <ButtonLink href={tradable ? `/dashboard/trade?asset=${coin.symbol}` : "/register"} className="mt-5 w-full">
                {tradable ? `Buy ${coin.symbol}` : "Create account"}
              </ButtonLink>
            </div>
            <div className="card p-6">
              <p className="text-sm font-semibold text-white">Market stats</p>
              <dl className="mt-4 divide-y divide-white/5">
                {stats.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-slate">{k}</dt>
                    <dd className="num text-right font-medium text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
