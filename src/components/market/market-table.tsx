"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownUp, Search, Star } from "lucide-react";
import type { MarketCoin } from "@/lib/market";
import { ASSET_BY_ID } from "@/lib/assets";
import { useMarkets } from "@/hooks/use-markets";
import { cn, formatPrice, formatUsd } from "@/lib/utils";
import { CoinIcon } from "./coin-icon";
import { Change } from "./change";
import { Sparkline } from "./sparkline";

type SortKey = "rank" | "price" | "change" | "volume" | "cap";
type Tab = "all" | "tradable" | "gainers" | "losers" | "watchlist";

export function MarketTable({
  initial,
  limit,
  compact,
  context = "public",
  watchlist,
  onToggleWatch,
  initialQuery = "",
}: {
  initial: MarketCoin[];
  limit?: number;
  compact?: boolean;
  context?: "public" | "dashboard";
  watchlist?: string[];
  onToggleWatch?: (id: string) => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const { coins } = useMarkets(initial);
  const [q, setQ] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });

  const rows = useMemo(() => {
    let list = coins;
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((c) => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query));
    if (tab === "tradable") list = list.filter((c) => ASSET_BY_ID[c.id]);
    if (tab === "watchlist") list = list.filter((c) => watchlist?.includes(c.id));
    if (tab === "gainers") list = [...list].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 20);
    if (tab === "losers") list = [...list].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 20);
    if (tab === "all" || tab === "tradable" || tab === "watchlist") {
      const get = (c: MarketCoin) =>
        sort.key === "rank"
          ? c.market_cap_rank
          : sort.key === "price"
            ? c.current_price
            : sort.key === "change"
              ? c.price_change_percentage_24h
              : sort.key === "volume"
                ? c.total_volume
                : c.market_cap;
      list = [...list].sort((a, b) => (get(a) - get(b)) * sort.dir);
    }
    return limit ? list.slice(0, limit) : list;
  }, [coins, q, tab, sort, limit, watchlist]);

  const href = (c: MarketCoin) =>
    context === "dashboard" && ASSET_BY_ID[c.id] ? `/dashboard/trade?asset=${c.symbol}` : `/price/${c.id}`;

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "rank" ? 1 : -1 }));

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "tradable", label: "Tradable" },
    { id: "gainers", label: "Top gainers" },
    { id: "losers", label: "Top losers" },
    ...(watchlist ? [{ id: "watchlist" as Tab, label: "Watchlist" }] : []),
  ];

  const Th = ({ k, children, className }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cn("px-4 py-3 text-xs font-medium text-muted", className)}>
      {k ? (
        <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-silver">
          {children}
          <ArrowDownUp className={cn("size-3", sort.key === k ? "text-brand-400" : "opacity-40")} />
        </button>
      ) : (
        children
      )}
    </th>
  );

  return (
    <div>
      {!compact && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-white/[0.08] text-white" : "text-slate hover:text-white",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coin name or symbol"
              className="h-10 w-full rounded-xl border border-white/10 bg-ink-950/60 pl-10 pr-3 text-sm text-white placeholder:text-muted outline-none focus:border-brand-500"
              aria-label="Search markets"
            />
          </label>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left sm:min-w-[640px]">
          <thead className="border-b border-white/5">
            <tr>
              {onToggleWatch && <th className="w-8" />}
              <Th k="rank" className="hidden w-12 sm:table-cell">#</Th>
              <Th className="pl-3 sm:pl-4">Name</Th>
              <Th k="price" className="px-2 text-right sm:px-4">Price</Th>
              <Th k="change" className="hidden text-right sm:table-cell">24h</Th>
              {!compact && <Th className="hidden text-right md:table-cell">7d</Th>}
              <Th k="volume" className="hidden text-right lg:table-cell">Volume (24h)</Th>
              <Th k="cap" className="hidden text-right md:table-cell">Market cap</Th>
              <Th className="hidden text-right sm:table-cell">Last 7 days</Th>
              <th className="hidden w-24 sm:table-cell" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 &&
              (coins.length === 0
                ? Array.from({ length: limit ?? 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="skeleton h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate">
                        No assets match your search.
                      </td>
                    </tr>
                  ))}
            {rows.map((c) => {
              const tradable = !!ASSET_BY_ID[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(href(c))}
                  className="group cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]"
                >
                  {onToggleWatch && (
                    <td className="pl-3 sm:pl-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatch(c.id);
                        }}
                        aria-label="Toggle watchlist"
                        className="text-muted hover:text-warn"
                      >
                        <Star className={cn("size-4", watchlist?.includes(c.id) && "fill-warn text-warn")} />
                      </button>
                    </td>
                  )}
                  <td className="num hidden px-4 py-3.5 text-sm text-muted sm:table-cell">{c.market_cap_rank}</td>
                  <td className="py-3.5 pl-3 pr-2 sm:px-4">
                    <Link href={href(c)} className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                      <CoinIcon src={c.image} symbol={c.symbol} />
                      <span className="min-w-0">
                        <span className="block max-w-[32vw] truncate text-sm font-semibold text-white sm:max-w-[220px]">{c.name}</span>
                        <span className="text-xs text-muted">{c.symbol}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="num py-3.5 pl-2 pr-3 text-right text-sm font-medium text-white sm:px-4">
                    {formatPrice(c.current_price)}
                    <span className="block sm:hidden"><Change value={c.price_change_percentage_24h} className="text-xs" /></span>
                  </td>
                  <td className="hidden px-4 py-3.5 text-right text-sm sm:table-cell">
                    <Change value={c.price_change_percentage_24h} />
                  </td>
                  {!compact && (
                    <td className="hidden px-4 py-3.5 text-right text-sm md:table-cell">
                      <Change value={c.price_change_percentage_7d_in_currency} />
                    </td>
                  )}
                  <td className="num hidden px-4 py-3.5 text-right text-sm text-silver lg:table-cell">
                    {formatUsd(c.total_volume, { compact: true })}
                  </td>
                  <td className="num hidden px-4 py-3.5 text-right text-sm text-silver md:table-cell">
                    {formatUsd(c.market_cap, { compact: true })}
                  </td>
                  <td className="hidden px-4 py-2 sm:table-cell">
                    <div className="flex justify-end">
                      <Sparkline data={c.sparkline_in_7d?.price} positive={(c.price_change_percentage_7d_in_currency ?? 0) >= 0} />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 text-right sm:table-cell">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        tradable
                          ? "bg-brand-600/15 text-brand-300 group-hover:bg-brand-600 group-hover:text-white"
                          : "text-slate group-hover:text-white",
                      )}
                    >
                      {tradable ? "Trade" : "Details"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
