// X-ING Pro Shop Lab — plug color matching (Shop).
// Turns a target cover color into drop recipes for a plug material and its tint kit.
//   • colors are compared in CIELAB with CIEDE2000 (ΔE)
//   • tints mix subtractively (single-constant Kubelka-Munk per linear RGB channel), not as an RGB average
//   • the search tries up to 4 tints at 0–12 drops, then hill-climbs; the best 3 distinct recipes come back
//   • pearls are an effect, never used to match the hue
// Pure functions only (no DOM), so `node --test js/plug-color.test.mjs` runs them.

/* ---------- conversions (sRGB D65) ---------- */
export const WHITE_D65 = [0.95047, 1.0, 1.08883];

export function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
export function linearToSrgb(l) {
  const v = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, v * 255));
}
export const rgbToLinear = c => [srgbToLinear(c[0]), srgbToLinear(c[1]), srgbToLinear(c[2])];
export const linearToRgb = l => [linearToSrgb(l[0]), linearToSrgb(l[1]), linearToSrgb(l[2])];

export function linearToXyz([r, g, b]) {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b
  ];
}
export function xyzToLinear([X, Y, Z]) {
  return [
    3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    -0.969266 * X + 1.8760108 * Y + 0.041556 * Z,
    0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
  ];
}
const EPS = 216 / 24389, KAPPA = 24389 / 27;
const f = t => (t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116);
const finv = t => (t * t * t > EPS ? t * t * t : (116 * t - 16) / KAPPA);

export function xyzToLab(xyz) {
  const fx = f(xyz[0] / WHITE_D65[0]), fy = f(xyz[1] / WHITE_D65[1]), fz = f(xyz[2] / WHITE_D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function labToXyz(lab) {
  const fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200;
  return [finv(fx) * WHITE_D65[0], finv(fy) * WHITE_D65[1], finv(fz) * WHITE_D65[2]];
}
export const linearToLab = l => xyzToLab(linearToXyz(l));
export const rgbToLab = c => linearToLab(rgbToLinear(c));
export const labToRgb = lab => linearToRgb(xyzToLinear(labToXyz(lab)));

export function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  if (!Number.isFinite(n) || h.length !== 6) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = c => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
export const hexToLab = hex => rgbToLab(hexToRgb(hex));
export const linToHex = l => rgbToHex(linearToRgb(l));

/** readable text color (near-black or white) on a background hex */
export function textOn(hex) {
  const [r, g, b] = rgbToLinear(hexToRgb(hex));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#111' : '#fff';
}

/* ---------- CIEDE2000 (Sharma, Wu, Dalal 2005) ---------- */
const rad = d => (d * Math.PI) / 180, deg = r => (r * 180) / Math.PI;
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cbar7 = Math.pow((C1 + C2) / 2, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = C1p === 0 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p === 0 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.2 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const Cbp7 = Math.pow(Cbp, 7), Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T, Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  const x = dLp / Sl, y = dCp / Sc, z = dHp / Sh;
  return Math.sqrt(x * x + y * y + z * z + Rt * y * z);
}
/** Great under 2, Good under 5, otherwise Rough */
export const matchQuality = de => (de < 2 ? 'Great' : de < 5 ? 'Good' : 'Rough');

/* ---------- the tint kit ---------- */
/** Motiv Tech-Line HD with the kit's 12 tints. Swatches are starting guesses for a puck of that tint alone at
 *  3 drops in a standard batch; calibrating with a photo of a real test puck replaces them. */
export const DEFAULT_TINTS = [
  { id: 'red', name: 'Red', hex: '#b5121b' },
  { id: 'blue', name: 'Blue', hex: '#1f46b0' },
  { id: 'green', name: 'Green', hex: '#1f8a3c' },
  { id: 'purple', name: 'Purple', hex: '#5a2a9a' },
  { id: 'magenta', name: 'Magenta', hex: '#c01a72' },
  { id: 'orange', name: 'Orange', hex: '#e8641a' },
  { id: 'yellow', name: 'Yellow', hex: '#f0cc14' },
  { id: 'brown', name: 'Brown', hex: '#6b3d1f' },
  { id: 'black', name: 'Black', hex: '#1c1c1e' },
  { id: 'white', name: 'White', hex: '#f4f4f0' },
  { id: 'silver-pearl', name: 'Silver pearl', hex: '#c9ccd2', pearl: true },
  { id: 'gold-pearl', name: 'Gold pearl', hex: '#cfb15a', pearl: true }
];
export const DEFAULT_PLUG_SETTINGS = { batchSize: 1, batchName: 'standard cup' };
/** the kit with the user's calibrations ({ tintId: { hex, drops, batchSize } }) laid over it */
export const kitTints = (calib = {}) => DEFAULT_TINTS.map(t => (calib && calib[t.id] ? { ...t, calib: calib[t.id] } : { ...t }));

/* ---------- mixing model ----------
   K/S = (1-R)^2 / (2R), R = 1 + K/S - sqrt((K/S)^2 + 2 K/S), per linear channel. K/S adds up:
   ks_mix = ks_base + Σ (drops_i / batch) · unitKS_i, where unitKS_i comes from the tint's swatch (default or
   calibrated). White gets a negative unit (it lifts the base); reflectance is clamped to stay physical. */
export const BASE_HEX = '#c8c8c4'; // unpigmented plug material
export const DEFAULT_REF_DROPS = 3;
const R_MIN = 0.0005, R_MAX = 0.97;
export const ksOf = r => { const R = Math.min(R_MAX, Math.max(R_MIN, r)); return ((1 - R) * (1 - R)) / (2 * R); };
export const reflectanceOf = ks => { const k = Math.max(ks, ksOf(R_MAX)); return 1 + k - Math.sqrt(k * k + 2 * k); };
export const baseKS = () => { const l = rgbToLinear(hexToRgb(BASE_HEX)); return [ksOf(l[0]), ksOf(l[1]), ksOf(l[2])]; };

export function prepareTint(t) {
  const base = baseKS(), hex = t.calib ? t.calib.hex : t.hex;
  const conc = t.calib ? t.calib.drops / (t.calib.batchSize || 1) : DEFAULT_REF_DROPS;
  const l = rgbToLinear(hexToRgb(hex)), unit = [0, 0, 0];
  for (let c = 0; c < 3; c++) unit[c] = (ksOf(l[c]) - base[c]) / Math.max(conc, 1e-6);
  return { id: t.id, name: t.name, unit };
}
export const prepareAll = tints => tints.map(prepareTint);

/** linear reflectance of a mix; drops line up with prepared[] */
export function mixLinear(prepared, drops, batchSize) {
  const base = baseKS(), out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let ks = base[c];
    for (let i = 0; i < prepared.length; i++) if (drops[i]) ks += (drops[i] / batchSize) * prepared[i].unit[c];
    out[c] = reflectanceOf(ks);
  }
  return out;
}
export const mixLab = (p, d, b) => linearToLab(mixLinear(p, d, b));
export const mixRgb = (p, d, b) => linearToRgb(mixLinear(p, d, b));
export const mixHex = (p, d, b) => rgbToHex(mixRgb(p, d, b));

/* ---------- recipe search ---------- */
const nz = d => d.reduce((n, v) => n + (v > 0 ? 1 : 0), 0);
const sum = d => d.reduce((a, b) => a + b, 0);
// each extra tint must buy at least 0.4 ΔE (well under a visible difference), so a simple recipe beats a busy mix that is only marginally closer
const TINT_PENALTY = 0.4, DROP_PENALTY = 0.004;
const complexity = d => TINT_PENALTY * Math.max(0, nz(d) - 1) + DROP_PENALTY * sum(d);

/** coarse grid over tint subsets (fast Lab distance), then hill-climb the best seeds on ΔE2000.
 *  opts: { batchSize, maxTints = 4, maxDrops = 12, results = 3 } → [{ drops, deltaE, nTints, totalDrops, score }] */
export function searchRecipes(tints, target, opts) {
  const maxTints = opts.maxTints ?? 4, maxDrops = opts.maxDrops ?? 12, nWanted = opts.results ?? 3, B = opts.batchSize || 1;
  const n = tints.length;
  if (!n) return [];
  const base = baseKS(), unit = tints.map(t => t.unit), ks = [0, 0, 0], lin = [0, 0, 0];
  const fastLab = d => {
    for (let c = 0; c < 3; c++) { let s = base[c]; for (let i = 0; i < n; i++) if (d[i]) s += (d[i] / B) * unit[i][c]; ks[c] = s; }
    for (let c = 0; c < 3; c++) lin[c] = reflectanceOf(ks[c]);
    return linearToLab(lin);
  };
  const d76 = l => Math.hypot(l[0] - target[0], l[1] - target[1], l[2] - target[2]);

  let pool = tints.map((_, i) => i);
  if (n > 10) { // many tints: keep the 10 that get closest on their own
    pool = pool.map(i => {
      let best = Infinity;
      for (const dd of [1, 2, 4, 8]) { const d = new Array(n).fill(0); d[i] = dd; best = Math.min(best, d76(fastLab(d))); }
      return { i, best };
    }).sort((a, b) => a.best - b.best).slice(0, 10).map(s => s.i);
  }
  const levels = [1, 2, 4, 8, 12].filter(v => v <= maxDrops);
  if (!levels.includes(maxDrops)) levels.push(maxDrops);

  // stage 1: coarse grid, keep a bounded set of seeds
  const seeds = [], SEED_CAP = 300;
  let worst = Infinity;
  const pushSeed = (d, e) => {
    if (e >= worst) return;
    seeds.push({ d: d.slice(), e });
    if (seeds.length > SEED_CAP * 2) { seeds.sort((a, b) => a.e - b.e); seeds.length = SEED_CAP; worst = seeds[SEED_CAP - 1].e; }
  };
  const cur = new Array(n).fill(0);
  const rec = (start, used) => {
    if (used > 0) pushSeed(cur, d76(fastLab(cur)));
    if (used >= maxTints) return;
    for (let p = start; p < pool.length; p++) {
      const i = pool[p];
      for (const lv of levels) { cur[i] = lv; rec(p + 1, used + 1); }
      cur[i] = 0;
    }
  };
  rec(0, 0);
  seeds.sort((a, b) => a.e - b.e);

  // stage 2: hill-climb ΔE2000 from the top seeds
  const visited = new Map();
  const eval2000 = d => {
    const k = d.join(',');
    let c = visited.get(k);
    if (!c) { const de = deltaE2000(fastLab(d), target); c = { drops: d.slice(), deltaE: de, nTints: nz(d), totalDrops: sum(d), score: de + complexity(d) }; visited.set(k, c); }
    return c;
  };
  const neighbors = d => {
    const out = [], used = nz(d);
    for (const i of pool) {
      for (const step of [1, -1, 2, -2]) {
        const v = d[i] + step;
        if (v < 0 || v > maxDrops || (d[i] === 0 && used >= maxTints)) continue;
        const nd = d.slice(); nd[i] = v; out.push(nd);
      }
      for (const j of pool) {
        if (j === i || d[i] + 1 > maxDrops || d[j] < 1) continue;
        const nd = d.slice(); nd[i] += 1; nd[j] -= 1;
        if (nz(nd) <= maxTints) out.push(nd);
      }
    }
    return out;
  };
  // every single-tint recipe is cheap to check exactly, and the simple answer must never be missed
  for (const i of pool) for (let v = 1; v <= maxDrops; v++) { const d = new Array(n).fill(0); d[i] = v; eval2000(d); }
  // climb from the overall best seeds plus the best few at each tint count (climbing rarely removes a tint)
  const starts = seeds.slice(0, 20);
  for (let t = 1; t <= maxTints; t++) starts.push(...seeds.filter(s => nz(s.d) === t).slice(0, 4));
  for (const seed of starts) {
    let best = eval2000(seed.d);
    for (let iter = 0; iter < 40; iter++) {
      let improved = false;
      for (const nd of neighbors(best.drops)) { const c = eval2000(nd); if (c.score < best.score - 1e-9) { best = c; improved = true; } }
      if (!improved) break;
    }
  }
  const picked = [];
  for (const c of [...visited.values()].sort((a, b) => a.score - b.score)) {
    // skip near-duplicates of a picked recipe (same tints, within 1 drop each)
    if (picked.some(p => p.drops.every((v, i) => (v > 0) === (c.drops[i] > 0) && Math.abs(v - c.drops[i]) <= 1))) continue;
    picked.push(c);
    if (picked.length >= nWanted) break;
  }
  return picked;
}

/** recipe options for one target color: up to 2 of the user's own 4–5 star recipes for a close color (ΔE under 5)
 *  first, then the search's best 3. Drops come back as { tintId: drops }. */
export function recipeOptions(targetHex, { tints, recipes = [], batchSize = 1 }) {
  const main = tints.filter(t => !t.pearl), prepared = prepareAll(main), lab = hexToLab(targetHex);
  const hist = [];
  for (const r of recipes) {
    if (!(r.rating >= 4)) continue;
    for (const s of r.spots || []) {
      const de = deltaE2000(hexToLab(s.targetHex), lab);
      if (de >= 5) continue;
      const drops = {};
      for (const [id, v] of Object.entries(s.drops || {})) if (v > 0 && main.some(t => t.id === id)) drops[id] = v;
      if (Object.keys(drops).length) hist.push({ label: 'Your recipe', history: { rating: r.rating, de, ball: r.ballLabel || '' }, drops, pearlId: s.pearlId, pearlDrops: s.pearlDrops });
    }
  }
  hist.sort((a, b) => b.history.rating - a.history.rating || a.history.de - b.history.de);
  const out = [], seen = new Set();
  for (const h of hist) { const k = JSON.stringify(h.drops); if (seen.has(k) || out.length >= 2) continue; seen.add(k); out.push(h); }
  const maxDrops = Math.min(12, Math.max(4, Math.round(12 * batchSize)));
  searchRecipes(prepared, lab, { batchSize, maxDrops, results: 3 }).forEach((c, i) => {
    const drops = {};
    main.forEach((t, k) => { if (c.drops[k] > 0) drops[t.id] = c.drops[k]; });
    out.push({ label: `Option ${i + 1}`, drops });
  });
  return out;
}

/** predicted color and ΔE of a { tintId: drops } recipe against a target */
export function evaluateRecipe(drops, targetHex, { tints, batchSize = 1 }) {
  const main = tints.filter(t => !t.pearl), prepared = prepareAll(main), arr = main.map(t => drops[t.id] || 0);
  const lab = mixLab(prepared, arr, batchSize);
  return { hex: rgbToHex(linearToRgb(mixLinear(prepared, arr, batchSize))), deltaE: deltaE2000(lab, hexToLab(targetHex)), total: sum(arr) };
}

/** "Blue 4 · Purple 2" in kit order; no drops reads "Clear base only" */
export function dropsText(drops, tints) {
  const parts = tints.filter(t => (drops?.[t.id] || 0) > 0).map(t => `${t.name} ${drops[t.id]}`);
  return parts.length ? parts.join(' · ') : 'Clear base only';
}
export function spotText(s, tints) {
  let t = dropsText(s.drops, tints);
  if (s.pearlId && s.pearlDrops) t += ` + ${tints.find(x => x.id === s.pearlId)?.name || 'Pearl'} ${s.pearlDrops} (effect)`;
  return t;
}

/* ---------- reading a photo ---------- */
/** sample radius in pixels for a photo of w × h */
export const sampleRadius = (w, h) => Math.max(4, Math.round(0.015 * Math.min(w, h)));
let LUT = null;
/** area average in linear light around (nx, ny) of an ImageData-like { data, width, height }. The brightest 15%
 *  (glare) and darkest 5% (specks, shadow) of the disc are dropped first. */
export function sampleArea(img, nx, ny) {
  if (!LUT) { LUT = new Float32Array(256); for (let i = 0; i < 256; i++) LUT[i] = srgbToLinear(i); }
  const w = img.width, h = img.height, d = img.data;
  const cx = Math.round(nx * (w - 1)), cy = Math.round(ny * (h - 1)), r = sampleRadius(w, h), px = [];
  for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++)
    for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      const i = (y * w + x) * 4, rr = LUT[d[i]], gg = LUT[d[i + 1]], bb = LUT[d[i + 2]];
      px.push([0.2126 * rr + 0.7152 * gg + 0.0722 * bb, rr, gg, bb]);
    }
  if (!px.length) return [0.5, 0.5, 0.5];
  px.sort((a, b) => a[0] - b[0]);
  const lo = Math.floor(px.length * 0.05), hi = Math.max(lo + 1, Math.ceil(px.length * 0.85)), sel = px.slice(lo, hi);
  const s = [0, 0, 0];
  for (const p of sel) { s[0] += p[1]; s[1] += p[2]; s[2] += p[3]; }
  return s.map(v => v / sel.length);
}
/** gains that turn a sampled white card into neutral light grey (this also evens out exposure) */
export const whiteGains = (white, target = 0.85) => white.map(v => target / Math.max(v, 1e-4));
export const applyGains = (l, g) => (g ? l.map((v, i) => Math.min(1, v * g[i])) : l);

/* ---------- multi-color covers ----------
   Two-color covers for balls whose single render color can't show the swirl. The colors are approximate starting
   points: a photo of the actual ball is always more accurate. Matched to the ball list by brand + name. */
const MC = [
  ['Storm', 'Phaze II', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Storm', 'IQ Tour', 'Blue,Black', '#1f55c4,#1a1a1c'],
  ['Storm', 'IQ Tour Pearl', 'Purple,Silver', '#6a2fa8,#b8bcc2'],
  ['Storm', 'Hy-Road', 'Navy,Black', '#16255f,#1a1a1c'],
  ['Storm', 'Hy-Road Pearl', 'Blue,Silver', '#1f55c4,#b8bcc2'],
  ['Storm', 'Hy-Road Max', 'Blue,Navy', '#1f55c4,#16255f'],
  ['Storm', 'Tropical Surge', 'Pink,Blue', '#e8579b,#1f55c4'],
  ['Storm', 'Marvel Maxx', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Storm', 'Virtual Energy', 'Blue,Black,Silver', '#1f55c4,#1a1a1c,#b8bcc2'],
  ['Storm', 'Virtual Gravity', 'Purple,Black', '#6a2fa8,#1a1a1c'],
  ['Storm', 'Pitch Black', 'Black', '#1a1a1c'],
  ['Storm', 'Ion Pro', 'Blue,Black', '#1f55c4,#1a1a1c'],
  ['Roto Grip', 'Hustle Ink', 'Black,Teal', '#1a1a1c,#1a9a9a'],
  ['Roto Grip', 'Attention Star', 'Blue,Purple', '#1f55c4,#6a2fa8'],
  ['Roto Grip', 'Idol', 'Black,Red', '#1a1a1c,#c4202b'],
  ['Roto Grip', 'Rubicon UC2', 'Black,Blue', '#1a1a1c,#1f55c4'],
  ['900 Global', 'Honey Badger', 'Black,Orange', '#1a1a1c,#ee7a1c'],
  ['900 Global', 'Zen', 'Blue,Aqua', '#1f55c4,#2bc0c0'],
  ['Brunswick', 'Rhino', 'Green,Black', '#2b9a4a,#1a1a1c'],
  ['Brunswick', 'Vapor Zone', 'Black,Blue', '#1a1a1c,#1f55c4'],
  ['Brunswick', 'Danger Zone', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Brunswick', 'Quantum', 'Blue,Black', '#1f55c4,#1a1a1c'],
  ['Brunswick', 'Quantum Bias', 'Blue,Navy', '#1f55c4,#16255f'],
  ['DV8', 'Hell Raiser', 'Red,Black', '#c4202b,#1a1a1c'],
  ['DV8', 'Alley Cat', 'Purple,Black', '#6a2fa8,#1a1a1c'],
  ['DV8', 'Thug', 'Black', '#1a1a1c'],
  ['DV8', 'Outcast', 'Orange,Black', '#ee7a1c,#1a1a1c'],
  ['DV8', 'Dead Aim', 'Black,Green', '#1a1a1c,#2b9a4a'],
  ['DV8', 'Harsh Reality', 'Black,Blue', '#1a1a1c,#1f55c4'],
  ['Hammer', 'Black Widow 2.0', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Hammer', 'Purple Pearl Urethane', 'Purple', '#6a2fa8'],
  ['Hammer', 'Black Pearl Urethane', 'Black', '#1a1a1c'],
  ['Hammer', 'Raw', 'Orange,Black', '#ee7a1c,#1a1a1c'],
  ['Ebonite', 'Maxim', 'Blue,Purple', '#1f55c4,#6a2fa8'],
  ['Ebonite', 'Game Breaker 4', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Ebonite', 'Game Breaker 5', 'Blue,Black', '#1f55c4,#1a1a1c'],
  ['Columbia 300', 'White Dot', 'White', '#f1f1f1'],
  ['Columbia 300', 'Yellow Dot', 'Yellow', '#f2d21b'],
  ['Motiv', 'Venom Shock', 'Purple,Black', '#6a2fa8,#1a1a1c'],
  ['Motiv', 'Jackal Ghost', 'Blue,Black', '#1f55c4,#1a1a1c'],
  ['Motiv', 'Trident Abyss', 'Navy,Teal', '#16255f,#1a9a9a'],
  ['Motiv', 'Primal Rage Evolution', 'Red,Black', '#c4202b,#1a1a1c'],
  ['Motiv', 'Ripcord', 'Black,Red', '#1a1a1c,#c4202b'],
  ['Motiv', 'Crown Jewel', 'Purple,Pink', '#6a2fa8,#e8579b']
];
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MC_INDEX = new Map(MC.map(([brand, name, names, hexes]) => [norm(brand + ' ' + name), { names: names.split(','), colors: hexes.split(',') }]));
/** count of built-in multi-color covers */
export const MULTI_COLOR_COUNT = MC.length;
/** { names, colors } for a ball with a known multi-color cover, else null */
export const multiColorCover = (brand, name) => MC_INDEX.get(norm(brand + ' ' + name)) || null;
