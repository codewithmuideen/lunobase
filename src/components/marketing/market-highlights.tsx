"use client";

import Link from "next/link";
import { Activity, Crown, Flame, Rocket, TrendingDown, TrendingUp } from "lucide-react";
import type { MarketCoin } from "@/lib/market";
import { useMarkets } from "@/hooks/use-markets";
import { formatPrice, formatUsd } from "@/lib/utils";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";
import { Sparkline } from "@/components/market/sparkline";
import { Spotlight } from "@/components/ui/motion";

/** Six live "category" tiles computed from the top-100 market data. */
export function MarketHighlights({ initial }: { initial: MarketCoin[] }) {
  const { coins } = useMarkets(initial);
  if (!coins.length) return null;
  // Top 60 by market cap, excluding stablecoins / pegged tokens (7-day range under 3%).
  const top = coins.slice(0, 60).filter((c) => {
    const s = c.sparkline_in_7d?.price ?? [];
    if (s.length < 2) return true;
    const min = Math.min(...s);
    return (Math.max(...s) - min) / min > 0.03;
  });
  if (!top.length) return null;
  const by = <T,>(f: (c: MarketCoin) => T, dir: 1 | -1) => [...top].sort((a, b) => ((f(a) as number) - (f(b) as number)) * dir)[0];

  const tiles: { label: string; icon: typeof Flame; coin: MarketCoin; stat: React.ReactNode }[] = [
    { label: "Highest volume", icon: Activity, coin: by((c) => c.total_volume, -1), stat: null },
    { label: "Top gainer 24h", icon: TrendingUp, coin: by((c) => c.price_change_percentage_24h, -1), stat: null },
    { label: "Top loser 24h", icon: TrendingDown, coin: by((c) => c.price_change_percentage_24h, 1), stat: null },
    { label: "Best this week", icon: Rocket, coin: by((c) => c.price_change_percentage_7d_in_currency ?? 0, -1), stat: null },
    { label: "Largest market cap", icon: Crown, coin: top[0], stat: null },
    { label: "Biggest move 1h", icon: Flame, coin: by((c) => Math.abs(c.price_change_percentage_1h_in_currency ?? 0), -1), stat: null },
  ];
  tiles[0].stat = <span className="text-xs text-slate">{formatUsd(tiles[0].coin.total_volume, { compact: true })} vol</span>;
  tiles[3].stat = <Change value={tiles[3].coin.price_change_percentage_7d_in_currency} className="text-xs" />;
  tiles[4].stat = <span className="text-xs text-slate">{formatUsd(tiles[4].coin.market_cap, { compact: true })}</span>;
  tiles[5].stat = <Change value={tiles[5].coin.price_change_percentage_1h_in_currency} className="text-xs" />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map(({ label, icon: Icon, coin, stat }) => (
        <Spotlight key={label} className="rounded-2xl">
          <Link
            href={`/price/${coin.id}`}
            className="group block h-full rounded-2xl border border-white/[0.07] bg-ink-850/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-transparent"
          >
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Icon className="size-3.5 text-brand-400" /> {label}
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <CoinIcon src={coin.image} symbol={coin.symbol} className="size-8" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{coin.name}</p>
                <p className="num text-xs text-silver">{formatPrice(coin.current_price)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              {stat ?? <Change value={coin.price_change_percentage_24h} className="text-xs" />}
              <Sparkline data={coin.sparkline_in_7d?.price} width={56} height={20} fill={false} />
            </div>
          </Link>
        </Spotlight>
      ))}
    </div>
  );
}
