-- =====================================================================
-- Lunobase 0004: LunoCoin (LNC) loyalty rewards.
-- LNC is EARNED, never sold: no price, no cash value, cannot be withdrawn.
-- Run AFTER 0003. Supabase -> SQL Editor -> paste -> Run. Safe to re-run.
-- =====================================================================

-- Every LNC movement. (user_id, kind, ref) is unique so a reward can never be paid twice.
create table if not exists public.lnc_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null,              -- signup, kyc, first_deposit, trade, referral, share, checkin, streak, admin
  amount      numeric(20, 2) not null,
  ref         text not null default 'once',
  memo        text,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index if not exists lnc_ledger_user_idx on public.lnc_ledger (user_id, created_at desc);

create table if not exists public.lnc_balances (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  amount      numeric(20, 2) not null default 0 check (amount >= 0),
  updated_at  timestamptz not null default now()
);

-- People who asked for LunoCoin news (public page).
create table if not exists public.lnc_waitlist (
  email       text primary key,
  created_at  timestamptz not null default now()
);

alter table public.lnc_ledger enable row level security;
alter table public.lnc_balances enable row level security;
alter table public.lnc_waitlist enable row level security;

drop policy if exists "lnc_ledger_select_own" on public.lnc_ledger;
create policy "lnc_ledger_select_own" on public.lnc_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "lnc_balances_select_own" on public.lnc_balances;
create policy "lnc_balances_select_own" on public.lnc_balances for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- lnc_waitlist: no policies, server only.

-- Award (or, with a negative amount, remove) LNC exactly once per (user, kind, ref).
-- Returns the amount actually applied: 0 when this reward was already given.
create or replace function public.lnc_award(
  p_user uuid, p_kind text, p_amount numeric, p_ref text, p_memo text
) returns numeric
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_amount = 0 then return 0; end if;

  insert into public.lnc_ledger (user_id, kind, amount, ref, memo)
  values (p_user, p_kind, p_amount, coalesce(nullif(p_ref, ''), 'once'), p_memo)
  on conflict (user_id, kind, ref) do nothing
  returning id into v_id;

  if v_id is null then return 0; end if;   -- already rewarded

  insert into public.lnc_balances (user_id, amount) values (p_user, greatest(p_amount, 0))
  on conflict (user_id) do update
    set amount = greatest(public.lnc_balances.amount + p_amount, 0), updated_at = now();

  -- Notify for the bigger rewards only; small everyday ones (trades, shares, check-ins) would be noise.
  if p_amount > 0 and p_kind not in ('trade', 'share', 'checkin') then
    insert into public.notifications (user_id, kind, title, body, link)
    values (p_user, 'lnc', '+' || rtrim(rtrim(to_char(p_amount, 'FM999G999G990D00'), '0'), '.') || ' LNC earned', coalesce(p_memo, 'LunoCoin reward'), '/dashboard/rewards');
  end if;
  return p_amount;
end $$;

revoke all on function public.lnc_award(uuid, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.lnc_award(uuid, text, numeric, text, text) to service_role;

-- live balance updates in the dashboard
do $$
begin
  begin
    alter publication supabase_realtime add table public.lnc_balances;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
