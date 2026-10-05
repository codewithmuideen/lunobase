// Assets that can be held, traded, deposited and withdrawn on Lunobase.
// `id` is the CoinGecko id used for live pricing; `coinbase` is the fallback spot pair.

export type AssetInfo = {
  symbol: string;
  name: string;
  id: string;
  coinbase?: string;
  networks: string[];
  color: string;
};

export const TRADABLE_ASSETS: AssetInfo[] = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin", coinbase: "BTC-USD", networks: ["Bitcoin"], color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum", coinbase: "ETH-USD", networks: ["Ethereum (ERC20)", "Arbitrum", "Base"], color: "#627EEA" },
  { symbol: "USDT", name: "Tether", id: "tether", coinbase: "USDT-USD", networks: ["Tron (TRC20)", "Ethereum (ERC20)", "BNB Smart Chain"], color: "#26A17B" },
  { symbol: "USDC", name: "USD Coin", id: "usd-coin", coinbase: "USDC-USD", networks: ["Ethereum (ERC20)", "Solana", "Base"], color: "#2775CA" },
  { symbol: "SOL", name: "Solana", id: "solana", coinbase: "SOL-USD", networks: ["Solana"], color: "#9945FF" },
  { symbol: "BNB", name: "BNB", id: "binancecoin", networks: ["BNB Smart Chain"], color: "#F3BA2F" },
  { symbol: "XRP", name: "XRP", id: "ripple", coinbase: "XRP-USD", networks: ["XRP Ledger"], color: "#8C9BAD" },
  { symbol: "ADA", name: "Cardano", id: "cardano", coinbase: "ADA-USD", networks: ["Cardano"], color: "#0033AD" },
  { symbol: "DOGE", name: "Dogecoin", id: "dogecoin", coinbase: "DOGE-USD", networks: ["Dogecoin"], color: "#C2A633" },
  { symbol: "TRX", name: "TRON", id: "tron", networks: ["Tron (TRC20)"], color: "#EF0027" },
  { symbol: "AVAX", name: "Avalanche", id: "avalanche-2", coinbase: "AVAX-USD", networks: ["Avalanche C-Chain"], color: "#E84142" },
  { symbol: "LINK", name: "Chainlink", id: "chainlink", coinbase: "LINK-USD", networks: ["Ethereum (ERC20)"], color: "#2A5ADA" },
  { symbol: "DOT", name: "Polkadot", id: "polkadot", coinbase: "DOT-USD", networks: ["Polkadot"], color: "#E6007A" },
  { symbol: "LTC", name: "Litecoin", id: "litecoin", coinbase: "LTC-USD", networks: ["Litecoin"], color: "#345D9D" },
  { symbol: "TON", name: "Toncoin", id: "the-open-network", networks: ["TON"], color: "#0098EA" },
  { symbol: "SHIB", name: "Shiba Inu", id: "shiba-inu", coinbase: "SHIB-USD", networks: ["Ethereum (ERC20)"], color: "#FFA409" },
];

export const CASH = { symbol: "USD", name: "US Dollar" } as const;

/** Everything is bought and sold against this asset. */
export const QUOTE = "USDT";
/** Assets users can fund their account with (each has its own deposit address). */
export const FUNDING_ASSETS = ["BTC", "ETH", "USDT"];
/** Assets that can be traded against the quote asset. */
export const TRADE_ASSETS = () => TRADABLE_ASSETS.filter((a) => a.symbol !== QUOTE);

export const ASSET_BY_SYMBOL = Object.fromEntries(TRADABLE_ASSETS.map((a) => [a.symbol, a])) as Record<string, AssetInfo>;
export const ASSET_BY_ID = Object.fromEntries(TRADABLE_ASSETS.map((a) => [a.id, a])) as Record<string, AssetInfo>;

export const DEPOSITABLE = ["USD", ...TRADABLE_ASSETS.map((a) => a.symbol)];

export function isTradable(symbol: string) {
  return symbol in ASSET_BY_SYMBOL;
}
