"use client";

import type { MarketCoin } from "@/lib/market";
import { useMarkets } from "@/hooks/use-markets";
import { formatPrice } from "@/lib/utils";
import { CoinIcon } from "@/components/market/coin-icon";
import { Change } from "@/components/market/change";

export function Ticker({ initial }: { initial: MarketCoin[] }) {
  const { coins } = useMarkets(initial);
  const list = coins.slice(0, 20);
  if (!list.length) return null;
  return (
    <div className="mask-fade-x relative overflow-hidden border-y border-white/5 bg-ink-950/50 py-3.5">
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {[...list, ...list].map((c, i) => (
          <div key={`${c.id}-${i}`} className="flex items-center gap-2.5 text-sm" aria-hidden={i >= list.length}>
            <CoinIcon src={c.image} symbol={c.symbol} className="size-5" />
            <span className="font-semibold text-white">{c.symbol}</span>
            <span className="num text-silver">{formatPrice(c.current_price)}</span>
            <Change value={c.price_change_percentage_24h} className="text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
