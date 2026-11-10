# Matching Layouts to the Bowler

## Contents
1. Release categories (speed, revs, tilt, rotation)
2. Speed vs. rev matching
3. Profile → starting layout matrix
4. Adjusting for lane condition
5. Adjusting for the ball itself
6. Surface pairing
7. Arsenal planning
8. Troubleshooting table

---

## 1. Release categories

Numbers are one-handed, release/launch speeds. Center monitors that read near the pins often show ~2–3 mph less; normalize first.

**Rev rate (rpm)**
| Tier | rpm | Common label |
|---|---|---|
| Low | < 250 | Stroker |
| Medium | 250–350 | Tweener |
| High | 350–450 | Cranker / power player |
| Very high | > 450 | Usually two-handers / elite crankers |

**Ball speed (release, mph)**
| Tier | mph |
|---|---|
| Slow | < 15 |
| Medium | 15–17.5 |
| Fast | 17.5–19.5 |
| Very fast | > 19.5 |

**Axis tilt** (how much the axis leans; more tilt = smaller track, more length)
- Low < 10° · Medium 10°–20° · High > 20°

**Axis rotation** (side roll; more rotation = more skid then sharper turn)
- Low < 30° · Medium 30°–60° · High > 60°

PAP location roughly encodes tilt and rotation: PAP farther from the grip horizontally + close to the midline = lower tilt, bigger track (full-roller-ish → 3/4 roller); PAP high above the midline and close horizontally = high tilt, small track (spinner). See `pap-and-measurement.md`.

## 2. Speed vs. rev matching

Rule of thumb (Motiv-style): **≈ 300 rpm at 17 mph is balanced, and each extra mph needs about +50 rpm** to stay matched.

`expected_rpm = 300 + 50 × (speed − 17)`
`match_ratio = actual_rpm / expected_rpm`

| Ratio | Classification | What the ball needs from layout |
|---|---|---|
| < 0.85 | Strongly speed-dominant | Help it start: earlier read, max-ish flare, stronger surface |
| 0.85–0.95 | Speed-dominant | Somewhat earlier/stronger |
| 0.95–1.10 | Matched | Benchmark layouts work; tune for condition |
| 1.10–1.30 | Rev-dominant | Save energy: length, smoother transitions |
| > 1.30 | Strongly rev-dominant | Control: long pin-to-PAP or pin-near-PAP, higher angles/longer buffers, smoother surfaces |

The linear rule gets less reliable below ~15 mph (slow bowlers read as rev-dominant even at modest revs). That's directionally true — slow balls have time to hook — but for a slow, low-rev bowler weigh rev tier as heavily as the ratio: they still benefit from a ball and surface with plenty of friction, and the layout should just avoid rolling out early.

Many top players are mildly rev-dominant (ratio ~1.1–1.4) by design. These thresholds are conventions, not physics — use them to frame the conversation.

Tilt/rotation shift the read: high tilt or high rotation behaves "more speed-dominant" (more length), low tilt + low rotation behaves "more rev-dominant" (reads early). If tilt isn't given, infer it roughly from the PAP (see `pap-and-measurement.md`).

Strongly speed-dominant bowlers (ratio < ~0.7) are at the limit of what layout can fix. Give the strongest sensible layout and surface, and say plainly that a release/speed change (a bit slower, or more revs with coaching) is the bigger lever. Same idea in reverse for ratio > ~1.6: control layouts help, but adding speed is the real fix.

### How to pick and adjust a row
1. Choose the row by **classification (ratio) first**, rev tier second. If the ratio puts the bowler in a different band than their rev tier suggests (e.g., 260 rpm at 19.5 mph = ratio 0.61), use the row whose ratio is closest. Rows are examples, not buckets.
2. A **"step"** = about 10° drilling angle, 1/2" pin-to-PAP, and 10° VAL angle in the same direction (or one notch of surface, ~1000 grit). "Weaker/longer" = ↑ DA, pin-to-PAP away from 3 3/8"–4", ↑ VAL; "stronger/earlier" = the opposite.
3. Adjustments stack (tilt/rotation, condition, ball strength, last ball's problem), but **cap the net layout move at about two steps** from the row. Anything beyond that is a ball-choice or surface problem — say so instead of pushing the layout to an extreme.
4. Past the last row in a direction, stay at the row's alternates and move surface/ball instead.

## 3. Profile → starting layout matrix (Dual Angle, right-handed, asymmetric)

| Profile | Primary layout | Alt (weaker/longer) | Alt (stronger/earlier) | Notes |
|---|---|---|---|---|
| Low rev, speed-dominant (e.g. 18 mph / 220 rpm) | `35° x 4" x 35°` | `45° x 4 1/2" x 40°` | `25° x 3 1/2" x 30°` | Need flare and an early read; aggressive surface (500–1000). Layout differences will be subtle — ball choice (strong asym, high diff, solid cover) matters most. |
| Low rev, slow speed (14 mph / 230 rpm — rev-dominant by ratio) | `45° x 4" x 40°` | `55° x 4 1/2" x 45°` | `35° x 3 1/2" x 35°` | Slow speed lets the ball hook; avoid over-strong layouts that roll out. |
| Medium rev, speed-dominant (19 mph / 300 rpm) | `40° x 4" x 35°` | `50° x 4 1/2" x 40°` | `30° x 3 1/2" x 30°` | Earlier, stronger; keep box or sand to 1000–2000. |
| Medium rev, matched (17 mph / 320 rpm) | `50° x 4 1/2" x 40°` | `60° x 5" x 45°` | `40° x 4" x 30°` | Benchmark. |
| Medium rev, rev-dominant (15 mph / 340 rpm) | `55° x 5" x 50°` | `70° x 5 1/2" x 60°` | `45° x 4 1/2" x 40°` | Add length, smooth the backend. |
| High rev, matched (18.5 mph / 400 rpm) | `50° x 5" x 45°` | `65° x 5 1/2" x 55°` | `45° x 4 1/2" x 35°` | Layout changes show up strongly; keep flare in check. |
| High rev, rev-dominant (16 mph / 420 rpm) | `65° x 5 1/2" x 55°` | `80° x 6" x 60°` or pin-near-PAP `20° x 2" x 70°` | `50° x 5" x 45°` | Control is king; consider polished/pearl and longer buffers. Watch flare into the grip on big PAPs. |
| Very high rev / two-hander (17 mph / 500+ rpm) | `60° x 5 1/2" x 60°` (or Storm 2LS) | `75° x 6" x 70°` / pin-near-PAP | `45° x 5" x 45°` | Avoid leverage (3 3/8") layouts unless on very heavy oil. |

VLS equivalents: compute with `node scripts/layout_calc.js dual ...`. Two "families" for control on high rev: **long pin** (5"–6", length, less hook) vs **short pin** (1 1/2"–2 1/2", early stable roll, least flare). Choose short pin when the bowler wants predictability in the mid-lane on medium/heavy oil; long pin when the problem is the ball using energy too early on drier fronts.

Symmetric balls: use the pin-to-PAP and VAL angle from the matrix; ignore drilling angle (or tell the driller "PSA n/a").

## 4. Adjusting for lane condition

| Condition | Adjust |
|---|---|
| Heavy oil / long pattern (≥ 44 ft, high volume) | Earlier: lower drilling angle (−10°), pin-to-PAP toward 3 1/2"–4", lower VAL; rougher surface |
| Medium / typical house shot (38–42 ft) | Matrix as-is |
| Light / short (≤ 37 ft) or burnt/transition | Later/smoother: higher drilling angle (+10°–20°), pin-to-PAP 5"–6" or 2" control, higher VAL; smoother/polished |
| Flat sport patterns | Prioritize predictability over hook: smoother transitions (higher VAL / longer buffer), moderate flare |
| Fast-transitioning (heavy traffic, many reactive balls) | Layouts that clear the front (higher DA, polish) as a second ball |

### Where to play a pattern (lane-play rules of thumb)
- **Rule of 31:** pattern length − 31 ≈ the board the ball should be on as it leaves the oil (41 ft → board 10, 45 ft → 14, 36 ft → 5). The breakpoint usually sits a few feet past the end of the oil. It's a starting point; revs, speed, ball and pattern shape move it.
- **Short patterns (≤ 36 ft)** are played closer to the outside; **long patterns (≥ 43 ft)** push you deeper inside, and low-rev players often struggle there (use a stronger, rougher ball).
- **Pocket:** board 17.5 (righty). USBC pin-carry research: 4–6° entry is the normal good range, ~6° carries best; most bowlers actually get 3–4°.
- Use these to sanity-check a layout: if the bowler can't exit near the Rule-of-31 board and still get 4°+ entry, change ball/surface/layout strength before forcing a line.

## 5. Adjusting for the ball

- **Strong, high-diff asym (diff ≥ 0.050, int. diff ≥ 0.015)**: layouts express strongly; for high rev, move one step weaker than the matrix.
- **Low-diff / pearl / urethane / "control" balls**: there's less to unlock; a stronger layout won't over-react much. Pin-to-PAP near 3 1/2"–4 1/2" gets the most out of them.
- **Low RG**: revs up early already → you can use longer layouts. **High RG**: naturally long → you can use stronger/earlier layouts.
- **Urethane**: for medium/high revs, emphasize control (pin near PAP or long pin) — flare can cause "flip-out" on dry. For low revs / speed-dominant, urethane is already weak; drill it 3 1/2"–4" to get what read it has, and set expectations that it's a later-game / short-pattern ball.
- **Ball already bought but wrong for the job** (e.g., a very strong asym for a high-rev bowler on a fresh house shot): say so honestly, drill the most controllable layout that fits, and suggest the ball's real role (heavy oil, later games) or a surface change.
- **New ball + last ball's problem**: the old ball's complaint is evidence about the bowler and condition, so let it shape the new layout directly (no need to "fix surface first" on an undrilled ball). Also suggest a surface tweak for the old ball.

## 6. Surface pairing

Surface outranks layout. Typical pairings:
- Early & smooth motion → sanded (360–1000) solid; or 2000 Abralon on hybrid.
- Length + angular → polish or 3000–4000 + polish.
- Box finish is the benchmark; recommend changing surface *before* re-drilling.
Common progression for "too early": 2000 → 3000 → polish. "Too late": polish → 2000 → 1000/500.

## 7. Arsenal planning

Build steps that differ in **when** and **how much** the ball hooks, not just "stronger/weaker". Typical 4–6 ball set for a league/tournament bowler:

| Slot | Ball type | Layout family | Surface |
|---|---|---|---|
| Heavy oil / strongest | Strong solid asym | Earlier/stronger (`35° x 4" x 35°`) | 500–1000 |
| Benchmark | Mid-strong hybrid/solid | Benchmark (`50° x 4 1/2" x 40°`) | box (1500–2000) |
| Length / angular | Pearl or hybrid asym | Long & angular (`60° x 5" x 30°`) | polished |
| Smooth / transition | Pearl or weaker sym | Smooth (`70° x 5 1/2" x 55°`) | 3000–4000 or polish |
| Control / straight | Urethane or plastic-ish | Pin-near-PAP (`20° x 2" x 70°`) | 1500–3000 |
| Spare | Plastic | Any (conventional) | — |

Avoid drilling two similar balls with the same layout and surface — duplicates leave gaps.

## 8. Troubleshooting

| Symptom | Likely cause | Fix order |
|---|---|---|
| Hooks early, rolls out, weak at pins | Too much early friction / revs used up | Smoother surface → longer layout (↑ DA, ↑ VAL, pin 5"+ or pin-near-PAP) → weaker ball |
| Skids past breakpoint, doesn't come back | Not enough friction / too long | Rougher surface → stronger layout (↓ DA, pin 3 1/2"–4", ↓ VAL) → stronger ball |
| Over-reacts / "flips" uncontrollably | Too sharp transition, often high rev with low-buffer or leverage layout | Longer buffer / higher VAL; dull the polish; move speed/target before drilling |
| Ball "burns up" on fresh, fine on transition | Layout/surface too strong for condition, not necessarily wrong for bowler | Keep it as a later-game ball; add a weaker piece |
| Flare rings hitting thumb/finger holes | Big PAP + high flare layout | Driller should shift layout or reduce flare; note it on the sheet |
| Different reactions every shot | Release inconsistency, not layout | Say so; recommend control layout and coaching, not more aggressive equipment |
