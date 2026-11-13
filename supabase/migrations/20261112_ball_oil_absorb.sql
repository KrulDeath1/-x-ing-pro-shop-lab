-- X-ING Pro Shop Lab: per-ball cover oil absorption (slow / med / fast).
-- Applied to Supabase project yeoraqksuvaohauxvvgt on 2026-11-12 (as migration "ball_oil_absorb"), with the owner's OK.
-- Checked before writing (2026-11-12): public.balls has no oil absorption column.
-- null = not entered: the app then uses the default for the cover type (reactive = med, urethane / plastic = slow).
-- The app reads this column but falls back to the old column list if it's missing, so the order of deploy and migration
-- doesn't break the catalog read; saving an absorption pick from the admin form needs the column.
-- Classes follow USBC's oil absorption test (SOP-BALL-17, one drop, time until it disappears): new balls must take at
-- least 2:15 (since Aug 2020); USBC calls 90 min or longer "slow". The sim's multipliers per class are estimates.

alter table public.balls add column if not exists oil_absorb text check (oil_absorb in ('slow', 'med', 'fast'));
