-- =====================================================================
-- Lunobase core schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> paste -> Run.
--
-- Security model
--   * Every table has Row Level Security enabled.
--   * Users can only READ their own rows (and admins can read everything).
--   * NOTHING that moves money is writable from the browser. All balance
--     changes go through SECURITY DEFINER functions that are executable by
--     the service role only (i.e. from Lunobase server actions, after the
--     server has verified the session, the login OTP and the live price).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Platform settings (single row)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  id                    int primary key default 1 check (id = 1),
  withdrawal_lock_days  int     not null default 90 check (withdrawal_lock_days >= 0),
  trading_fee_bps       int     not null default 50 check (trading_fee_bps between 0 and 1000), -- 50 = 0.50%
  min_deposit_usd       numeric not null default 50,
  min_trade_usd         numeric not null default 5,
  deposit_addresses     jsonb   not null default '{}'::jsonb,  -- { "BTC": {"Bitcoin": "bc1..."}, "USDT": {"TRC20": "T..."} }
  bank_details          jsonb   not null default '{}'::jsonb,  -- { "bank_name": "...", "account_name": "...", ... }
  trading_enabled       boolean not null default true,
  signups_enabled       boolean not null default true,
  updated_at            timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null,
  full_name             text,
  phone                 text,
  country               text,
  role                  text not null default 'user' check (role in ('user', 'admin')),
  status                text not null default 'active' check (status in ('active', 'frozen', 'suspended')),
  kyc_status            text not null default 'unverified' check (kyc_status in ('unverified', 'pending', 'verified', 'rejected')),
  withdrawal_unlock_at  timestamptz not null default (now() + interval '90 days'),
  withdrawals_enabled   boolean not null default false,   -- admin override: allow before unlock date
  anti_phishing_code    text check (anti_phishing_code is null or char_length(anti_phishing_code) between 4 and 20),
  login_alerts          boolean not null default true,
  trade_emails          boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ---------------------------------------------------------------------
-- Balances. amount = available, locked = held for pending withdrawals.
-- ---------------------------------------------------------------------
create table if not exists public.balances (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  asset       text not null,
  amount      numeric(38, 18) not null default 0 check (amount >= 0),
  locked      numeric(38, 18) not null default 0 check (locked >= 0),
  avg_cost    numeric(38, 10) not null default 0,  -- average USD cost per unit (for P&L)
  updated_at  timestamptz not null default now(),
  primary key (user_id, asset)
);

-- ---------------------------------------------------------------------
-- Ledger: immutable record of every balance movement.
-- ---------------------------------------------------------------------
create table if not exists public.ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in (
                  'deposit', 'withdrawal_hold', 'withdrawal_refund', 'withdrawal',
                  'trade_buy', 'trade_sell', 'fee', 'adjustment')),
  asset         text not null,
  amount        numeric(38, 18) not null,           -- signed
  balance_after numeric(38, 18) not null,
  ref_id        uuid,
  memo          text,
  created_at    timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Deposits (user says "I paid" -> admin confirms -> balance credited)
-- ---------------------------------------------------------------------
create table if not exists public.deposits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  method        text not null check (method in ('crypto', 'bank')),
  asset         text not null,
  network       text,
  amount        numeric(38, 18) not null check (amount > 0),
  reference     text,             -- tx hash or bank reference
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  credited      numeric(38, 18),  -- amount actually credited (admin may correct it)
  admin_note    text,
  reviewed_by   uuid references public.profiles (id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists deposits_user_idx on public.deposits (user_id, created_at desc);
create index if not exists deposits_status_idx on public.deposits (status, created_at desc);

-- ---------------------------------------------------------------------
-- Trades (market orders executed at a server-fetched live price)
-- ---------------------------------------------------------------------
create table if not exists public.trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  side        text not null check (side in ('buy', 'sell')),
  asset       text not null,
  quantity    numeric(38, 18) not null check (quantity > 0),
  price       numeric(38, 10) not null check (price > 0),
  gross_usd   numeric(38, 10) not null,
  fee_usd     numeric(38, 10) not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists trades_user_idx on public.trades (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Withdrawals (locked until withdrawal_unlock_at, always admin-reviewed)
-- ---------------------------------------------------------------------
create table if not exists public.withdrawals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  asset        text not null,
  network      text,
  amount       numeric(38, 18) not null check (amount > 0),
  destination  text not null,
  status       text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  tx_hash      text,
  admin_note   text,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists withdrawals_user_idx on public.withdrawals (user_id, created_at desc);
create index if not exists withdrawals_status_idx on public.withdrawals (status, created_at desc);

-- ---------------------------------------------------------------------
-- Notifications (in-app bell)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null default 'info',
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  subject     text not null,
  category    text not null default 'general',
  status      text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tickets_user_idx on public.support_tickets (user_id, updated_at desc);

create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  is_staff    boolean not null default false,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

-- ---------------------------------------------------------------------
-- Watchlist
-- ---------------------------------------------------------------------
create table if not exists public.watchlist (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  coin_id     text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, coin_id)
);

-- ---------------------------------------------------------------------
-- Security: login OTP challenges, security events, rate limits, audit
-- (login_challenges / rate_limits have NO policies -> service role only)
-- ---------------------------------------------------------------------
create table if not exists public.login_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     int not null default 0,
  consumed_at  timestamptz,
  ip           text,
  user_agent   text,
  created_at   timestamptz not null default now()
);
create index if not exists login_challenges_user_idx on public.login_challenges (user_id, created_at desc);

create table if not exists public.security_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete cascade,
  event       text not null,
  ip          text,
  user_agent  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_user_idx on public.security_events (user_id, created_at desc);

create table if not exists public.rate_limits (
  key           text primary key,
  hits          int not null default 0,
  window_start  timestamptz not null default now()
);

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references public.profiles (id) on delete set null,
  action       text not null,
  target_user  uuid references public.profiles (id) on delete set null,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- =====================================================================
-- Helpers
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- New auth user -> profile + empty USD wallet. Lock period comes from settings.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_days int;
begin
  select withdrawal_lock_days into v_days from public.app_settings where id = 1;
  insert into public.profiles (id, email, full_name, country, withdrawal_unlock_at)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'country', ''),
    now() + make_interval(days => coalesce(v_days, 90))
  )
  on conflict (id) do nothing;

  insert into public.balances (user_id, asset, amount) values (new.id, 'USD', 0)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Core primitive: apply a signed delta to a balance and write the ledger.
create or replace function public._apply_balance(
  p_user uuid, p_asset text, p_delta numeric, p_type text, p_ref uuid, p_memo text
) returns numeric
language plpgsql security definer set search_path = public
as $$
declare
  v_after numeric;
begin
  insert into public.balances (user_id, asset, amount) values (p_user, p_asset, 0)
  on conflict (user_id, asset) do nothing;

  update public.balances
     set amount = amount + p_delta, updated_at = now()
   where user_id = p_user and asset = p_asset
  returning amount into v_after;

  if v_after < 0 then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  insert into public.ledger (user_id, type, asset, amount, balance_after, ref_id, memo)
  values (p_user, p_type, p_asset, p_delta, v_after, p_ref, p_memo);

  return v_after;
end $$;

create or replace function public._notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link);
$$;

create or replace function public._assert_active(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  select status into v_status from public.profiles where id = p_user;
  if v_status is null then raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_status = 'frozen' then raise exception 'ACCOUNT_FROZEN' using errcode = 'P0001'; end if;
  if v_status = 'suspended' then raise exception 'ACCOUNT_SUSPENDED' using errcode = 'P0001'; end if;
end $$;

-- =====================================================================
-- Money-moving functions (service role only)
-- =====================================================================

-- Market order. Price is fetched by the server from the live feed, never from the browser.
create or replace function public.execute_trade(
  p_user uuid, p_side text, p_asset text, p_quantity numeric, p_price numeric, p_fee_bps int
) returns public.trades
language plpgsql security definer set search_path = public
as $$
declare
  v_gross numeric;
  v_fee   numeric;
  v_trade public.trades;
  v_held  numeric;
  v_cost  numeric;
begin
  perform public._assert_active(p_user);
  if p_side not in ('buy', 'sell') then raise exception 'INVALID_SIDE' using errcode = 'P0001'; end if;
  if p_asset = 'USD' then raise exception 'INVALID_ASSET' using errcode = 'P0001'; end if;
  if p_quantity <= 0 or p_price <= 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;
  if not (select trading_enabled from public.app_settings where id = 1) then
    raise exception 'TRADING_DISABLED' using errcode = 'P0001';
  end if;

  v_gross := round(p_quantity * p_price, 8);
  v_fee   := round(v_gross * p_fee_bps / 10000.0, 8);

  insert into public.trades (user_id, side, asset, quantity, price, gross_usd, fee_usd)
  values (p_user, p_side, p_asset, p_quantity, p_price, v_gross, v_fee)
  returning * into v_trade;

  if p_side = 'buy' then
    -- lock both rows in a stable order to avoid deadlocks
    perform 1 from public.balances where user_id = p_user and asset in ('USD', p_asset) order by asset for update;
    select amount, avg_cost into v_held, v_cost from public.balances where user_id = p_user and asset = p_asset;

    perform public._apply_balance(p_user, 'USD', -v_gross, 'trade_buy', v_trade.id, 'Buy ' || p_quantity || ' ' || p_asset);
    if v_fee > 0 then
      perform public._apply_balance(p_user, 'USD', -v_fee, 'fee', v_trade.id, 'Trading fee');
    end if;
    perform public._apply_balance(p_user, p_asset, p_quantity, 'trade_buy', v_trade.id, 'Bought @ $' || p_price);

    update public.balances
       set avg_cost = case
             when coalesce(v_held, 0) + p_quantity = 0 then 0
             else (coalesce(v_held, 0) * coalesce(v_cost, 0) + v_gross + v_fee) / (coalesce(v_held, 0) + p_quantity)
           end
     where user_id = p_user and asset = p_asset;
  else
    perform 1 from public.balances where user_id = p_user and asset in ('USD', p_asset) order by asset for update;
    perform public._apply_balance(p_user, p_asset, -p_quantity, 'trade_sell', v_trade.id, 'Sold @ $' || p_price);
    perform public._apply_balance(p_user, 'USD', v_gross, 'trade_sell', v_trade.id, 'Sell ' || p_quantity || ' ' || p_asset);
    if v_fee > 0 then
      perform public._apply_balance(p_user, 'USD', -v_fee, 'fee', v_trade.id, 'Trading fee');
    end if;
  end if;

  perform public._notify(p_user, 'trade',
    initcap(p_side) || ' order filled',
    p_quantity || ' ' || p_asset || ' @ $' || round(p_price, 2),
    '/dashboard/history');

  return v_trade;
end $$;

create or replace function public.approve_deposit(p_deposit uuid, p_admin uuid, p_amount numeric, p_note text)
returns public.deposits
language plpgsql security definer set search_path = public
as $$
declare
  v_dep public.deposits;
  v_amt numeric;
begin
  select * into v_dep from public.deposits where id = p_deposit for update;
  if v_dep.id is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if v_dep.status <> 'pending' then raise exception 'ALREADY_REVIEWED' using errcode = 'P0001'; end if;

  v_amt := coalesce(p_amount, v_dep.amount);
  if v_amt <= 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;

  update public.deposits
     set status = 'approved', credited = v_amt, admin_note = p_note, reviewed_by = p_admin, reviewed_at = now()
   where id = p_deposit
  returning * into v_dep;

  perform public._apply_balance(v_dep.user_id, v_dep.asset, v_amt, 'deposit', v_dep.id, 'Deposit confirmed');
  perform public._notify(v_dep.user_id, 'deposit', 'Deposit confirmed',
    v_amt || ' ' || v_dep.asset || ' has been added to your wallet.', '/dashboard/wallet');

  insert into public.audit_log (admin_id, action, target_user, details)
  values (p_admin, 'deposit.approve', v_dep.user_id, jsonb_build_object('deposit', p_deposit, 'amount', v_amt, 'asset', v_dep.asset));
  return v_dep;
end $$;

create or replace function public.reject_deposit(p_deposit uuid, p_admin uuid, p_note text)
returns public.deposits
language plpgsql security definer set search_path = public
as $$
declare v_dep public.deposits;
begin
  update public.deposits
     set status = 'rejected', admin_note = p_note, reviewed_by = p_admin, reviewed_at = now()
   where id = p_deposit and status = 'pending'
  returning * into v_dep;
  if v_dep.id is null then raise exception 'ALREADY_REVIEWED' using errcode = 'P0001'; end if;

  perform public._notify(v_dep.user_id, 'deposit', 'Deposit could not be confirmed',
    coalesce(p_note, 'Please contact support for details.'), '/dashboard/wallet');
  insert into public.audit_log (admin_id, action, target_user, details)
  values (p_admin, 'deposit.reject', v_dep.user_id, jsonb_build_object('deposit', p_deposit, 'note', p_note));
  return v_dep;
end $$;

-- User asks to withdraw. Enforces the lock period; funds move to "locked".
create or replace function public.request_withdrawal(
  p_user uuid, p_asset text, p_network text, p_amount numeric, p_destination text
) returns public.withdrawals
language plpgsql security definer set search_path = public
as $$
declare
  v_profile public.profiles;
  v_wd      public.withdrawals;
  v_after   numeric;
begin
  perform public._assert_active(p_user);
  select * into v_profile from public.profiles where id = p_user;
  if not v_profile.withdrawals_enabled and now() < v_profile.withdrawal_unlock_at then
    raise exception 'WITHDRAWAL_LOCKED' using errcode = 'P0001';
  end if;
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;
  if exists (select 1 from public.withdrawals where user_id = p_user and status = 'pending' and created_at > now() - interval '1 minute') then
    raise exception 'TOO_MANY_REQUESTS' using errcode = 'P0001';
  end if;

  insert into public.withdrawals (user_id, asset, network, amount, destination)
  values (p_user, p_asset, p_network, p_amount, p_destination)
  returning * into v_wd;

  perform 1 from public.balances where user_id = p_user and asset = p_asset for update;
  v_after := public._apply_balance(p_user, p_asset, -p_amount, 'withdrawal_hold', v_wd.id, 'Withdrawal requested');
  update public.balances set locked = locked + p_amount where user_id = p_user and asset = p_asset;

  perform public._notify(p_user, 'withdrawal', 'Withdrawal under review',
    p_amount || ' ' || p_asset || ' is on hold while our team reviews your request.', '/dashboard/withdraw');
  return v_wd;
end $$;

create or replace function public.review_withdrawal(
  p_withdrawal uuid, p_admin uuid, p_approve boolean, p_tx_hash text, p_note text
) returns public.withdrawals
language plpgsql security definer set search_path = public
as $$
declare v_wd public.withdrawals;
begin
  select * into v_wd from public.withdrawals where id = p_withdrawal for update;
  if v_wd.id is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if v_wd.status <> 'pending' then raise exception 'ALREADY_REVIEWED' using errcode = 'P0001'; end if;

  update public.balances set locked = greatest(locked - v_wd.amount, 0), updated_at = now()
   where user_id = v_wd.user_id and asset = v_wd.asset;

  if p_approve then
    update public.withdrawals
       set status = 'completed', tx_hash = p_tx_hash, admin_note = p_note, reviewed_by = p_admin, reviewed_at = now()
     where id = p_withdrawal returning * into v_wd;
    insert into public.ledger (user_id, type, asset, amount, balance_after, ref_id, memo)
    select v_wd.user_id, 'withdrawal', v_wd.asset, 0, b.amount, v_wd.id, 'Withdrawal sent'
      from public.balances b where b.user_id = v_wd.user_id and b.asset = v_wd.asset;
    perform public._notify(v_wd.user_id, 'withdrawal', 'Withdrawal completed',
      v_wd.amount || ' ' || v_wd.asset || ' has been sent.', '/dashboard/withdraw');
  else
    update public.withdrawals
       set status = 'rejected', admin_note = p_note, reviewed_by = p_admin, reviewed_at = now()
     where id = p_withdrawal returning * into v_wd;
    perform public._apply_balance(v_wd.user_id, v_wd.asset, v_wd.amount, 'withdrawal_refund', v_wd.id, 'Withdrawal returned');
    perform public._notify(v_wd.user_id, 'withdrawal', 'Withdrawal declined',
      coalesce(p_note, 'Funds have been returned to your wallet.'), '/dashboard/withdraw');
  end if;

  insert into public.audit_log (admin_id, action, target_user, details)
  values (p_admin, case when p_approve then 'withdrawal.complete' else 'withdrawal.reject' end, v_wd.user_id,
          jsonb_build_object('withdrawal', p_withdrawal, 'amount', v_wd.amount, 'asset', v_wd.asset, 'note', p_note));
  return v_wd;
end $$;

create or replace function public.admin_adjust_balance(
  p_admin uuid, p_user uuid, p_asset text, p_delta numeric, p_memo text
) returns numeric
language plpgsql security definer set search_path = public
as $$
declare v_after numeric;
begin
  if p_delta = 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;
  v_after := public._apply_balance(p_user, upper(p_asset), p_delta, 'adjustment', null, coalesce(p_memo, 'Balance adjustment'));
  perform public._notify(p_user, 'adjustment',
    case when p_delta > 0 then 'Funds credited' else 'Balance adjusted' end,
    abs(p_delta) || ' ' || upper(p_asset) || case when p_delta > 0 then ' added to' else ' removed from' end || ' your wallet.',
    '/dashboard/wallet');
  insert into public.audit_log (admin_id, action, target_user, details)
  values (p_admin, 'balance.adjust', p_user, jsonb_build_object('asset', upper(p_asset), 'delta', p_delta, 'memo', p_memo));
  return v_after;
end $$;

-- Fixed-window rate limiter. Returns true when the call is allowed.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_hits int;
begin
  insert into public.rate_limits as r (key, hits, window_start) values (p_key, 1, now())
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;

-- Lock down: only the service role may call money/security functions.
do $$
declare f text;
begin
  foreach f in array array[
    'public._apply_balance(uuid, text, numeric, text, uuid, text)',
    'public._notify(uuid, text, text, text, text)',
    'public._assert_active(uuid)',
    'public.execute_trade(uuid, text, text, numeric, numeric, int)',
    'public.approve_deposit(uuid, uuid, numeric, text)',
    'public.reject_deposit(uuid, uuid, text)',
    'public.request_withdrawal(uuid, text, text, numeric, text)',
    'public.review_withdrawal(uuid, uuid, boolean, text, text)',
    'public.admin_adjust_balance(uuid, uuid, text, numeric, text)',
    'public.hit_rate_limit(text, int, int)',
    'public.handle_new_user()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.app_settings     enable row level security;
alter table public.profiles         enable row level security;
alter table public.balances         enable row level security;
alter table public.ledger           enable row level security;
alter table public.deposits         enable row level security;
alter table public.trades           enable row level security;
alter table public.withdrawals      enable row level security;
alter table public.notifications    enable row level security;
alter table public.support_tickets  enable row level security;
alter table public.ticket_messages  enable row level security;
alter table public.watchlist        enable row level security;
alter table public.login_challenges enable row level security;
alter table public.security_events  enable row level security;
alter table public.rate_limits      enable row level security;
alter table public.audit_log        enable row level security;

-- Read-own / admin-read-all policies
do $$
declare t text;
begin
  foreach t in array array['balances','ledger','deposits','trades','withdrawals','notifications','support_tickets','watchlist','security_events'] loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s', t);
    execute format('create policy "%1$s_select_own" on public.%1$s for select to authenticated using (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "ticket_messages_select_own" on public.ticket_messages;
create policy "ticket_messages_select_own" on public.ticket_messages for select to authenticated
  using (public.is_admin() or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));

drop policy if exists "settings_read" on public.app_settings;
create policy "settings_read" on public.app_settings for select to authenticated using (true);

drop policy if exists "audit_admin_read" on public.audit_log;
create policy "audit_admin_read" on public.audit_log for select to authenticated using (public.is_admin());

-- No insert/update/delete policies anywhere: every write goes through the server.

-- =====================================================================
-- Realtime (dashboard updates instantly when a trade fills or admin confirms a payment)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['balances','ledger','deposits','withdrawals','trades','notifications','ticket_messages','support_tickets'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- Make yourself admin (run after you register):
--   update public.profiles set role = 'admin' where email = 'you@lunobase.com';
-- =====================================================================
