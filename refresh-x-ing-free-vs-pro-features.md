# Session refresh — choose what shows up on Free vs Pro

Continuing work in `C:\Users\ryuza\Documents\X-ING Pro Shop Lab` (X-ING Pro Shop Lab, a single-HTML bowling pro shop app, now with Supabase accounts). Goal of this session: decide with me, feature by feature, what Free users see vs what Pro / Shop unlock, then build those gates and the upgrade prompts.

## Where things stand
- **Accounts work (built 2026-11-09).**
  - Supabase project "X-ING Pro Shop Lab" (`yeoraqksuvaohauxvvgt`, us-east-1). Its MCP is connected.
  - Tables:
    - `profiles`: `plan` free/pro/shop, `plan_status`, `account_type` bowler/shop. Users can't change their own plan.
    - `user_store`: the app's localStorage keys, per user.
    - `balls`: a public catalog, empty for now.
  - Row-level security is tested: a user can't upgrade their own plan (403), and a signed-out visitor can't read stored data (401).
- **`js/cloud.js`** replaces the app's `store`. It handles sign-in and sign-up, the account menu, the sync status, the copy-this-device-into-my-account banner, and plan checks.
  - `cloud.isPaid` means plan is pro or shop AND status is trialing, active or past_due.
  - `cloud.require(feature)` returns true when the user is paid. Otherwise it opens the upsell dialog.
  - The `FEATURES` map and `openUpsell()` hold the plan wording.
- **The only gate today is the shot log.**
  - `logShot()` starts with `if (!cloud.require('shotlog')) return;`.
  - `#logBox` gets the class `.locked`, which shows a "Pro" badge.
  - Free has no limit on bowlers or balls. Guests (signed out) count as Free.
- **The gate is client-side only.** Shots are stored inside the bowler record, so the server can't enforce it. A deliberate trade-off for now.
- **Accounts that exist:**
  - Your account "X-ING Proshop" (shop type): set to Pro by hand.
  - A test account: Pro. Its email and password are in `supabase/test-account.local.json`, which git ignores. Set a plan from SQL to test Free vs Pro, e.g. `update public.profiles set plan='free', plan_status='none' where id='3e6a496e-1f2b-43a0-9783-7294c0cf9d9c'`.
- **Already decided (2026-11-09).**
  - Plans: Free, Pro (bowlers), Shop (pro shops).
  - Billing: Stripe, monthly and yearly, 14-day trial. Not built yet; the upsell says "checkout coming soon".
  - Hosting: Cloudflare Pages for now, Hostinger later.
  - Also saved in memory: `website-plan-decisions.md`.
- **Code is on GitHub:** https://github.com/KrulDeath1/-x-ing-pro-shop-lab (private, `main`, commit d114ffa).
  - Git: `C:\Program Files\Git\cmd\git.exe`. A new shell may need its PATH refreshed.
  - The router's DNS fails on and off. Retry a network command once before treating the failure as real.
- **Preview:** `preview_start` "layout-lab" (http://localhost:5317).

## Next steps
1. Show me a list of the features and ask which tier each belongs in: Free, Pro, Shop, or a Free limit. Use AskUserQuestion with multiSelect, or `interview-me`. Candidates, with the ids to grep for in `x-ing-pro-shop-lab.html`:
   - Shot log and lane calibration (`#logBox`, `logShot`, `#calReset`, `#shotClearLog`, Retune lane). Already Pro.
   - Auto line / best strike line (`bestStrikeLine`, `#laneSeg`) and strike chance (`strikePeak`)
   - Compare A/B (`#compare`)
   - Recommend layout (`#btnRec`)
   - Print drill sheet (`#btnPrint`)
   - Arsenal coverage chart (`drawCoverage`, `covWhere`)
   - Driller mode (`#modeSeg`)
   - Number of bowlers and number of your own balls (`saveBowler`, `#ballSave`)
   - Export/Import JSON (`#arsExport`, `#arsImport`). Keep Import free, because it's the way existing users bring in their data.
   - What Shop adds beyond Pro (more bowlers, staff seats later?)
2. Decide how a locked feature looks: hidden, greyed out with a "Pro" badge (the current style), or usable as a preview with saving blocked.
3. Build the gates in a generic way, for example a `data-plan="pro"` attribute plus `cloud.require()` in the handlers. Update `FEATURES`, the plan list in `openUpsell()`, and the plan table in `README.md`.
4. Test in the preview three ways: as a guest, as the test account on Free, and on Pro (flip the plan with SQL). Back up the HTML first. Syntax-check by extracting the last `<script type="module">` and running `node --check`.
5. Commit and push. Update the memory file `website-plan-decisions` with the final split.

## Still open (not this session unless I bring it up)
- In the Supabase dashboard, under Auth → URL Configuration: set the Site URL to `http://localhost:5317` and add `http://localhost:5317/**` as a redirect URL. Only I can do this.
- Stripe checkout, its webhook, and pricing. Cloudflare Pages deploy. Ball DB: ask bowwwl.com for permission; until then, numeric specs only.

## Files to open (read these, don't re-derive)
- `js/cloud.js` — plan checks (`isPaid`, `require`), `FEATURES`, the upsell text, and the `.locked` CSS
- `x-ing-pro-shop-lab.html` — the app. Too big to read whole, so grep the ids above. `store`/`cloud` are imported at the top of the last `<script type="module">`.
- `supabase/migrations/20261109_accounts_and_store.sql` — the plan columns and their allowed values
- `README.md` — the public plan table, which must match the final split
- `refresh-x-ing-website-accounts-plans.md` — the earlier handoff, with the full list of storage keys
- Memory `website-plan-decisions` and `subagent-model-policy` (Sonnet by default, at most 5 sub-agents)
