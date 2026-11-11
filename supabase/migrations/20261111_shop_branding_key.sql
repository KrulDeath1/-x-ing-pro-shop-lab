-- X-ING Pro Shop Lab: Shop branding (shop name, address, phone, email, website, logo on printouts).
-- Applied to Supabase project yeoraqksuvaohauxvvgt on 2026-11-11 (as migration "shop_branding_key").
-- Saved per user in user_store under the new key 'xing.shop'; this widens the allowed-keys check to include it.
-- The logo is a small data URL (at most 480 x 200 px), well inside the existing 5 MB per-value limit.
-- Who may use it (paid Shop) is checked in the page; the row itself is only the user's own data, like the other keys.

do $$
declare c text;
begin
  -- the inline check on user_store.key got a generated name; find and drop it
  select con.conname into c
  from pg_constraint con
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
  where con.conrelid = 'public.user_store'::regclass and con.contype = 'c' and att.attname = 'key';
  if c is not null then execute format('alter table public.user_store drop constraint %I', c); end if;
end $$;

alter table public.user_store add constraint user_store_key_check
  check (key in ('layoutlab.bowlers', 'layoutlab.balls', 'xing.calib', 'xing.calibOil', 'layoutlab.mode', 'xing.shop'));
