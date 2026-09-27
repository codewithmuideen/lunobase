import type { Metadata } from "next";
import { getMarkets } from "@/lib/market";
import { Container } from "@/components/marketing/section";
import { MarketTable } from "@/components/market/market-table";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { formatPrice, formatUsd } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cryptocurrency Prices, Charts & Market Cap Today",
  description:
    "Live cryptocurrency prices for Bitcoin, Ethereum, Solana and the top 100 coins. Track 24h change, volume and market cap on Lunobase.",
  alternates: { canonical: "/markets" },
};

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const coins = await getMarkets(100);
  const totalCap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
  const btcDom = coins.length ? ((coins.find((c) => c.id === "bitcoin")?.market_cap ?? 0) / totalCap) * 100 : 0;
  const sorted = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  const highlights = [
    { title: "Top gainers", list: sorted.slice(0, 3) },
    { title: "Top losers", list: sorted.slice(-3).reverse() },
    { title: "Highest volume", list: [...coins].sort((a, b) => b.total_volume - a.total_volume).slice(0, 3) },
  ];

  return (
    <div className="relative">
      <div aria-hidden className="bg-radial-brand absolute inset-x-0 top-0 h-[480px]" />
      <Container className="relative py-12 sm:py-16">
        <p className="eyebrow">Markets</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Today&apos;s cryptocurrency prices</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate">
          The top 100 coins by market cap at {formatUsd(totalCap, { compact: true })} combined, with{" "}
          {formatUsd(totalVol, { compact: true })} traded in the last 24 hours.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="card p-5">
            <p className="text-sm text-slate">Top-100 market cap</p>
            <p className="num mt-2 font-display text-2xl font-bold text-white">{formatUsd(totalCap, { compact: true })}</p>
            <p className="mt-4 text-sm text-slate">BTC dominance</p>
            <p className="num mt-1 font-semibold text-white">{btcDom.toFixed(1)}%</p>
          </div>
          {highlights.map((h) => (
            <div key={h.title} className="card p-5">
              <p className="text-sm font-medium text-white">{h.title}</p>
              <ul className="mt-3 space-y-2.5">
                {h.list.map((c) => (
                  <li key={c.id}>
                    <Link href={`/price/${c.id}`} className="flex items-center justify-between gap-3 hover:opacity-80">
                      <span className="flex min-w-0 items-center gap-2">
                        <CoinIcon src={c.image} symbol={c.symbol} className="size-5" />
                        <span className="truncate text-sm text-silver">{c.symbol}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="num text-sm text-white">{formatPrice(c.current_price)}</span>
                        <Change value={c.price_change_percentage_24h} className="text-xs" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card mt-8 p-3 sm:p-5">
          <MarketTable initial={coins} initialQuery={q ?? ""} />
        </div>
        <p className="mt-4 text-xs text-muted">Market data provided by CoinGecko. Prices refresh automatically every 30 seconds.</p>
      </Container>
    </div>
  );
}
