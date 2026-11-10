# Session refresh — turn X-ING Pro Shop Lab into a website with accounts and Free / Pro plans

Continuing work in `C:\Users\ryuza\Documents\X-ING Pro Shop Lab`. The app is a single HTML file for bowling pro shops: drilling layouts, PAP, rigid-body ball motion, lane calibration and a shot log.

Goal of this session: make it a website where other people can sign up and keep their own data. It should have a Free plan and a Pro plan.

## Where things stand
- **App:** `x-ing-pro-shop-lab.html` (~1.2 MB, one file, client-side only).
  - three.js 0.160 is loaded from jsdelivr; everything else is inline.
  - Preview with `preview_start` "layout-lab" (http://localhost:5317), set up in `.claude/launch.json` and `.claude/serve.js`. If the port is already in use, just navigate to it.
- **All data lives in the browser's localStorage.** This is what has to move to per-user server storage:
  - `layoutlab.bowlers`: a map of bowler name to that bowler's object, which holds:
    - the bowler's fields (`BOWLER_FIELDS`) and line/calibration inputs (`LINE_DEFAULTS`)
    - `fit`: the fit sheet plus the spare-system settings
    - `arsenal[]`: drill records
    - `shots[]`: the shot log, where each shot holds:
      - line: `lay`, `target`, `missBoards`/`missDir`, `arr`
      - reads: `bp`, `ft`, `hit`, `bad`, `leave`, `pinType`
      - results: `read`, `pred`, `calib`
  - `layoutlab.balls`: the user's own balls.
  - `xing.calib` / `xing.calibOil`: backend and oil friction per pattern key (e.g. `'BEP House 26'`).
  - `layoutlab.mode`: Simple or Driller.
  - Export/Import JSON already exists and can be the migration path for current users.
- **Built in the last sessions (2026-11-07 to 11-09):**
  - **Lane panel:**
    - Line modes:
      - **Auto line:** the best expected-strike line on the tuned lane. It counts a 1-board miss each way at the arrows; see `bestStrikeLine`.
      - **Pocket from laydown.**
      - **My line:** laydown → arrows, compared with your breakpoint.
    - **Log a shot** is the only thing that calibrates the lane. It has:
      - a pin deck
      - target arrows, plus how many boards you missed and which way
      - breakpoint and pin hit
      - a bad-release tick
      - a solid/light (or high) choice for a lone 10 or 7
    - Every logged shot moves the lane ⅓ of the way toward what that shot says (`LANE_STEP`).
    - Calibration weights: breakpoint distance counts only 0.25 per ft; a pin hit read from the leave stands in when Hit at pins is blank.
    - After each log, a move tip shows (`leaveRead`, `leaveMove`).
  - **Shot log card:** carry by line, the shot list, Retune lane, and **Clear log** for the current pattern.
  - **Strike chance:** depends on entry angle (`strikePeak`). It is anchored to USBC data: about 85% at board 17.5 and 4°, with 6° the best entry angle.
  - **Fit specs:** moved to the right column, above Layout.
    - The spans are now "Span — actual" and "Span — cut to cut".
    - The card calculates center-to-center span and finger spacing.
    - **Use for layout** fills the Grip card with them.
  - **Bowler save/load:** includes the line and calibration inputs.
- **Performance:** a recompute in Auto mode takes about 1.9 s in the browser, because it runs a lot of simulations. Keep the physics client-side.

## Next steps
1. Ask the user for the decisions below before building anything. Use the `interview-me` skill or a few AskUserQuestion questions.
2. Propose an architecture. Options available in this setup:
   - **Supabase:** auth plus Postgres plus row-level security per user. The Supabase MCP is connected.
   - **Cloudflare:** Workers, D1, KV, R2. Its MCP is connected but deprecated.
   - **Netlify:** hosting. Its MCP is connected.
   - **Payments:** none is connected. Stripe would need setting up by the user.
3. Split the single file into a static site plus a thin data layer. Replace `store.get`/`store.set` with a per-user API, keeping localStorage as an offline cache.
4. Build sign-up and login. Then add a plan flag with Free vs Pro gates, a pricing page and a billing hook.
5. Migration: "Import my local data" from the existing JSON export.
6. Deploy to staging and test. Back up the HTML before big edits. Syntax-check by extracting the last `<script type="module">` and running `node --check`.

## Open decisions (ask the user)
- **Which features are Free and which are Pro.** Candidates for Pro:
  - shot log and lane calibration
  - A/B compare
  - arsenal coverage chart
  - print sheets
  - number of bowlers or balls
  - ball DB search
- **Who signs up:** individual bowlers, pro shops managing many bowlers, or both. If pro shops, do they need team/shop accounts with several staff?
- **Pricing and billing:** monthly or yearly, trial or not, and Stripe or something else.
- **Hosting choice and domain name.**
- **Ball database:** the 911 balls were scraped from bowwwl.com. Check whether they may be served on a public, paid site; they may need permission or another source.
- **Content rules:** don't reproduce text from "Bowling Beyond the Basics" anywhere public (it's cited in code comments only).

## Files to open (read these, don't re-derive)
- `x-ing-pro-shop-lab.html` — the whole app. It's too big to read whole, so grep for these:
  - storage: `store.get`/`store.set`, `BKEY`, `getAll`, `saveBowler`, `BOWLER_FIELDS`, `LINE_DEFAULTS`
  - export/import: `arsExport`, `arsImport`
  - shot log and calibration: `logShot`, `calibrateFromShot`, `fitCalibration`
  - line picking: `bestStrikeLine`, `analyze`, `compute`
- `refresh-continue-x-ing-pro-shop-lab.md` — the earlier handoff, with physics details and the BEP House 26 v3 open items.
- `update-balls.js`, `Update ball list.bat` — the ball DB updater. This decides how ball data would refresh on a server.
- `.claude/launch.json`, `.claude/serve.js` — the local preview server.
- `C:\Users\ryuza\Downloads\x-ing-bowlers-2026-11-07.json` — the user's real export. Use it as test data for the migration, and keep it private.
- Memory `subagent-model-policy` (auto-loaded): Sonnet by default, Opus only for technical decisions, at most 5 sub-agents.
