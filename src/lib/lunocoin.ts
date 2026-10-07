/**
 * LunoCoin (LNC) loyalty rewards: every number lives here.
 * LNC is earned, never sold. It has no price, no cash value and cannot be withdrawn.
 */
export const LNC = {
  name: "LunoCoin",
  symbol: "LNC",
  rewards: {
    signup: 100, // sign up and verify your email
    kyc: 500, // identity verification approved
    firstDeposit: 300, // first deposit approved
    tradePer: 2, // LNC earned ...
    tradeUnit: 10, // ... for every 10 USDT traded
    referral: 300, // each friend you refer who makes a trade
    share: 20, // each share, once per channel per day
    checkin: 5, // daily check-in
    streakBonus: 50, // bonus on every 7th day in a row
    streakDays: 7,
  },
  /** Trading fee discounts, highest first. */
  tiers: [
    { name: "Gold", min: 10_000, discount: 0.5 },
    { name: "Silver", min: 1_000, discount: 0.2 },
  ],
} as const;

export const SHARE_CHANNELS = ["whatsapp", "facebook", "x", "telegram"] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

export type LncTier = { name: string; min: number; discount: number };

/** The tier a balance qualifies for (Member = no discount). */
export function lncTier(balance: number): LncTier {
  return LNC.tiers.find((t) => balance >= t.min) ?? { name: "Member", min: 0, discount: 0 };
}

/** The next tier up, or null when the user is already at the top. */
export function nextLncTier(balance: number): LncTier | null {
  return [...LNC.tiers].reverse().find((t) => balance < t.min) ?? null;
}

/** Trading fee in whole basis points after the LNC discount (rounded in the user's favour). */
export function discountedFeeBps(baseBps: number, balance: number) {
  return Math.floor(baseBps * (1 - lncTier(balance).discount));
}

/** LNC earned for a trade of the given USDT value. */
export function tradeReward(grossUsdt: number) {
  return Math.floor(grossUsdt / LNC.rewards.tradeUnit) * LNC.rewards.tradePer;
}

export function formatLnc(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** UTC day key (YYYY-MM-DD) used to limit daily rewards. */
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
