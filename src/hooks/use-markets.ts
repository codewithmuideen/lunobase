"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketCoin } from "@/lib/market";

/** Live market data: starts from server-rendered data, then refreshes every `intervalMs`. */
export function useMarkets(initial: MarketCoin[], intervalMs = 30_000) {
  const [coins, setCoins] = useState<MarketCoin[]>(initial);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    let alive = true;
    async function load() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/markets");
        if (!res.ok) return;
        const data = (await res.json()) as MarketCoin[];
        if (alive && data.length) {
          setCoins(data);
          setUpdatedAt(Date.now());
        }
      } catch {
        /* keep last good data */
      }
    }
    if (!initial.length) load();
    const t = setInterval(load, intervalMs);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial.length, intervalMs]);

  const bySymbol = useMemo(() => {
    const m: Record<string, MarketCoin> = {};
    for (const c of coins) if (!m[c.symbol]) m[c.symbol] = c;
    return m;
  }, [coins]);

  return { coins, bySymbol, updatedAt };
}
