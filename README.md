# X-ING Pro Shop Lab

**Drill smarter. See the shot before you throw it.**

X-ING Pro Shop Lab is a bowling pro shop workbench that runs in your browser. Enter a bowler's PAP, speed, rev rate, tilt and rotation. It picks and explains a drilling layout, shows how the ball will move down the lane in 3D, and then learns from real shots so its predictions match the bowler's actual lane.

It's built for two kinds of people:
- **Pro shop operators** who manage a whole wall of customers.
- **Serious bowlers** who want to understand their own arsenal.

## What it does

- **Layout recommendations.** Get a layout for a specific bowler and lane condition, in Dual Angle, VLS / Pin Buffer, pin-up/pin-down or label terms, with the reasoning behind it.
- **Bowler read.** See at a glance whether a bowler is rev-dominant or speed-dominant, and what that means for layout energy and shape.
- **Ball motion simulation.** A rigid-body model of the ball shows skid, hook and roll on a tunable oil pattern in 3D, so you can see the change before you drill it.
- **A/B compare.** Put two layouts or balls side by side on the same lane and the same bowler.
- **Fit specs.** Record the thumb and finger hole sizes, the span (actual and cut to cut) and the pitches. The app works out center-to-center span and finger spacing, and sends them straight to the layout.
- **Arsenal manager.** Keep every drill record for every bowler. A coverage chart shows gaps and overlaps across the bag.
- **Line finder.** Auto line finds the line with the best strike chance on the current lane and allows for a board of miss either way at the arrows. Strike chance depends on entry angle and board at the pocket.
- **Shot log and lane calibration.** Log real shots: the leave, the target, the breakpoint and the pin hit. Each shot moves the model lane toward what really happened. Bad releases are logged without changing the lane, and every shot comes with a "move" tip.
- **Print drill sheets.** Clean, printable spec sheets for the drill press.
- **Simple and Driller modes.** Plain-language guidance for bowlers, full controls for the person at the drill press.

## Accounts and plans

Sign up as a **bowler** or as a **pro shop**. Your bowlers, balls, shot log and lane calibration are saved to your account and work across devices. Everything is also kept on the device, so it works without a connection and uploads when you're back online.

| Plan | For | Includes |
|------|-----|----------|
| **Free** | Everyone | Unlimited bowlers and balls, layout recommendations, PAP, ball motion, the 3D drilled ball, the top-down lane, arsenal list, import |
| **Pro** | Bowlers | Everything in Free, plus Auto line (best strike line) and strike chance, the 3D lane, Compare A/B, arsenal coverage chart, printing drill and spec sheets, export, the shot log and lane calibration |
| **Shop** | Pro shops | Everything in Pro, plus Driller mode (shop branding on prints and a customer list are planned) |

You need an account to use the app, even on Free. Signed-out visitors see the app greyed out with a "Sign in or create a free account" banner, and new accounts must confirm their email before they can sign in. Locked features stay visible, greyed out with a Pro or Shop badge, and clicking one shows the plans. The gates run in the browser only, so they aren't a security boundary.

## Tech

- The app is one static HTML page. The physics runs in the browser, and the 3D view uses three.js.
- Accounts and storage use Supabase: Postgres with row-level security, so each user can only see their own data. The schema is in [`supabase/migrations`](supabase/migrations).
- Run it locally with `node .claude/serve.js`, then open http://localhost:5317.
