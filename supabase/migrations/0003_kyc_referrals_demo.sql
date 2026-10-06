-- =====================================================================
-- Lunobase 0003: identity verification (KYC), referral programme, demo account.
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. KYC submissions (documents live in the private "kyc" storage bucket)
-- ---------------------------------------------------------------------
create table if not exists public.kyc_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  legal_name   text not null,
  date_of_birth date not null,
  country      text not null,
  doc_type     text not null check (doc_type in ('passport', 'national_id', 'drivers_license')),
  doc_number   text not null,
  front_path   text not null,
  back_path    text,
  selfie_path  text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note   text,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists kyc_user_idx on public.kyc_submissions (user_id, created_at desc);
create index if not exists kyc_status_idx on public.kyc_submissions (status, created_at);

alter table public.kyc_submissions enable row level security;
drop policy if exists "kyc_select_own" on public.kyc_submissions;
create policy "kyc_select_own" on public.kyc_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Referrals
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles (id) on delete set null;
create unique index if not exists profiles_referral_code_idx on public.profiles (referral_code);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- share of each trading fee paid to the referrer, in basis points (2000 = 20%)
alter table public.app_settings add column if not exists referral_commission_bps int not null default 2000
  check (referral_commission_bps between 0 and 5000);

-- give every existing account a code
update public.profiles
   set referral_code = upper(substr(md5(id::text), 1, 8))
 where referral_code is null;

-- New accounts: create profile, referral code, and link to the referrer if a valid code was used.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_days int;
  v_ref  uuid;
begin
  select withdrawal_lock_days into v_days from public.app_settings where id = 1;
  select id into v_ref from public.profiles
   where referral_code = upper(nullif(new.raw_user_meta_data ->> 'ref', ''))
   limit 1;

  insert into public.profiles (id, email, full_name, country, withdrawal_unlock_at, referral_code, referred_by)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'country', ''),
    now() + make_interval(days => coalesce(v_days, 0)),
    upper(substr(md5(new.id::text), 1, 8)),
    v_ref
  )
  on conflict (id) do nothing;

  insert into public.balances (user_id, asset, amount) values (new.id, 'USD', 0)
  on conflict do nothing;
  return new;
end $$;

-- Trading function, now paying the referrer their share of the fee.
create or replace function public.execute_trade_quote(
  p_user uuid, p_side text, p_asset text, p_quote text, p_quantity numeric, p_price numeric, p_fee_bps int
) returns public.trades
language plpgsql security definer set search_path = public
as $$
declare
  v_gross numeric;
  v_fee   numeric;
  v_trade public.trades;
  v_held  numeric;
  v_cost  numeric;
  v_referrer uuid;
  v_rate  int;
  v_comm  numeric;
begin
  perform public._assert_active(p_user);
  if p_side not in ('buy', 'sell') then raise exception 'INVALID_SIDE' using errcode = 'P0001'; end if;
  if p_asset = p_quote then raise exception 'INVALID_ASSET' using errcode = 'P0001'; end if;
  if p_quantity <= 0 or p_price <= 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;
  if not (select trading_enabled from public.app_settings where id = 1) then
    raise exception 'TRADING_DISABLED' using errcode = 'P0001';
  end if;

  v_gross := round(p_quantity * p_price, 8);
  v_fee   := round(v_gross * p_fee_bps / 10000.0, 8);

  insert into public.trades (user_id, side, asset, quote, quantity, price, gross_usd, fee_usd)
  values (p_user, p_side, p_asset, p_quote, p_quantity, p_price, v_gross, v_fee)
  returning * into v_trade;

  insert into public.balances (user_id, asset, amount) values (p_user, p_asset, 0), (p_user, p_quote, 0)
  on conflict (user_id, asset) do nothing;
  perform 1 from public.balances where user_id = p_user and asset in (p_quote, p_asset) order by asset for update;

  if p_side = 'buy' then
    if (select amount from public.balances where user_id = p_user and asset = p_quote) < v_gross + v_fee then
      raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
    end if;
    select amount, avg_cost into v_held, v_cost from public.balances where user_id = p_user and asset = p_asset;

    perform public._apply_balance(p_user, p_quote, -v_gross, 'trade_buy', v_trade.id, 'Buy ' || p_quantity || ' ' || p_asset);
    if v_fee > 0 then
      perform public._apply_balance(p_user, p_quote, -v_fee, 'fee', v_trade.id, 'Trading fee');
    end if;
    perform public._apply_balance(p_user, p_asset, p_quantity, 'trade_buy', v_trade.id, 'Bought @ ' || p_price || ' ' || p_quote);

    update public.balances
       set avg_cost = case
             when coalesce(v_held, 0) + p_quantity = 0 then 0
             else (coalesce(v_held, 0) * coalesce(v_cost, 0) + v_gross + v_fee) / (coalesce(v_held, 0) + p_quantity)
           end
     where user_id = p_user and asset = p_asset;
  else
    if (select amount from public.balances where user_id = p_user and asset = p_asset) < p_quantity then
      raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
    end if;
    perform public._apply_balance(p_user, p_asset, -p_quantity, 'trade_sell', v_trade.id, 'Sold @ ' || p_price || ' ' || p_quote);
    perform public._apply_balance(p_user, p_quote, v_gross, 'trade_sell', v_trade.id, 'Sell ' || p_quantity || ' ' || p_asset);
    if v_fee > 0 then
      perform public._apply_balance(p_user, p_quote, -v_fee, 'fee', v_trade.id, 'Trading fee');
    end if;
  end if;

  -- Referral commission: a share of the fee this user just paid goes to whoever referred them.
  if v_fee > 0 then
    select referred_by into v_referrer from public.profiles where id = p_user;
    select referral_commission_bps into v_rate from public.app_settings where id = 1;
    if v_referrer is not null and v_referrer <> p_user and coalesce(v_rate, 0) > 0 then
      v_comm := round(v_fee * v_rate / 10000.0, 8);
      if v_comm > 0 then
        perform public._apply_balance(v_referrer, p_quote, v_comm, 'adjustment', v_trade.id, 'Referral commission');
      end if;
    end if;
  end if;

  perform public._notify(p_user, 'trade',
    initcap(p_side) || ' order filled',
    p_quantity || ' ' || p_asset || ' @ ' || round(p_price, 2) || ' ' || p_quote,
    '/dashboard/history');

  return v_trade;
end $$;

-- ---------------------------------------------------------------------
-- 3. Demo account (practice funds only; completely separate from real balances)
-- ---------------------------------------------------------------------
create table if not exists public.demo_balances (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  asset     text not null,
  amount    numeric(38, 18) not null default 0 check (amount >= 0),
  avg_cost  numeric(38, 10) not null default 0,
  primary key (user_id, asset)
);

create table if not exists public.demo_trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  side        text not null check (side in ('buy', 'sell')),
  asset       text not null,
  quantity    numeric(38, 18) not null check (quantity > 0),
  price       numeric(38, 10) not null check (price > 0),
  gross       numeric(38, 10) not null,
  created_at  timestamptz not null default now()
);
create index if not exists demo_trades_user_idx on public.demo_trades (user_id, created_at desc);

alter table public.demo_balances enable row level security;
alter table public.demo_trades enable row level security;
drop policy if exists "demo_balances_select_own" on public.demo_balances;
create policy "demo_balances_select_own" on public.demo_balances for select to authenticated using (user_id = auth.uid());
drop policy if exists "demo_trades_select_own" on public.demo_trades;
create policy "demo_trades_select_own" on public.demo_trades for select to authenticated using (user_id = auth.uid());

-- Start (or restart) a demo account with 10,000 practice USDT.
create or replace function public.demo_reset(p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.demo_trades where user_id = p_user;
  delete from public.demo_balances where user_id = p_user;
  insert into public.demo_balances (user_id, asset, amount) values (p_user, 'USDT', 10000);
end $$;

-- Practice market order against demo USDT. No fees, no ledger, no effect on real funds.
create or replace function public.demo_trade(
  p_user uuid, p_side text, p_asset text, p_quantity numeric, p_price numeric
) returns public.demo_trades
language plpgsql security definer set search_path = public
as $$
declare
  v_gross numeric;
  v_row   public.demo_trades;
  v_held  numeric;
  v_cost  numeric;
begin
  if p_side not in ('buy', 'sell') then raise exception 'INVALID_SIDE' using errcode = 'P0001'; end if;
  if p_asset = 'USDT' then raise exception 'INVALID_ASSET' using errcode = 'P0001'; end if;
  if p_quantity <= 0 or p_price <= 0 then raise exception 'INVALID_AMOUNT' using errcode = 'P0001'; end if;

  -- first use: seed the practice balance
  if not exists (select 1 from public.demo_balances where user_id = p_user) then
    insert into public.demo_balances (user_id, asset, amount) values (p_user, 'USDT', 10000);
  end if;
  insert into public.demo_balances (user_id, asset, amount) values (p_user, p_asset, 0), (p_user, 'USDT', 0)
  on conflict (user_id, asset) do nothing;
  perform 1 from public.demo_balances where user_id = p_user and asset in ('USDT', p_asset) order by asset for update;

  v_gross := round(p_quantity * p_price, 8);

  if p_side = 'buy' then
    if (select amount from public.demo_balances where user_id = p_user and asset = 'USDT') < v_gross then
      raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
    end if;
    select amount, avg_cost into v_held, v_cost from public.demo_balances where user_id = p_user and asset = p_asset;
    update public.demo_balances set amount = amount - v_gross where user_id = p_user and asset = 'USDT';
    update public.demo_balances
       set amount = amount + p_quantity,
           avg_cost = (coalesce(v_held, 0) * coalesce(v_cost, 0) + v_gross) / (coalesce(v_held, 0) + p_quantity)
     where user_id = p_user and asset = p_asset;
  else
    if (select amount from public.demo_balances where user_id = p_user and asset = p_asset) < p_quantity then
      raise exception 'INSUFFICIENT_BALANCE' using errcode = 'P0001';
    end if;
    update public.demo_balances set amount = amount - p_quantity where user_id = p_user and asset = p_asset;
    update public.demo_balances set amount = amount + v_gross where user_id = p_user and asset = 'USDT';
  end if;

  insert into public.demo_trades (user_id, side, asset, quantity, price, gross)
  values (p_user, p_side, p_asset, p_quantity, p_price, v_gross)
  returning * into v_row;
  return v_row;
end $$;

-- Only the server may call these.
do $$
declare f text;
begin
  foreach f in array array[
    'public.execute_trade_quote(uuid, text, text, text, numeric, numeric, int)',
    'public.handle_new_user()',
    'public.demo_reset(uuid)',
    'public.demo_trade(uuid, text, text, numeric, numeric)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
