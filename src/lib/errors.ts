const FRIENDLY: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction.",
  ACCOUNT_FROZEN: "Your account is frozen. Contact support to restore access.",
  ACCOUNT_SUSPENDED: "Your account is suspended. Contact support.",
  ACCOUNT_NOT_FOUND: "Account not found.",
  WITHDRAWAL_LOCKED: "Withdrawals are paused on your account. Please contact support.",
  TRADING_DISABLED: "Trading is temporarily paused for maintenance.",
  INVALID_AMOUNT: "Enter a valid amount.",
  INVALID_ASSET: "This asset isn't supported.",
  INVALID_SIDE: "Invalid order side.",
  ALREADY_REVIEWED: "This request has already been reviewed.",
  NOT_FOUND: "Record not found.",
  TOO_MANY_REQUESTS: "Please wait a minute before submitting another request.",
  PRICE_UNAVAILABLE: "Live price is temporarily unavailable. Please try again in a moment.",
};

export function friendlyError(message: string | undefined | null) {
  if (!message) return "Something went wrong. Please try again.";
  // A balance going below zero is stopped by the database CHECK constraint.
  if (/balances_amount_check|balances_locked_check/.test(message)) return FRIENDLY.INSUFFICIENT_BALANCE;
  const code = Object.keys(FRIENDLY).find((k) => message.includes(k));
  return code ? FRIENDLY[code] : "Something went wrong. Please try again.";
}
