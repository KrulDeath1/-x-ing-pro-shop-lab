// Tests for js/plug-color.js.  Run:  node --test js/plug-color.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TINTS, deltaE2000, hexToRgb, labToRgb, linearToSrgb, matchQuality, mixHex, mixLab, prepareAll, rgbToHex,
  rgbToLab, rgbToLinear, searchRecipes, srgbToLinear, linearToXyz, hexToLab, recipeOptions, evaluateRecipe, dropsText,
  spotText, kitTints, sampleArea, whiteGains, applyGains, multiColorCover, MULTI_COLOR_COUNT
} from './plug-color.js';

const close = (got, want, digits) => assert.ok(Math.abs(got - want) < Math.pow(10, -digits) / 2, `${got} ≈ ${want} (${digits} digits)`);

describe('conversions', () => {
  it('sRGB <-> linear round trips and known values', () => {
    assert.equal(srgbToLinear(0), 0);
    close(srgbToLinear(255), 1, 10);
    close(srgbToLinear(128), 0.21586, 4);
    for (const v of [0, 1, 17, 64, 128, 200, 255]) close(linearToSrgb(srgbToLinear(v)), v, 6);
  });
  it('sRGB red -> XYZ', () => {
    const xyz = linearToXyz(rgbToLinear([255, 0, 0]));
    close(xyz[0], 0.4124, 3); close(xyz[1], 0.2127, 3); close(xyz[2], 0.0193, 3);
  });
  it('sRGB -> Lab reference values (D65)', () => {
    const cases = [
      [[255, 255, 255], [100, 0, 0]], [[0, 0, 0], [0, 0, 0]], [[255, 0, 0], [53.24, 80.09, 67.2]],
      [[0, 255, 0], [87.73, -86.18, 83.18]], [[0, 0, 255], [32.3, 79.19, -107.86]]
    ];
    for (const [rgb, lab] of cases) { const r = rgbToLab(rgb); for (let i = 0; i < 3; i++) close(r[i], lab[i], 0); }
  });
  it('Lab -> sRGB round trip', () => {
    for (const hex of ['#336699', '#ff8800', '#101010', '#f0f0e0']) assert.equal(rgbToHex(labToRgb(rgbToLab(hexToRgb(hex)))), hex);
  });
});

describe('CIEDE2000 (Sharma test data)', () => {
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
    [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082]
  ];
  pairs.forEach(([a, b, want], i) => it(`pair ${i}`, () => { close(deltaE2000(a, b), want, 3); close(deltaE2000(b, a), want, 3); }));
  it('labels', () => {
    assert.equal(matchQuality(1.9), 'Great'); assert.equal(matchQuality(2), 'Good');
    assert.equal(matchQuality(4.99), 'Good'); assert.equal(matchQuality(5), 'Rough');
  });
});

const tints = DEFAULT_TINTS.filter(t => !t.pearl), prepared = prepareAll(tints);
const mk = o => { const d = new Array(tints.length).fill(0); for (const [k, v] of Object.entries(o)) d[tints.findIndex(t => t.id === k)] = v; return d; };

describe('mixing model', () => {
  it('zero drops gives base; more tint is darker', () => {
    const base = mixLab(prepared, mk({}), 1), b2 = mixLab(prepared, mk({ blue: 2 }), 1), b6 = mixLab(prepared, mk({ blue: 6 }), 1);
    assert.ok(b2[0] < base[0]); assert.ok(b6[0] < b2[0]);
  });
  it('default swatch is reproduced at 3 drops', () => {
    for (const t of tints) assert.ok(deltaE2000(hexToLab(mixHex(prepared, mk({ [t.id]: 3 }), 1)), hexToLab(t.hex)) < 1.5, t.id);
  });
  it('is subtractive: blue + yellow goes green, not a grey RGB average', () => {
    assert.ok(mixLab(prepared, mk({ blue: 2, yellow: 2 }), 1)[1] < 0);
  });
  it('white lightens, black darkens', () => {
    const mid = mixLab(prepared, mk({ blue: 3 }), 1);
    assert.ok(mixLab(prepared, mk({ blue: 3, white: 3 }), 1)[0] > mid[0]);
    assert.ok(mixLab(prepared, mk({ blue: 3, black: 3 }), 1)[0] < mid[0]);
  });
  it('a bigger batch dilutes the same drops', () => {
    assert.ok(mixLab(prepared, mk({ red: 3 }), 2)[0] > mixLab(prepared, mk({ red: 3 }), 1)[0]);
  });
  it('calibration changes the model', () => {
    const p2 = prepareAll(tints.map(t => (t.id === 'blue' ? { ...t, calib: { hex: '#0a1450', drops: 2, batchSize: 1 } } : t)));
    assert.equal(mixHex(p2, mk({ blue: 2 }), 1), '#0a1450');
  });
});

describe('recipe search', () => {
  it('reproduces a recipe from its own predicted color', () => {
    const recipe = mk({ blue: 4, purple: 2 });
    const res = searchRecipes(prepared, mixLab(prepared, recipe, 1), { batchSize: 1 });
    assert.ok(res[0].deltaE < 0.1); assert.deepEqual(res[0].drops, recipe);
  });
  it('finds near-zero matches for assorted multi-tint recipes, quickly', () => {
    for (const r of [{ red: 5, black: 1 }, { green: 3, yellow: 5, white: 2 }, { orange: 6, brown: 2, white: 1 }, { blue: 2, magenta: 3, black: 1, white: 4 }, { purple: 7, black: 2 }]) {
      const t0 = performance.now(), res = searchRecipes(prepared, mixLab(prepared, mk(r), 1), { batchSize: 1 }), ms = performance.now() - t0;
      assert.ok(res[0].deltaE < 1, JSON.stringify(r)); assert.ok(ms < 600, `${ms} ms`);
    }
  });
  it('returns 3 distinct results, best first, within the limits', () => {
    const res = searchRecipes(prepared, hexToLab('#3a5fa0'), { batchSize: 1, maxTints: 3, maxDrops: 8 });
    assert.equal(res.length, 3);
    for (const r of res) { assert.ok(r.nTints <= 3); assert.ok(Math.max(...r.drops) <= 8); }
    assert.ok(res[0].score <= res[1].score);
  });
  it('prefers fewer tints when a simple exact recipe exists', () => {
    assert.equal(searchRecipes(prepared, mixLab(prepared, mk({ red: 3 }), 1), { batchSize: 1 })[0].nTints, 1);
  });
  it('picks a simple near-black over a busy mix that is only marginally closer', () => {
    // black alone reaches ΔE < 1 here; a 4-tint mix gets ~0.2, which nobody can see
    const best = searchRecipes(prepared, hexToLab('#111111'), { batchSize: 1 })[0];
    assert.ok(best.nTints <= 2, JSON.stringify(best.drops)); assert.ok(best.deltaE < 2);
  });
});

describe('recipe options and text', () => {
  const kit = kitTints();
  it('puts a well-rated close recipe from the user first', () => {
    const recipes = [{ rating: 5, ballLabel: 'Storm Phaze II', spots: [{ targetHex: '#c4202b', drops: { red: 6, black: 1 } }] },
      { rating: 2, spots: [{ targetHex: '#c4202b', drops: { red: 9 } }] }];
    const opts = recipeOptions('#c5212c', { tints: kit, recipes, batchSize: 1 });
    assert.equal(opts[0].label, 'Your recipe'); assert.deepEqual(opts[0].drops, { red: 6, black: 1 });
    assert.equal(opts.filter(o => o.history).length, 1); // the 2-star one is not offered
    assert.equal(opts.filter(o => !o.history).length, 3);
  });
  it('never uses pearls to match the hue', () => {
    for (const o of recipeOptions('#b8bcc2', { tints: kit, batchSize: 1 })) assert.ok(!('silver-pearl' in o.drops) && !('gold-pearl' in o.drops));
  });
  it('evaluates a recipe and writes it in kit order', () => {
    const e = evaluateRecipe({ purple: 2, blue: 4 }, '#2b3a8f', { tints: kit, batchSize: 1 });
    assert.match(e.hex, /^#[0-9a-f]{6}$/); assert.ok(e.deltaE >= 0); assert.equal(e.total, 6);
    assert.equal(dropsText({ purple: 2, blue: 4 }, kit), 'Blue 4 · Purple 2');
    assert.equal(dropsText({}, kit), 'Clear base only');
    assert.equal(spotText({ drops: { red: 1 }, pearlId: 'gold-pearl', pearlDrops: 2 }, kit), 'Red 1 + Gold pearl 2 (effect)');
  });
  it('lays calibrations over the kit', () => {
    const k = kitTints({ blue: { hex: '#0a1450', drops: 2, batchSize: 1 } });
    assert.equal(k.length, 12); assert.equal(k.find(t => t.id === 'blue').calib.hex, '#0a1450'); assert.ok(!k.find(t => t.id === 'red').calib);
  });
});

describe('photo sampling', () => {
  const img = (w, h, fill) => { const data = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) data.set(fill(i % w, Math.floor(i / w)), i * 4); return { data, width: w, height: h }; };
  it('averages a flat color exactly', () => {
    const l = sampleArea(img(100, 100, () => [40, 90, 200, 255]), 0.5, 0.5);
    assert.equal(rgbToHex(l.map(linearToSrgb)), '#285ac8');
  });
  it('drops glare: a few white pixels do not lift the color', () => {
    const l = sampleArea(img(100, 100, (x, y) => ((x + y) % 9 === 0 ? [255, 255, 255, 255] : [40, 90, 200, 255])), 0.5, 0.5);
    assert.equal(rgbToHex(l.map(linearToSrgb)), '#285ac8');
  });
  it('white balance maps the card to neutral grey', () => {
    const g = whiteGains([0.9, 0.8, 0.6]), out = applyGains([0.9, 0.8, 0.6], g);
    for (const v of out) close(v, 0.85, 6);
  });
});

describe('multi-color covers', () => {
  it('has the 44 covers and matches names loosely', () => {
    assert.equal(MULTI_COLOR_COUNT, 44);
    assert.deepEqual(multiColorCover('Storm', 'Phaze II').names, ['Red', 'Black']);
    assert.ok(multiColorCover('storm', 'phaze ii'));
    assert.equal(multiColorCover('Storm', 'Nope'), null);
  });
});
