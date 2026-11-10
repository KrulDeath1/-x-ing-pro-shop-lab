#!/usr/bin/env node
/*
 * Bowling layout calculator.
 *
 * Geometry: ball circumference 27" -> radius R = 27 / (2*pi) ~= 4.297".
 * Distances measured on the ball surface are arc lengths; angle (rad) = arc / R.
 *
 *   Pin buffer (pin-to-VAL) from Dual Angle:  buffer = R * asin( sin(p2p/R) * sin(VAL) )
 *   VAL angle from buffer:                    VAL    = asin( sin(buffer/R) / sin(p2p/R) )
 *   PSA-to-PAP from drilling angle (at pin), given pin-to-PSA b:
 *       cos(d/R) = cos(a/R)cos(b/R) + sin(a/R)sin(b/R)cos(DA)
 *   Pin position vs grip: treat the midline as an equator through the grip center, PAP at
 *       lon = over/R, lat = vert/R; the VAL is the meridian through the PAP. The pin is p2p
 *       from the PAP at bearing VAL off the meridian, toward the grip (great-circle destination formula).
 *   Matching:  expected_rpm = 300 + 50 * (mph - 17);  ratio = rpm / expected_rpm
 *
 * Usage:
 *   node layout_calc.js profile --speed 17 --revs 320 [--tilt 12] [--rotation 45]
 *   node layout_calc.js dual --da 45 --p2p 4.5 --val 30 [--pin2psa 6.75]
 *   node layout_calc.js vls  --p2p 4.5 --buffer 2 [--psa2pap 4] [--pin2psa 6.75]
 *   node layout_calc.js place --pap "5 1/4 x 1/2 up" --p2p 4.5 --val 30 [--pin down]
 * Inches accept decimals or fractions: 4.5, "4 1/2", "3 3/8".
 */
const R = 27 / (2 * Math.PI);
const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;

function inches(s) {
  if (s === undefined || s === null) return undefined;
  s = String(s).trim().replace(/["”]/g, '');
  const m = s.match(/^(-?\d+)?\s*(?:(\d+)\/(\d+))?$/);
  if (m && (m[1] || m[2])) {
    const whole = m[1] ? parseFloat(m[1]) : 0;
    const frac = m[2] ? parseFloat(m[2]) / parseFloat(m[3]) : 0;
    return whole < 0 ? whole - frac : whole + frac;
  }
  const v = parseFloat(s);
  if (Number.isNaN(v)) throw new Error(`Can't read inches from "${s}"`);
  return v;
}
function fmtIn(x) {
  const sign = x < 0 ? '-' : '';
  x = Math.abs(x);
  let whole = Math.floor(x);
  let eighths = Math.round((x - whole) * 8);
  if (eighths === 8) { whole += 1; eighths = 0; }
  const fr = ['', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'][eighths];
  return `${sign}${whole ? whole : ''}${whole && fr ? ' ' : ''}${fr || (whole ? '' : '0')}" (${sign}${x.toFixed(2)})`;
}
function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      o[k] = v;
    }
  }
  return o;
}
function need(o, k) { if (o[k] === undefined) throw new Error(`Missing --${k}`); return o[k]; }

function profile(o) {
  const mph = parseFloat(need(o, 'speed')), rpm = parseFloat(need(o, 'revs'));
  const tier = (v, cuts, names) => names[cuts.findIndex(c => v < c) === -1 ? names.length - 1 : cuts.findIndex(c => v < c)];
  const revTier = tier(rpm, [250, 350, 450], ['Low (stroker)', 'Medium (tweener)', 'High (cranker)', 'Very high']);
  const spdTier = mph < 15 ? 'Slow' : mph < 17.5 ? 'Medium' : mph <= 19.5 ? 'Fast' : 'Very fast';
  const expected = 300 + 50 * (mph - 17);
  const ratio = rpm / expected;
  const cls = ratio < 0.85 ? 'Strongly speed-dominant' : ratio < 0.95 ? 'Speed-dominant'
    : ratio <= 1.10 ? 'Matched' : ratio <= 1.30 ? 'Rev-dominant' : 'Strongly rev-dominant';
  const out = [
    `Speed: ${mph} mph (${spdTier})   Revs: ${rpm} rpm (${revTier})`,
    `Matched rpm for this speed: ~${Math.round(expected)}   Ratio: ${ratio.toFixed(2)} -> ${cls}`,
  ];
  if (o.tilt !== undefined) {
    const t = parseFloat(o.tilt);
    out.push(`Axis tilt: ${t}° (${t < 10 ? 'low - reads lane earlier' : t <= 20 ? 'medium' : 'high - adds length'})`);
  }
  if (o.rotation !== undefined) {
    const r = parseFloat(o.rotation);
    out.push(`Axis rotation: ${r}° (${r < 30 ? 'low - forward roll, early read' : r <= 60 ? 'medium' : 'high - more skid, sharper turn'})`);
  }
  if (mph < 12 || mph > 24 || rpm < 100 || rpm > 700) out.push('WARNING: values outside normal range - confirm units / where speed was measured.');
  return out.join('\n');
}

function bufferFrom(p2p, valDeg) { return R * Math.asin(Math.sin(p2p / R) * Math.sin(rad(valDeg))); }
function psaToPap(p2p, pin2psa, daDeg) {
  const a = p2p / R, b = pin2psa / R;
  const c = Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b) * Math.cos(rad(daDeg));
  return R * Math.acos(Math.max(-1, Math.min(1, c)));
}
function checks(p2p, buffer) {
  const w = [];
  if (p2p >= 6.75) w.push('Pin-to-PAP must be under 6 3/4".');
  if (buffer !== undefined && buffer > p2p + 1e-9) w.push('Pin buffer cannot exceed pin-to-PAP.');
  if (p2p > 3.1 && p2p < 4.1) w.push('Note: near max-flare zone (~3 3/8"-4"). Only a concern for high-rev (350+ rpm) bowlers: over-reaction / flare into the grip. For low/medium revs this is usually the point.');
  return w;
}

function dual(o) {
  const da = parseFloat(need(o, 'da')), p2p = inches(need(o, 'p2p')), val = parseFloat(need(o, 'val'));
  const buf = bufferFrom(p2p, val);
  const out = [`Dual Angle: ${da}° x ${fmtIn(p2p)} x ${val}°`, `Pin buffer (pin-to-VAL): ${fmtIn(buf)}`];
  if (o.pin2psa !== undefined) {
    const d = psaToPap(p2p, inches(o.pin2psa), da);
    out.push(`PSA-to-PAP (pin-to-PSA ${fmtIn(inches(o.pin2psa))}): ${fmtIn(d)}`);
    out.push(`VLS: ${fmtIn(p2p)} x ${fmtIn(d)} x ${fmtIn(buf)}`);
  } else {
    out.push(`VLS: ${fmtIn(p2p)} x [PSA-to-PAP needs --pin2psa] x ${fmtIn(buf)}`);
  }
  return out.concat(checks(p2p, buf)).join('\n');
}

function vls(o) {
  const p2p = inches(need(o, 'p2p')), buf = inches(need(o, 'buffer'));
  const out = [];
  const w = checks(p2p, buf);
  if (buf > p2p) return w.join('\n');
  const val = deg(Math.asin(Math.min(1, Math.sin(buf / R) / Math.sin(p2p / R))));
  out.push(`VAL angle: ${val.toFixed(1)}°`);
  if (o.psa2pap !== undefined && o.pin2psa !== undefined) {
    const a = p2p / R, b = inches(o.pin2psa) / R, d = inches(o.psa2pap) / R;
    const cosDA = (Math.cos(d) - Math.cos(a) * Math.cos(b)) / (Math.sin(a) * Math.sin(b));
    if (Math.abs(cosDA) > 1) out.push('Drilling angle: impossible combination (check PSA-to-PAP vs pin-to-PSA).');
    else out.push(`Drilling angle: ${deg(Math.acos(cosDA)).toFixed(1)}°`);
  } else out.push('Drilling angle: needs --psa2pap and --pin2psa');
  return out.concat(w).join('\n');
}

function parsePap(s) {
  // "5 1/4 x 1/2 up" | "5.25 x 0.5 down" | "5 3/8 x 0"
  const [h, v] = String(s).toLowerCase().split('x').map(t => t.trim());
  let vert = 0;
  if (v) {
    const down = /down|dn|↓/.test(v);
    vert = inches(v.replace(/up|down|dn|↑|↓/g, '').trim() || '0') * (down ? -1 : 1);
  }
  return { over: inches(h), vert };
}

function place(o) {
  const pap = parsePap(need(o, 'pap'));
  const p2p = inches(need(o, 'p2p')), val = parseFloat(need(o, 'val'));
  const down = String(o.pin || 'up').toLowerCase().startsWith('d');
  const buf = bufferFrom(p2p, val);
  // Spherical: midline = equator through grip center, PAP at (lon=over/R, lat=vert/R),
  // VAL = meridian through PAP. Pin is p2p from PAP at bearing VAL off the meridian, toward the grip.
  const lat1 = pap.vert / R, lon1 = pap.over / R, dlt = p2p / R;
  const brg = down ? Math.PI + rad(val) : -rad(val); // up-and-toward-grip or down-and-toward-grip
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dlt) + Math.cos(lat1) * Math.sin(dlt) * Math.cos(brg));
  const lon2 = lon1 + Math.atan2(Math.sin(brg) * Math.sin(dlt) * Math.cos(lat1), Math.cos(dlt) - Math.sin(lat1) * Math.sin(lat2));
  const pinOver = lon2 * R;
  const pinVert = lat2 * R;
  const hand = String(o.hand || 'R').toUpperCase().startsWith('L') ? 'left' : 'right';
  const out = [
    `PAP: ${fmtIn(pap.over)} over, ${fmtIn(Math.abs(pap.vert))} ${pap.vert >= 0 ? 'up' : 'down'}`,
    `Pin buffer (pin-to-VAL): ${fmtIn(buf)}`,
    `Pin ≈ ${fmtIn(Math.abs(pinOver))} over (${pinOver >= 0 ? `${hand} of grip center, PAP side` : 'on the far side of grip center from the PAP'}), ` +
      `${fmtIn(Math.abs(pinVert))} ${pinVert >= 0 ? 'ABOVE the midline (toward fingers)' : 'BELOW the midline (toward thumb)'}`,
    'Measured the same way as the PAP (over along the midline, then up/down). Good to ~1/8"; the driller marks the exact spot with a layout tool.',
  ];
  if (Math.abs(pinOver) < 1.25 && Math.abs(pinVert) < 2.5) out.push('Note: pin is in/near the grip area - fine structurally, but mention it to the driller.');
  return out.concat(checks(p2p, buf)).join('\n');
}

try {
  const [cmd, ...rest] = process.argv.slice(2);
  const o = args(rest);
  const fn = { profile, dual, vls, place }[cmd];
  if (!fn) { console.log('Commands: profile | dual | vls | place  (see header for usage)'); process.exit(1); }
  console.log(fn(o));
} catch (e) { console.error('Error: ' + e.message); process.exit(1); }

