# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (confirmed 2026-11-11); a surface is designed for whichever one uses it.

- **Pro shop operators** — the person at the counter and the drill press. They manage many customers: measure a bowler's PAP and grip, pick and explain a layout, record the fit and every ball drilled, and print a sheet for the drill press.
- **Serious bowlers** — league and tournament bowlers working on their own game. They want to understand their own arsenal, see why a layout suits them, and log real shots.

## Product Purpose

X-ING Pro Shop Lab turns a bowler's numbers (PAP, speed, rev rate, axis tilt and rotation, grip) into a drilling layout with the reasons behind it, then shows how the drilled ball will move down the lane before anyone drills it. It keeps the bowler's fit, arsenal and shot history so later decisions build on real data. Success means a layout the driller trusts, a bowler who understands why, and predictions that match what the ball actually does on the lane.

## Positioning

All four are confirmed as the claim (2026-11-11):

1. **Physics, not lookup.** A rigid-body simulation of the drilled ball on the bowler's own oil pattern (flare, axis migration, the pin-to-spin line rev-up, the Rule of the N), instead of the same chart answer for everyone.
2. **Learns from real shots.** Logged shots retune the lane, so predictions move toward what this bowler's ball really did.
3. **Explains its reasons.** Every layout comes with the why, in Dual Angle and VLS terms a driller trusts and plain words a bowler understands.
4. **The whole shop in one place.** Fit specs, arsenal and drill history, drill sheets with the shop's name and logo, and a customer list: a pro shop workbench, not just a calculator.

## Operating Context

- Used in the browser on a computer, tablet or phone: at the pro shop counter and drill press, and at the lanes when logging shots. Works offline from the device's copy and syncs when back online.
- Real artifacts in the workflow: the bowler's PAP measurement, the fit (hole sizes, spans in 1/64ths, pitches, inserts), the maker's spec sheet and drilling chart for a ball, the lane's oil pattern, printed drill sheets, spec sheets and fit cards.
- Layout language: Dual Angle (drilling angle × pin-to-PAP × VAL angle) and VLS / Pin Buffer; left-handed and two-handed (no-thumb) bowlers are supported throughout.

## Capabilities and Constraints

- **Modes:** Simple (plain guidance) and Advanced (ball specs, track and rev measuring, My line, lane calibration). Advanced is part of Pro.
- **Plans:** Free (1 bowler, up to 9 balls per arsenal, every ball in the database), Pro (up to 5 bowlers, unlimited arsenals, Advanced mode, Auto line and strike chance, 3D lane, Compare A/B, coverage chart, printing, export, shot log and lane calibration), Shop (unlimited bowlers, customer list, shop branding on printouts). Over-limit data becomes read-only, never deleted. Limits are enforced in the app only for now.
- **Prices are undecided.** Pro and Shop say "price coming soon"; billing (Stripe, monthly or yearly, 14-day trial) is planned, not live. Contact: Proshoplab@gmail.com.
- **Ball list:** 567 built-in US balls (current plus retired in the last 5 years, specs for each weight), kept as they are; new and corrected balls are entered by hand by the site admin and go live for everyone; retired balls drop out 7 years after release.
- **Accounts:** an account is required, even on Free. Supabase (auth, Postgres with row-level security); the customer list, shop branding and the shared ball list are enforced by the database.
- **Stack (existing):** the app is one static HTML page with in-browser physics and three.js; the front page is static HTML; hosted on Cloudflare Pages (front page at `/`, app at `/app/`).
- **On-screen text names no sources** (no manufacturers' guides, studies or sites cited); terms like Dual Angle, VLS and Rule of the N stay.

## Brand Commitments

- Name: **X-ING Pro Shop Lab** (short form X-ING).
- Voice on the front page and in the app: plain, natural and inviting; explain bowling terms rather than assume them.

## Evidence on Hand

None yet: no testimonials, customers, results, press or credentials. Future work must not invent any. The ball list and the in-app physics are product capabilities, not proof.

## Product Principles

1. **Show the reason.** A recommendation without its why is incomplete; every layout and warning says why in the bowler's terms.
2. **Real numbers over guesses.** Prefer measured inputs (PAP, fit, maker specs, logged shots) and say clearly when a value is an estimate.
3. **Serve both the counter and the bowler.** The same truth in driller language and in plain language; neither audience is an afterthought.
4. **Never lose a bowler's data.** Plan limits, retirements and corrections make things read-only or hidden, never deleted.
5. **Honest claims only.** No invented proof, and the simulation is presented as a tool for comparing layouts, confirmed on the lanes.
