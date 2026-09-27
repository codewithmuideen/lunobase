"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import type { MarketCoin } from "@/lib/market";
import { toggleWatchlistAction } from "@/actions/account";
import { MarketTable } from "@/components/market/market-table";

export function WatchlistMarkets({ initial, watchlist }: { initial: MarketCoin[]; watchlist: string[] }) {
  const [, start] = useTransition();
  const [list, setList] = useOptimistic(watchlist);

  const toggle = (id: string) =>
    start(async () => {
      setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
      const res = await toggleWatchlistAction(id);
      if (!res.ok) toast.error(res.error);
    });

  return <MarketTable initial={initial} context="dashboard" watchlist={list} onToggleWatch={toggle} />;
}
