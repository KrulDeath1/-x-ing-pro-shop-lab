# Session refresh — continue X-ING Pro Shop Lab

Continuing work in `C:\Users\ryuza\Documents\X-ING Pro Shop Lab` (single-file HTML app for a bowling pro shop: drilling layouts, PAP, rigid-body ball motion). Goal of this session: pick up development wherever the user wants next.

## Where things stand
- **App:** `x-ing-pro-shop-lab.html` (~1.2 MB, one file). It loads three.js 0.160 from jsdelivr; everything else is inline. Data lives in localStorage: `layoutlab.bowlers`, `layoutlab.balls`, `xing.calib`. Preview with `preview_start` "layout-lab" → http://localhost:5317 (`.claude/launch.json` + `.claude/serve.js`).
- **Core features:**
  - Dual Angle (Pinel) + VLS layouts.
  - Tilt and rotation from a release photo or the oil track.
  - Euler rigid-body sim with Coulomb stick/slip (μ 0.04 in oil, 0.20 dry).
  - Kegel Ikon lane-machine sim: head crossings plus a buffer brush that carries oil past the loads to the oil distance, and an optional per-row sheet speed.
  - Fit specs, arsenal history and coverage chart, A/B compare, print sheets, pocket impact and strike chance, spare system.
- **Physics as of 2026-11-07:**
  - **`FLARE_K = 1.0` (was 0.6).**
    - Validated: fed the as-drilled mass properties for 49 drillings from Blueprint's "Track Flare Explained", our sim reproduces their flare (r = 0.98, RMS error 0.6"). Oil flare is within 0.3"; dry flare runs ~0.7" short.
    - Flare is shown as oil + dry: net axis migration release → end of oil, plus end of oil → pins.
  - **`TRACK_PEN = 0.9`** (oily-track grip penalty, was 0.35). This is the user's choice: min → max flare should change hook by ~3–5 boards. It now gives ~3.5–4.5.
  - **`drilledSpecs`** has a pin-to-PAP factor on differential: +17% at 1⅛", +8% at 2¼", +3% at 3⅜".
  - **Warning** when flare rings pass within 1" of a hole.
  - **Layout card:** "RG at the PAP", √(papᵀ·I·pap).
  - **Ball view:** "RG contours" toggle (`BallView.rgContours`).
  - **Checks that passed:**
    - EARL/SuperCATS: equal rpm·cos(tilt) gives identical paths; hook peaks near 70° rotation.
    - Frohlich-style constant-μ cases: skid distances match.
- **House shot:**
  - **"BEP House 26 v3"** comes from the Track Test v3 sheet, which is a TEST DRAFT. The start/end feet still need the IKON read-back. It is pattern index 0 (the default) and plays like ~40 ft.
  - **"BEP House 26 (pre-v3)"** is kept for comparison, appended at the end of `ALL_PATTERNS` so no other pattern index shifts.
  - **Calibration:** both share the key `'BEP House 26'`, currently 172%. With pre-v3, the line through board 10 breaks 9.7 at 40 ft. Breakpoint distance is only weakly sensitive to this factor.
- **Ball DB:** 911 balls from bowwwl.com, every weight: 358 current + 553 discontinued from the last 5 years (`DISC_YEARS`, flag `x:1`, shown as "(disc.)"). The Ball card has a "Search all balls" box. Update via `Update ball list.bat`.
- **UI order:**
  - Left column: Bowler, Fit specs, Lane, Grip (Grip shows in Driller mode only).
  - Right column: Bowler read, Layout, Ball, Layout A/B, Ball view, Ball motion, Arsenal, Spare system.
- **Open items:**
  - When the user sends the v3 IKON actual distances, update the rows.
  - After the user bowls on v3, they'll recalibrate with their real read.
  - Carrydown (oil pushed downlane over many shots) is not modeled. It was offered as a possible "late session" condition.
  - The PAP-curl report is still unreproduced.
- **User's own browser:** it has its own localStorage. The user presses Calibrate there after physics changes.
- **Sub-agents:** follow the saved memory (Sonnet by default, Opus only for technical decisions, max 5).

## Next steps
1. Ask the user what they want next.
2. After any physics change, re-check the BEP calibration (line through board 10 should break near 40 ft) and the flare numbers.
3. Syntax-check after edits: extract the last `<script type="module">` block and run `node --check` on it.

## Files to open (read these, don't re-derive)
- `x-ing-pro-shop-lab.html` — the app. It's too big to read whole, so grep for these: `simulate`, `makeFriction`, `TRACK_PEN`, `inertia`/`FLARE_K`, `drilledSpecs`, `machineLay`, `MY_HOUSE`/`PREV_HOUSE`, `analyze`, `BallView`/`rgContours`, `fillBallSearch`, `calibStats`/`lineThrough`.
- `update-balls.js`, `Update ball list.bat` — the ball DB updater (current + discontinued).
- `.claude/bp-harness.js` — replays Blueprint's 49 drillings, plus line tests. It needs a temporary `window.__dbg = () => ({ last, simulate, motionStats, makeFriction, interpAtY, ALL_PATTERNS, laneOilUL, V, qFromTo, qToM, mtv, R, D2R })` line after `let views = …`. Load it with `eval(await (await fetch('/.claude/bp-harness.js')).text())`, and remove the hook afterwards.
- `C:\Users\ryuza\Downloads\Bowling Ball Track Flare Explained.pdf` — Blueprint flare study, with appendix tables (as-drilled mass properties and flare in oil and dry).
- `C:\Users\ryuza\Downloads\BallMotionASQ.pdf` — USBC Ball Motion Study: what matters most (surface roughness, friction, RG) and measured response ranges.
- `bep-house-26-track-test-v3-sheet.pdf` (project folder) — the v3 load sheet.
- `C:\Users\ryuza\.claude\skills\bowling-ball-driller\` — the companion layout-expert skill.
- `C:\Users\ryuza\Downloads\x-ing-bowlers-2026-11-07.json` — the user's real bowlers, for reproducing issues.

## Notes
- **Shell:** Windows PowerShell 5.1. Write files with `[IO.File]::WriteAllText` (UTF-8), not Set-Content.
- **blueprintbowling.com:** loads only in the built-in browser. WebFetch and agents get DNS errors there. The same goes for real-world-physics-problems.com.
- **"Bowling Beyond the Basics":** it's in the user's Google Play Books. Don't reproduce its text.
