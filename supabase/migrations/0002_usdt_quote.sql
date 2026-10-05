-- =====================================================================
-- Lunobase 0002: trade against USDT instead of a USD cash balance.
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Safe to run more than once.
-- =====================================================================

-- Which currency a trade was priced/settled in (older rows were USD).
alter table public.trades add column if not exists quote text not null default 'USD';

-- Market order settled in a quote asset (USDT). `p_price` is the price of one unit of
-- p_asset expressed in p_quote, fetched by the server from the live feed.
-- (gross_usd / fee_usd hold the amounts in the quote asset; USDT ~ 1 USD.)
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

  -- make sure both balance rows exist, then lock them in a stable order
  insert into public.balances (user_id, asset, amount) values (p_user, p_asset, 0), (p_user, p_quote, 0)
  on conflict (user_id, asset) do nothing;
  perform 1 from public.balances where user_id = p_user and asset in (p_quote, p_asset) order by asset for update;

  -- friendly error instead of a raw constraint violation
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

  perform public._notify(p_user, 'trade',
    initcap(p_side) || ' order filled',
    p_quantity || ' ' || p_asset || ' @ ' || round(p_price, 2) || ' ' || p_quote,
    '/dashboard/history');

  return v_trade;
end $$;

revoke all on function public.execute_trade_quote(uuid, text, text, text, numeric, numeric, int) from public, anon, authenticated;
grant execute on function public.execute_trade_quote(uuid, text, text, text, numeric, numeric, int) to service_role;

-- Tell PostgREST about the new function straight away.
notify pgrst, 'reload schema';
