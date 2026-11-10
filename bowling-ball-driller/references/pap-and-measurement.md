# PAP, Measurement, and Rules

## What PAP is
The Positive Axis Point is the pole of the bowler's rotation axis on the grip side of the ball at release — the spot that doesn't rotate. Every modern layout is measured from it, so a wrong PAP makes every number wrong. PAPs move with release changes; re-check every few months or after a coaching change.

## Finding it (pro shop methods)
1. **Oil-ring method**: bowl a few shots on oil without wiping; find the oil ring closest to the grip; the center of that ring's circle is the PAP (verify with tape: tape on the true PAP stays still at release).
2. **Spinner (e.g., Armadillo / ball spinner)**: spin the ball on the bowler's track and mark the stationary top with a pencil.
3. **Video/tracking systems** can estimate it, but in-person measuring is the standard.

## Measuring & notation
- Start at the **center of the grip** (midpoint between the finger holes' centers and the thumb, on the midline).
- **Horizontal**: measure along the midline toward the PAP side (right of the grip for right-handers). 
- **Vertical**: measure up (toward the fingers) or down (toward the thumb) from the midline to the PAP.
- Notation: horizontal first, vertical second, e.g. `5 3/8" x 1/2" up` (some write `5 3/8 → 1/2 ↑`).

Typical one-handed PAPs: **4 1/2"–6 1/4" over, 0"–1 1/4" up**; the "average" is ~5 1/4"–5 1/2" over, 1/2" up.

## What PAP tells you
| PAP | Release tendency | Layout implications |
|---|---|---|
| Far over (≥ 5 3/4"), near midline | Lower tilt, bigger track (closer to 3/4 / full roller) | Reads lane earlier; often benefits from more length. Flare rings can reach the grip — check with high-flare layouts. |
| Average (5"–5 1/2", 0–3/4" up) | Typical 3/4 roller | Matrix as-is |
| Close (≤ 4 3/4") and/or high (≥ 1" up) | Higher tilt, smaller track (spinner tendency) | Adds length naturally; can use stronger/earlier layouts. Less room before pin lands in the grip. |
| Below midline ("down") | Unusual; often a release quirk | Verify the measurement before drilling |

## Getting axis tilt and rotation
A PAP's grip coordinates alone can't give tilt or rotation: the same PAP can be released at different angles. Use one of these instead:
- **Release photo/video (exact, both angles):** tape on the PAP, film from directly behind at lane level, pick the frame as the fingers leave. With the tape's offset from the ball's center normalized by the radius (u across, v up): tilt = asin(v); rotation = atan2(√(1−u²−v²), |u|). This is Blueprint's spherical overlay / Tenpin Toolkit method.
- **Oil track, no photo (tilt only):** the track is the contact ring, which sits (90° + tilt) from the PAP.
  - PAP → track distance d: tilt = d/R − 90° with R = 4.297" (6 3/4" = 0°, 8" ≈ 17°, 8 1/2" ≈ 23°, 9" ≈ 30°). Anything under 6 3/4" is a measuring error.
  - Ring diameter D measured over the ball: tilt = 90° − (D/2)/R (13 1/2" = 0°, 11" ≈ 17°).
  - Track distance outside the grip center (gap): d = PAP-to-grip distance + gap, then as above. Track types: full roller ~0", high roller ~½", semi-roller ½–3", low roller 3–5", high spinner 5–7", low spinner 7"+.
- Rough correlation only: smaller / higher PAPs usually go with spinner-type releases (more tilt), e.g. 4" x 1 1/4" up with a spinner track ≈ 40–45°.

## Two-handers
No thumb hole means the "grip center" is defined between the finger holes and the virtual thumb position (or by the layout system, e.g., Storm 2LS). Two-handers typically have very high revs and often PAPs that sit higher/closer; verify carefully. Favor control layouts and longer buffers; leverage layouts are usually too much except on very heavy oil.

## Left-handers
Mirror everything: PAP is left of the grip; "pin up/down" and angles are identical in magnitude.

## Rules (USBC — verify current specs for the bowler's organization)
- Since **Aug 1, 2020**, USBC prohibits balance (weight) holes in certified competition; holes must be for gripping (plus allowed vent holes). Static weight limits (top/side/finger/thumb) were eliminated at the same time.
- Layouts that historically depended on an extra hole (to strengthen asymmetry on symmetric balls, or to fix static weight) are not legal for USBC play. Non-USBC events can differ.
- Ball must be legal surface-wise at competition time (no altering surface during competition except as rules allow).

## Physical sanity checks to flag for the driller
- Pin, CG, or MB markers sitting under a gripping hole: generally fine on modern balls; don't treat as a problem, just mention.
- Gripping holes intersecting the track/flare rings on large PAPs with high-flare layouts → oil in holes, inconsistent release.
- Very short pin-to-PAP (< 1") on a high-flare core can produce almost no flare — confirm that's the intent.
- Fit (span, pitch, hole sizes) is separate from layout and matters as much for consistency; leave it to the in-person driller.
