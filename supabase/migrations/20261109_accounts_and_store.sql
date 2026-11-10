-- X-ING Pro Shop Lab: accounts, plans and per-user storage.
-- Applied to Supabase project yeoraqksuvaohauxvvgt on 2026-11-09.

-- ---------- profiles: one row per user, holds the plan ----------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text,
  account_type       text not null default 'bowler' check (account_type in ('bowler', 'shop')),
  plan               text not null default 'free'   check (plan in ('free', 'pro', 'shop')),
  plan_status        text not null default 'none'   check (plan_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  plan_renews_at     timestamptz,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Users may only change their name and account type. Plan / Stripe columns are
-- written by the billing webhook with the service role.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, account_type) on public.profiles to authenticated;

-- ---------- user_store: the app's localStorage keys, per user ----------
create table public.user_store (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null check (key in ('layoutlab.bowlers', 'layoutlab.balls', 'xing.calib', 'xing.calibOil', 'layoutlab.mode')),
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint user_store_size check (pg_column_size(value) < 5 * 1024 * 1024)
);
alter table public.user_store enable row level security;

create policy "user_store: read own"   on public.user_store for select to authenticated using (user_id = (select auth.uid()));
create policy "user_store: insert own" on public.user_store for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_store: update own" on public.user_store for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_store: delete own" on public.user_store for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.user_store from anon;

-- ---------- balls: public catalog (filled by the local updater, read by everyone) ----------
create table public.balls (
  id          text primary key,
  brand       text not null,
  name        text not null,
  rg          numeric,
  diff        numeric,
  mb_diff     numeric,
  coverstock  text,
  core        text,
  released    date,
  updated_at  timestamptz not null default now()
);
alter table public.balls enable row level security;
create policy "balls: public read" on public.balls for select to anon, authenticated using (true);
revoke insert, update, delete on public.balls from anon, authenticated;

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch   before update on public.profiles   for each row execute function public.touch_updated_at();
create trigger user_store_touch before update on public.user_store for each row execute function public.touch_updated_at();
create trigger balls_touch      before update on public.balls      for each row execute function public.touch_updated_at();

-- create a profile row when someone signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'account_type' = 'shop' then 'shop' else 'bowler' end
  );
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
