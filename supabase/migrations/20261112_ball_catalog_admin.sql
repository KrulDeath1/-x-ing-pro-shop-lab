-- X-ING Pro Shop Lab: admin-entered ball catalog.
-- Applied to Supabase project yeoraqksuvaohauxvvgt on 2026-11-11 (as migration "ball_catalog_admin"); the X-ING Proshop
-- account was then made admin. Checked: admin can insert; a non-admin can't insert, update, or set is_admin.
-- Balls typed in by the site admin from the makers' spec sheets. Everyone can read them; only an admin can write.
-- The app merges them into its built-in list at start-up: same brand + name corrects the built-in ball, anything else
-- is added; balls are dropped 7 years after their release.

-- ---------- admin flag ----------
-- Users can only update display_name and account_type (see 20261109), so they can't make themselves admin.
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin);
$$;
revoke execute on function private.is_admin() from anon, public;
grant execute on function private.is_admin() to authenticated;

-- ---------- the catalog (the existing, unused public.balls table, extended) ----------
alter table public.balls alter column id set default gen_random_uuid()::text;
alter table public.balls add column if not exists core_type    text not null default 'sym' check (core_type in ('sym', 'asym'));
alter table public.balls add column if not exists cover_type   text;
alter table public.balls add column if not exists finish       text;
alter table public.balls add column if not exists weights      jsonb;            -- {"15": [rg, diff, int_diff], "14": [...], ...}
alter table public.balls add column if not exists discontinued boolean not null default false;
alter table public.balls add column if not exists created_by   uuid default auth.uid() references auth.users (id) on delete set null;
alter table public.balls add column if not exists created_at   timestamptz not null default now();
alter table public.balls add constraint balls_brand_len check (length(brand) between 1 and 60);
alter table public.balls add constraint balls_name_len  check (length(name) between 1 and 120);
alter table public.balls add constraint balls_specs_ok  check (rg is null or (rg between 2.3 and 2.9)) ;
create unique index if not exists balls_brand_name on public.balls (lower(brand), lower(name));

-- read stays public; writes only for admins
create policy "balls: admin inserts" on public.balls for insert to authenticated with check ((select private.is_admin()));
create policy "balls: admin updates" on public.balls for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "balls: admin deletes" on public.balls for delete to authenticated using ((select private.is_admin()));
grant insert, update, delete on public.balls to authenticated;

-- Make the site owner an admin (run once, with the owner's account id):
--   update public.profiles set is_admin = true where id = '<owner user id>';
