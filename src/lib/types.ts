export type Role = "user" | "admin";
export type AccountStatus = "active" | "frozen" | "suspended";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  role: Role;
  status: AccountStatus;
  kyc_status: "unverified" | "pending" | "verified" | "rejected";
  withdrawal_unlock_at: string;
  withdrawals_enabled: boolean;
  anti_phishing_code: string | null;
  login_alerts: boolean;
  trade_emails: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type Balance = {
  user_id: string;
  asset: string;
  amount: string | number;
  locked: string | number;
  avg_cost: string | number;
  updated_at: string;
};

export type LedgerEntry = {
  id: string;
  user_id: string;
  type: "deposit" | "withdrawal_hold" | "withdrawal_refund" | "withdrawal" | "trade_buy" | "trade_sell" | "fee" | "adjustment";
  asset: string;
  amount: string | number;
  balance_after: string | number;
  ref_id: string | null;
  memo: string | null;
  created_at: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  method: "crypto" | "bank";
  asset: string;
  network: string | null;
  amount: string | number;
  reference: string | null;
  status: "pending" | "approved" | "rejected";
  credited: string | number | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  side: "buy" | "sell";
  asset: string;
  quantity: string | number;
  price: string | number;
  gross_usd: string | number;
  fee_usd: string | number;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  asset: string;
  network: string | null;
  amount: string | number;
  destination: string;
  status: "pending" | "completed" | "rejected";
  tx_hash: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string | null;
  is_staff: boolean;
  body: string;
  created_at: string;
};

export type SecurityEvent = {
  id: string;
  user_id: string;
  event: string;
  ip: string | null;
  user_agent: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export type AppSettings = {
  id: number;
  withdrawal_lock_days: number;
  trading_fee_bps: number;
  min_deposit_usd: number;
  min_trade_usd: number;
  deposit_addresses: Record<string, Record<string, string>>;
  bank_details: Record<string, string>;
  trading_enabled: boolean;
  signups_enabled: boolean;
  updated_at: string;
};

/** Shape returned by every server action. */
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
