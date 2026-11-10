-- X-ING Pro Shop Lab: Shop plan customer list.
-- Applied to Supabase project yeoraqksuvaohauxvvgt on 2026-11-10 (as migrations "customers" + "customers_private_helper").
-- A customer is a pro shop's contact card for one of its bowlers. The bowler's specs and arsenal stay
-- in user_store ('layoutlab.bowlers', keyed by bowler name); bowler_key links the two.
-- Only a paid Shop account can read or write customers, enforced here (not just in the page).

-- The helper lives in schema `private`, which the API doesn't expose, so it can't be called as /rpc.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_paid_shop() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.plan = 'shop' and p.plan_status in ('trialing', 'active', 'past_due')
  );
$$;
revoke execute on function private.is_paid_shop() from anon, public;
grant execute on function private.is_paid_shop() to authenticated;

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bowler_key  text not null check (length(bowler_key) between 1 and 200),
  phone       text check (length(phone) <= 40),
  email       text check (length(email) <= 200),
  notes       text check (length(notes) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (shop_id, bowler_key)
);
alter table public.customers enable row level security;

create policy "customers: shop reads own"   on public.customers for select to authenticated
  using (shop_id = (select auth.uid()) and (select private.is_paid_shop()));
create policy "customers: shop inserts own" on public.customers for insert to authenticated
  with check (shop_id = (select auth.uid()) and (select private.is_paid_shop()));
create policy "customers: shop updates own" on public.customers for update to authenticated
  using (shop_id = (select auth.uid()) and (select private.is_paid_shop()))
  with check (shop_id = (select auth.uid()) and (select private.is_paid_shop()));
create policy "customers: shop deletes own" on public.customers for delete to authenticated
  using (shop_id = (select auth.uid()) and (select private.is_paid_shop()));
revoke all on public.customers from anon;

create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
