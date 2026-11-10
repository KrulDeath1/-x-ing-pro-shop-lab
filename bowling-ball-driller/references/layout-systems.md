# Layout Systems

## Contents
1. Vocabulary
2. How layout changes motion (the physics in one page)
3. Dual Angle Layout Technique
4. Storm VLS / Pin Buffer system
5. Converting between systems
6. Legacy & shorthand layouts (pin up/down, leverage, label, stacked)
7. Symmetric vs asymmetric cores
8. Benchmark layout library

---

## 1. Vocabulary

| Term | Meaning |
|---|---|
| **Pin** | Colored marker showing the top of the core's low-RG axis. Pin-to-PAP distance controls how far the core is tipped relative to the bowler's spin axis → flare & hook potential. |
| **CG** | Center of gravity marker (heaviest point of the undrilled ball's surface). Matters for static balance; minor for motion today. |
| **PSA / MB** | Preferred Spin Axis (asymmetric balls). Many balls mark the Mass Bias (MB), which sits 6 3/4" from the PSA; some mark the PSA directly. Pin-to-PSA (or pin-to-MB) distance varies by ball — check the spec sheet. If a bowler quotes "pin to PSA" ask whether the sheet actually says MB. If unknown, compute PSA-to-PAP for 5" and 6" pin-to-PSA, give the range, and tell the driller to confirm on the ball. |
| **PAP** | Positive Axis Point — bowler's axis pole on the grip side of the ball at release. See `pap-and-measurement.md`. |
| **Midline** | Horizontal line through the center of the grip, perpendicular to the thumb→fingers centerline (it passes between the thumb and finger holes and runs out toward the PAP). PAP "over" is measured along it; "up/down" is perpendicular to it (up = toward the fingers). |
| **VAL** | Vertical Axis Line — line through the PAP perpendicular to the midline. It splits the ball into the "grip side" and the "away from grip" side. |
| **Pin buffer** | (Storm) Distance from the pin to the VAL. Called "pin-to-VAL" in older Storm material. |
| **Track flare** | Separation between oil rings as the axis migrates. More flare = more fresh cover meeting oil = more friction and hook, up to the point where the ball burns up. |
| **RG / Diff / Int. diff** | Radius of gyration (low = revs up earlier), total differential (flare potential), intermediate differential (asymmetry; how much the PSA matters). |

## 2. How layout changes motion

A ball spinning on the bowler's axis tries to migrate toward its own preferred (lowest-energy) axis. The layout sets the starting angle between the bowler's axis and the core's axes:

- The **pin** sits on the core's low-RG axis. Pin-to-PAP = how far apart the bowler's axis and the core axis start → how much the axis migrates (flare) and how fast the ball revs up.
- Maximum flare potential is around **3 3/8"–4"** pin-to-PAP (3 3/8" = half of 6 3/4", the "leverage" position, where the core is tipped 45°). Closer to the PAP (1"–2 1/2") = the core is already spinning near its stable axis → little flare, early, smooth, controllable roll. Farther (5"–6") = core starts near its high-RG axis → more length, less total flare, often a smooth, later transition.
- On asymmetric balls the **PSA** location relative to the PAP controls how quickly the ball gives up its axis rotation (side roll) and turns over: PSA closer to the PAP direction → earlier, smoother; PSA farther (≈ 4"–6") → longer and sharper/more angular at the breakpoint (directional; strength scales with int. diff).
- The **pin's position relative to the VAL** (pin buffer / VAL angle) shapes the transition (skid → hook → roll): small buffer (pin near the VAL, "on the VAL line") → quicker/sharper response; larger buffer → smoother, more gradual transition. Storm suggests high-rev players often prefer *longer* buffers to tame sharp transitions.

Higher-rev bowlers feel layout changes much more than low-rev bowlers. For a ~250 rpm bowler, two quite different layouts may look similar on the lane; surface and core choice dominate.

## 3. Dual Angle Layout Technique

Developed by Mo Pinel (sold through MoRich; now the industry lingua franca). Written as **Drilling Angle × Pin-to-PAP × VAL Angle**, e.g. `45° x 4 1/2" x 30°`.

1. **Drilling angle** — measured *at the pin*, between the line pin→PSA (asymmetric) or pin→CG (symmetric) and the line pin→PAP. Range ≈ 10°–90°.
   - Low (10°–35°): PSA lands near the PAP side → earlier, smoother, more arc, more total hook in the mid-lane.
   - Medium (40°–55°): balanced, benchmark.
   - High (60°–90°): PSA pushed away → more length, quicker/stronger direction change downlane.
2. **Pin-to-PAP** — distance in inches (see §2). Typical 2"–6".
3. **VAL angle** — measured *at the PAP*, between the pin→PAP line and the VAL. Range ≈ 10°/20°–90° (sources give 20°–70° as the practical band; 90° shows up in some layouts).
   - Low VAL (20°–35°): pin near the VAL ("pin above/below the fingers" region on many PAPs) → quicker rev-up, sharper transition.
   - High VAL (55°–75°+): pin toward the midline/away from the VAL → slower rev-up, smoother transition, more length.

### Pinel's own rules (MoRich "Dual Angle Layout Technique" guide — authoritative)
- **Construction order:** (1) draw a line from the pin through the PSA/mass bias (asym) or CG (sym); (2) at the pin, turn the drilling angle off that base line and draw the pin→PAP line; (3) mark the PAP at the pin-to-PAP distance; (4) at the PAP, turn the angle to the VAL off the pin→PAP line and draw the VAL; (5) through the PAP draw the midline square to the VAL; (6) measure back to the grip center with the bowler's PAP coordinates; draw the grip centerline square to the midline.
- **PSA is 6 3/4" from the pin** (it's the high-RG axis, 90° from the low-RG pin). Pinel's PSA-to-PAP chart assumes this: e.g. 90° drilling → PSA 6 3/4" from PAP at any pin distance; 50° x 4 1/2" → ~4 3/8"; 10° x 5 1/2" → ~1 1/2". If a ball's MB marker is closer than 6 3/4", the PSA is still 6 3/4" out along the pin→MB line.
- **Side:** the drilling angle opens toward the grip side of the pin→PAP line. For a right-hander with the pin up, the PSA swings down to the right of the thumb; ~90° lands it in the track. Manufacturer sheets (e.g. Ebonite) advise against mass bias left of the thumb (= past 90°).
- **Effective ranges:** drilling angle 10°–90° (10° rolls soonest, 90° latest); angle to the VAL 20°–~70° (20° revs up quickest/sharpest, 70° slowest/smoothest; Rico-type layouts use 90°); pin at least 1 1/2" from the PAP for the system to be accurate.
- **Angle sum (DA + VAL) = transition speed:** 30° fastest skid→hook→roll, 160° slowest; keep it between 30° and 160°. Smaller sums for speed-dominant, high-tilt, long/heavy oil; larger sums for rev-dominant, low-tilt, short/light oil; medium for matched players.
- **Angle relationship = shape:** drilling angle larger than VAL angle → later, sharper breakpoint (more backend); drilling angle smaller than VAL angle → sooner, heavier roll (more midlane).
- **Safe VAL angle:** for most bowlers the largest safe angle leaves the pin just below the finger holes; for very high-track bowlers, just above the fingers.

Rule of thumb many drillers use: **smaller angles = faster/earlier response; larger angles = slower/longer.** Both angles small = strongest/quickest response; both large = smoothest/longest.

## 4. Storm VLS (Visual Layout System) / Pin Buffer system

Written as **Pin-to-PAP × PSA-to-PAP × Pin Buffer** (inches), e.g. `4 1/2" x 4" x 2"`. Storm's rationale: distances are easier to visualize and reproduce than angles.

- **Pin-to-PAP**: same as Dual Angle.
- **PSA-to-PAP** (≈ 0"–6 3/4"): how quickly the ball loses axis rotation. Shorter (≈ 2") = stable, smoother, less flare; longer (≈ 4"–5") = straighter through the front, sharper change at the breakpoint. Matters only on asymmetric cores (or with an extra hole).
- **Pin buffer** (0" up to pin-to-PAP): pin's distance from the VAL. Short buffer (0"–1 1/2") = quicker, more abrupt transition; long buffer (2 1/2"+) = smoother, more controllable transition. Buffer can never exceed pin-to-PAP.

## 5. Converting between systems

- **VAL angle ↔ Pin buffer**: buffer = pin's distance from the VAL. On a sphere of radius R ≈ 4.297" (27" circumference):
  `buffer = R · asin( sin(p2p/R) · sin(VAL) )`. Planar shortcut: `buffer ≈ p2p · sin(VAL)`.
  Inverse: `VAL = asin( sin(buffer/R) / sin(p2p/R) )`.
- **Drilling angle → PSA-to-PAP** needs the ball's pin-to-PSA distance (from the spec sheet or by measuring; varies by ball). Spherical law of cosines at the pin:
  `cos(d/R) = cos(a/R)cos(b/R) + sin(a/R)sin(b/R)cos(DA)` where a = pin-to-PAP, b = pin-to-PSA, d = PSA-to-PAP.
- Use `scripts/layout_calc.js` (`dual`, `vls`) rather than hand math.

Note: VAL angle and drilling angle share a vertex convention problem — the pin can sit on either side of the VAL (above or below the midline). Two layouts with the same three numbers can be mirror images vertically (pin up vs. pin down). State pin up/down explicitly.

## 6. Legacy & shorthand layouts

| Name | What it means | Typical effect |
|---|---|---|
| **Pin up** | Pin above the midline (toward/above the fingers). Traditionally paired with longer pin-to-PAP (4"–5") | More length, quicker backend; classic "skid-flip" lean |
| **Pin down** | Pin below the midline (toward the thumb). Traditionally paired with shorter pin-to-PAP (2"–3 1/2") | Earlier, smoother, more arcing |

Pin up/down vs. Dual Angle: the three numbers fix the pin's distance from the PAP and from the VAL but not which side of the PAP (above or below) it sits. Decide it from the target: **pin up** when the bowler wants length and a defined downlane move; **pin down** when they want an earlier, rounder read. With a high PAP (≥ 1" up), a "pin down" layout may still sit near the midline — describe the result with the calculator's `place` output rather than the label. For rev-dominant bowlers wanting length *and* smoothness, pin up with a higher VAL angle (longer buffer) is the usual combination: the pin-up placement supplies length, the long buffer keeps the transition controllable.
| **Pin over ring finger / between fingers** | Pin roughly on the midline near the grip | Shorthand; meaning depends on PAP — convert to pin-to-PAP |
| **Leverage** | Pin ≈ 3 3/8" from PAP (45° tip), CG/PSA placed to maximize flare | Maximum flare / hook; risk of over-reaction |
| **Stacked / pin on PAP side line** | Pin, CG, and grip centerline aligned | Controllable, low flare |
| **Label / "stock" layouts** | Older pre-PAP layouts referencing the logo | Avoid recommending; convert to PAP-based |
| **Storm 2LS** | Storm's two-handed layout system (accounts for no thumb, different grip center) | Use for two-handers when the bowler/driller uses Storm's system |

When a bowler says "pin up" or "pin down", always translate it to pin-to-PAP and pin buffer for *their* PAP — the same physical pin spot is a different layout on a 4 1/2" PAP vs. a 6" PAP.

## 7. Symmetric vs asymmetric

- **Symmetric** (one marker: pin; maybe CG): pin-to-PAP and VAL angle/pin buffer do nearly all the work. Drilling angle/PSA language is meaningless without an extra hole. After drilling, the thumb hole effectively becomes the PSA.
- **Asymmetric** (pin + MB/PSA marker): all three numbers matter; the higher the int. diff, the more PSA placement changes the motion.
- **Balance/extra holes**: USBC has banned balance holes in certified competition since Aug 1, 2020 (gripping holes, and a vent, still fine). Historically the extra hole was used to boost or tame flare and to fix static weights. Don't recommend one for USBC play; for non-USBC leagues/tournaments, say "check your organization's rules".

## 8. Benchmark layout library (right-handed, Dual Angle)

Starting points — always adjust to the bowler. "Strength" is relative motion for the same ball/surface.

| Layout | Character | Typical use |
|---|---|---|
| `20° x 3" x 60°` | Early, smooth, very controllable | Rev-dominant / high-rev on medium-heavy oil wanting predictability |
| `30° x 3 1/2" x 45°` | Early read, round, strong mid-lane | Speed-dominant bowlers on heavy oil |
| `40° x 4" x 35°` | Strong, quick-ish, max-ish flare | Low/medium rev needing help; heavy oil |
| `45° x 4 1/2" x 30°` | Benchmark strong-angular | Matched bowlers, benchmark ball on house/medium |
| `50° x 4 1/2" x 45°` | Benchmark balanced | Very common first/benchmark layout |
| `55° x 5" x 40°` | Length + controlled backend | Matched/rev-dominant on medium; good second ball |
| `60° x 5" x 30°` | Long, sharp ("skid-flip") | Low-tilt / forward-roll or rev-dominant bowlers who read the fronts too early; drier fronts; also speed-dominant players on fresh, short-ish patterns who want a late "go" |
| `70° x 5 1/2" x 50°` | Long, smoother, delays everything | High-rev bowlers on light oil / burn |
| `80° x 6" x 60°` | Maximum length, least hook | Very high rev, short/dry patterns, spare-ish control |
| `20° x 1 1/2"–2" x 70°` | "Pin near PAP": very stable, low flare, early roll | Control ball for high revs; or lefty/righty on fresh heavy for a straight early read |

Manufacturer charts (Storm, Roto Grip, Motiv, Brunswick/Ebonite/Hammer/Radical/Track, 900 Global) list layouts per ball; the numbers above line up with the common "benchmark", "length", and "control" options on those charts.
