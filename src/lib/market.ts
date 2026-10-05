import "server-only";
import { ASSET_BY_SYMBOL, TRADABLE_ASSETS } from "./assets";

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  max_supply: number | null;
  ath: number;
  sparkline_in_7d?: { price: number[] };
};

const CG = "https://api.coingecko.com/api/v3";

function cgHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { accept: "application/json", "x-cg-demo-api-key": key } : { accept: "application/json" };
}

/**
 * Top coins by market cap. Always fetches the same single URL (top 250) so every page shares
 * one cached upstream request per minute - important for CoinGecko's free-tier rate limits.
 */
export async function getMarkets(limit = 100): Promise<MarketCoin[]> {
  try {
    const res = await fetch(
      `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=1h,24h,7d`,
      { headers: cgHeaders(), next: { revalidate: 60, tags: ["markets"] } },
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = (await res.json()) as MarketCoin[];
    lastGoodMarkets = data.map((c) => ({ ...c, symbol: c.symbol.toUpperCase() }));
    return lastGoodMarkets.slice(0, limit);
  } catch (err) {
    // Rate-limited or down: serve the last good snapshot this server instance saw.
    console.error("[market] getMarkets failed", err instanceof Error ? err.message : err);
    return lastGoodMarkets.slice(0, limit);
  }
}

let lastGoodMarkets: MarketCoin[] = [];

/** Prices for every tradable asset, keyed by symbol. */
export async function getTradablePrices(): Promise<Record<string, number>> {
  const markets = await getMarkets(250);
  const out: Record<string, number> = { USD: 1 };
  for (const a of TRADABLE_ASSETS) {
    const m = markets.find((c) => c.id === a.id);
    if (m) out[a.symbol] = m.current_price;
  }
  const missing = TRADABLE_ASSETS.filter((a) => !(a.symbol in out));
  if (missing.length) {
    const fallbacks = await Promise.all(missing.map((a) => coinbaseSpot(a.symbol)));
    missing.forEach((a, i) => {
      if (fallbacks[i]) out[a.symbol] = fallbacks[i]!;
    });
  }
  return out;
}

async function coinbaseSpot(symbol: string): Promise<number | null> {
  const pair = ASSET_BY_SYMBOL[symbol]?.coinbase;
  if (!pair) return null;
  try {
    const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { amount?: string } };
    const n = Number(json.data?.amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Fresh execution price for a trade. Always fetched server-side; never trusted from the browser.
 * Tries CoinGecko (≤15s old), then Coinbase spot. Throws if no live price is available.
 */
export async function getExecutionPrice(symbol: string): Promise<number> {
  const asset = ASSET_BY_SYMBOL[symbol];
  if (!asset) throw new Error("Unsupported asset");
  try {
    const res = await fetch(`${CG}/simple/price?ids=${asset.id}&vs_currencies=usd`, {
      headers: cgHeaders(),
      next: { revalidate: 15 },
    });
    if (res.ok) {
      const json = (await res.json()) as Record<string, { usd?: number }>;
      const p = json[asset.id]?.usd;
      if (p && p > 0) return p;
    }
  } catch {
    /* fall through */
  }
  const spot = await coinbaseSpot(symbol);
  if (spot) return spot;
  throw new Error("PRICE_UNAVAILABLE");
}

export type ChartPoint = { t: number; p: number };

export async function getChart(id: string, days: string): Promise<ChartPoint[]> {
  try {
    const res = await fetch(`${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`, {
      headers: cgHeaders(),
      next: { revalidate: days === "1" ? 120 : 900 },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = (await res.json()) as { prices: [number, number][] };
    return json.prices.map(([t, p]) => ({ t, p }));
  } catch (err) {
    console.error("[market] getChart failed", err);
    return [];
  }
}

export type Candle = { time: number; open: number; high: number; low: number; close: number };

export async function getCandles(id: string, days: string): Promise<Candle[]> {
  try {
    const res = await fetch(`${CG}/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${days}`, {
      headers: cgHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const rows = (await res.json()) as [number, number, number, number, number][];
    return rows.map(([t, o, h, l, c]) => ({ time: Math.floor(t / 1000), open: o, high: h, low: l, close: c }));
  } catch (err) {
    console.error("[market] getCandles failed", err);
    return [];
  }
}

export type CoinDetail = {
  id: string;
  symbol: string;
  name: string;
  description: string;
  image: string;
  homepage?: string;
  categories: string[];
};

export async function getCoinDetail(id: string): Promise<CoinDetail | null> {
  try {
    const res = await fetch(
      `${CG}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false&market_data=false`,
      { headers: cgHeaders(), next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const j = await res.json();
    return {
      id: j.id,
      symbol: String(j.symbol).toUpperCase(),
      name: j.name,
      description: String(j.description?.en ?? "").replace(/<[^>]+>/g, ""),
      image: j.image?.large ?? "",
      homepage: j.links?.homepage?.[0] || undefined,
      categories: (j.categories ?? []).filter(Boolean).slice(0, 4),
    };
  } catch {
    return null;
  }
}

export type FearGreed = { value: number; label: string; history: { t: number; v: number }[]; yesterday: number | null; lastWeek: number | null; lastMonth: number | null };

/** Crypto Fear & Greed Index (alternative.me), refreshed hourly. Returns null if unavailable. */
export async function getFearGreed(): Promise<FearGreed | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=31", { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { value: string; value_classification: string; timestamp: string }[] };
    const rows = json.data ?? [];
    if (!rows.length) return null;
    const num = (i: number) => (rows[i] ? Number(rows[i].value) : null);
    return {
      value: Number(rows[0].value),
      label: rows[0].value_classification,
      yesterday: num(1),
      lastWeek: num(7),
      lastMonth: num(30),
      history: [...rows].reverse().map((r) => ({ t: Number(r.timestamp) * 1000, v: Number(r.value) })),
    };
  } catch {
    return null;
  }
}
