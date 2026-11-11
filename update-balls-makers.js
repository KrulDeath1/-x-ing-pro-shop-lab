// Builds the ball list from the manufacturers' own product pages and keeps it in a lasting library
// (data/ball-library.json). Every ball stays in the library for KEEP_YEARS from its release, even after the maker takes
// the page down. Then writes the app's BALL_DB: brands this script covers come from the library; brands it doesn't cover
// (yet) keep their entries from the previous list, so the app switches over brand by brand.
//
//   node update-balls-makers.js            read the makers' sites, update the library, write the app
//   node update-balls-makers.js --no-fetch  only rebuild the app's list from the library
//
// Polite reading: an honest user agent, each site's robots.txt rules, at least DELAY_MS between requests to one site
// (Storm asks for 10 s), network errors retried, but a site that answers 403 or 429 ("slow down" / "no") is left alone
// for the rest of the run. Pages already in the library for a retired ball are not fetched again.
const fs = require('fs'), path = require('path');
const ROOT = __dirname, APP = path.join(ROOT, 'x-ing-pro-shop-lab.html'), LIB = path.join(ROOT, 'data', 'ball-library.json');
const UA = 'X-ING-ball-specs-reader/0.1 (spec sheets for a bowling layout app)';
const KEEP_YEARS = 7, DELAY_MS = 3000;
const NO_FETCH = process.argv.includes('--no-fetch');
// testing: --limit=N reads at most N ball pages per site; --dry writes nothing (prints what it found)
const LIMIT = +(process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || Infinity, DRY = process.argv.includes('--dry');

/* ---------------- polite fetching ---------------- */
const hostState = {}; // host -> { last, delay, blocked, robots }
const sleep = ms => new Promise(r => setTimeout(r, ms));
function robotsAllows(rules, p) {
  let best = null;
  for (const r of rules) {
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (r.path && re.test(p) && (!best || r.path.length > best.path.length)) best = r;
  }
  return !best || best.allow;
}
async function rawGet(url) {
  for (let t = 0; t < 5; t++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      return { status: res.status, text: res.status === 200 ? await res.text() : '', url: res.url };
    } catch (e) { await sleep(4000 * (t + 1)); } // flaky DNS: wait and retry
  }
  return { status: 0, text: '', url };
}
async function hostOf(url) {
  const u = new URL(url), h = u.host;
  if (!hostState[h]) {
    hostState[h] = { last: 0, delay: DELAY_MS, blocked: false, rules: [] };
    const r = await rawGet(`${u.protocol}//${h}/robots.txt`);
    if (r.status === 200) {
      let applies = false, groupStarted = false;
      for (const line of r.text.split(/\r?\n/)) {
        const m = line.replace(/#.*/, '').trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
        const k = m[1].toLowerCase(), v = m[2].trim();
        if (k === 'user-agent') { if (groupStarted) { applies = false; groupStarted = false; } if (v === '*') applies = true; }
        else { groupStarted = true; if (!applies) continue;
          if (k === 'disallow' && v) hostState[h].rules.push({ path: v, allow: false });
          if (k === 'allow' && v) hostState[h].rules.push({ path: v, allow: true });
          if (k === 'crawl-delay' && +v) hostState[h].delay = Math.max(hostState[h].delay, +v * 1000 + 500); }
      }
    }
    hostState[h].last = Date.now();
  }
  return hostState[h];
}
async function get(url) {
  const st = await hostOf(url), u = new URL(url);
  if (st.blocked) return null;
  if (!robotsAllows(st.rules, u.pathname + u.search)) { console.log(`    robots.txt says no: ${url}`); return null; }
  const wait = st.last + st.delay - Date.now(); if (wait > 0) await sleep(wait);
  const r = await rawGet(url); st.last = Date.now();
  if (r.status === 403 || r.status === 429) { st.blocked = true; console.log(`    ${u.host} answered ${r.status}: leaving this site alone for the rest of the run`); return null; }
  return r.status === 200 ? r.text : null;
}

/* ---------------- page text helpers ---------------- */
const decode = s => s.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;|&#8217;|&rsquo;/g, "'").replace(/&quot;|&#8220;|&#8221;/g, '"').replace(/&nbsp;|&#160;/g, ' ').replace(/&reg;|&#174;|&trade;|&#8482;|™|®/g, '').replace(/&[a-z#0-9]+;/g, ' ');
const tokens = html => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<[^>]+>/g, '\n'))
  .split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
const h1 = html => { const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m ? decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : ''; };
const after = (tk, label, from = 0) => { const i = tk.indexOf(label, from); return i >= 0 ? tk[i + 1] : ''; };
const num = s => { const v = parseFloat(String(s || '').replace(/[^0-9.]/g, '')); return isFinite(v) ? v : NaN; };
function coverKey(t) {
  t = (t || '').toLowerCase();
  if (t.includes('urethane') || t.includes('microcell')) return 'urethane';
  if (t.includes('polyester') || t.includes('plastic') || t.includes('rubber')) return 'plastic';
  if (t.includes('pearl')) return 'pearl';
  if (t.includes('hybrid')) return 'hybrid';
  return 'solid';
}
function gritKey(f) {
  const s = (f || '').toLowerCase(), nums = (s.match(/\d{3,5}/g) || []).map(Number), top = nums.length ? Math.max(...nums) : 2000;
  if (/lsp|polish|compound|shine|gloss|reacta|crown/.test(s)) return top <= 2000 ? '1500p' : 'polish';
  const opts = [360, 500, 1000, 1500, 2000, 3000, 4000];
  return String(opts.reduce((a, b) => Math.abs(b - top) < Math.abs(a - top) ? b : a));
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthYear = d => d ? `${MON[d.getMonth()]} ${d.getFullYear()}` : '';
function parseDate(s) {
  if (!s) return null; s = s.trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[1] - 1, +m[2]);
  m = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2},\s*)?(\d{4})/); if (m) { const k = MON.findIndex(x => x.toLowerCase() === m[1].toLowerCase()); if (k >= 0) return new Date(+m[3], k, 1); }
  return null;
}
// USBC: a PSA marker is required from 0.010" intermediate differential; drillers treat that as asymmetric
const symOf = (mb, hint = '') => /asym/i.test(hint) ? 'asym' : /\bsym/i.test(hint) ? (mb >= 0.010 ? 'asym' : 'sym') : (mb >= 0.010 ? 'asym' : 'sym');
function record({ brand, name, url, released, cover, coverType, finish, core, w, sym, retired }) {
  const ws = Object.keys(w).map(Number), main = w[15] || w[ws.sort((a, b) => Math.abs(a - 15) - Math.abs(b - 15))[0]];
  return { b: brand, n: name, d: monthYear(released), cv: cover || '', ct: coverType || '', c: coverKey(coverType || cover), f: finish || '', g: gritKey(finish),
    k: core || '', s: sym, rg: main[0], df: main[1], mb: sym === 'asym' ? main[2] : 0, i: 0, w, ...(retired ? { x: 1 } : {}),
    src: url, rel: released ? released.toISOString().slice(0, 10) : null };
}

/* ---------------- readers, one per site family ---------------- */
// Brunswick, Radical and DV8 share one platform: per-weight "Core Numbers" (RG / DIFF / ASY) and a "Spec Table"
async function brunswickFamily(host, brand, lib) {
  const idx = await get(`https://${host}/sitemaps-1-sitemap.xml`); if (!idx) return null;
  const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => /section-(bowlerProducts|products|balls)/i.test(u));
  const urls = new Set();
  for (const sm of maps) { const x = await get(sm); if (x) for (const m of x.matchAll(/<loc>([^<]+\/products\/balls\/(current|retired)\/[^<]+)<\/loc>/g)) urls.add(m[1]); }
  return readPages([...urls], lib, u => /\/retired\//.test(u), (html, url) => {
    const tk = tokens(html), name = h1(html); if (!name) return null;
    const ci = tk.indexOf('Core Numbers'); if (ci < 0) return null;
    const wts = []; let i = ci + 1; while (/^\d{2} lb$/.test(tk[i])) { wts.push(parseInt(tk[i], 10)); i++; }
    const row = lab => { const j = tk.indexOf(lab, i - 1); return j < 0 ? [] : wts.map((_, k) => num(tk[j + 1 + k])); };
    const rg = row('RG'), df = row('DIFF'), asy = tk.indexOf('ASY', i) >= 0 ? row('ASY') : wts.map(() => 0);
    const w = {}; wts.forEach((wt, k) => { if (isFinite(rg[k]) && isFinite(df[k])) w[wt] = [rg[k], df[k], isFinite(asy[k]) ? asy[k] : 0]; });
    if (!Object.keys(w).length) return null;
    const si = tk.indexOf('Spec Table'), spec = l => after(tk, l, si);
    const mb15 = (w[15] || Object.values(w)[0])[2];
    return record({ brand, name, url, released: parseDate(spec('Release Date')), cover: spec('Coverstock'), coverType: spec('Cover Type'),
      finish: spec('Finish'), core: spec('Core'), w, sym: symOf(mb15, spec('Core')), retired: /\/retired\//.test(url) });
  });
}
// Motiv: per-weight "Radius of Gyration / Max Differential / Int. Differential"; retired balls under /retired-balls/
async function motiv(lib) {
  const sm = await get('https://www.motivbowling.com/sitemap.xml'); if (!sm) return null;
  const urls = [...sm.matchAll(/<loc>(https:\/\/www\.motivbowling\.com\/products\/balls\/[^<]+\.html)<\/loc>/g)].map(m => m[1]).filter(u => !/demo/i.test(u));
  return readPages([...new Set(urls)], lib, u => /retired/.test(u), (html, url) => {
    const tk = tokens(html), name = h1(html); if (!name) return null;
    const w = {};
    tk.forEach((t, i) => { if (t === 'Radius of Gyration' && /^\d{2}$/.test(tk[i - 1])) {
      const rg = num(tk[i + 1]), df = num(after(tk, 'Max Differential', i)), mb = num(after(tk, 'Int. Differential', i));
      if (isFinite(rg) && isFinite(df)) w[+tk[i - 1]] = [rg, df, isFinite(mb) ? mb : 0]; } });
    if (!Object.keys(w).length) return null;
    const core = after(tk, 'Weight Block'), coreHint = tk.find(t => t.startsWith(core) && /symmetric/i.test(t)) || '';
    const mb15 = (w[15] || Object.values(w)[0])[2];
    return record({ brand: 'Motiv', name, url, released: null, cover: after(tk, 'Cover Stock'), coverType: after(tk, 'Cover Stock'),
      finish: after(tk, 'Finish'), core, w, sym: symOf(mb15, coreHint), retired: /retired/.test(url) });
  });
}
// Storm (also Roto Grip and 900 Global): one set of specs per ball ("Radius of Gyration", "Differential", "PSA").
// Storm's listing pages show the newest 24 balls (its paging runs through /ajax, which its robots.txt rules out), so
// older balls are found by their page address, built from names already in the library or the previous list.
const STORM_BRANDS = { Storm: 'storm', 'Roto Grip': 'roto-grip', '900 Global': '900-global' };
async function storm(lib, prevList) {
  const urls = new Set();
  for (const p of ['/products/equipment/bowling-balls/', '/roto-grip-brand/', '/900-global-brand/']) {
    const x = await get('https://www.stormbowling.com' + p); if (!x) continue;
    for (const m of x.matchAll(/href="(?:https:\/\/www\.stormbowling\.com)?(\/(?:storm|roto-grip|900-global)-[a-z0-9-]+-bowling-ball)"/g)) urls.add('https://www.stormbowling.com' + m[1]);
  }
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - KEEP_YEARS);
  for (const x of prevList) if (STORM_BRANDS[x.b] && (!x.d || (parseDate(x.d) || new Date()) >= cutoff))
    urls.add(`https://www.stormbowling.com/${STORM_BRANDS[x.b]}-${x.n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-bowling-ball`);
  for (const r of Object.values(lib.balls)) if (STORM_BRANDS[r.b]) urls.add(r.src);
  return readPages([...urls], lib, u => lib.balls[u]?.x, (html, url) => {
    const tk = tokens(html).map(t => t.replace(/^S_/, '').replace(/_/g, ' ')), name = h1(html);
    const lab = l => after(tk, l + ':');
    const brand = lab('Brand'), rg = num(lab('Radius of Gyration')), df = num(lab('Differential')), psa = num(lab('PSA'));
    if (!name || !isFinite(rg) || !isFinite(df) || !STORM_BRANDS[brand]) return null;
    const sym = /asym/i.test(lab('Symmetry')) ? 'asym' : 'sym';
    return record({ brand, name, url, released: parseDate(lab('Release Date')), cover: lab('Coverstock'), coverType: lab('Coverstock'),
      finish: lab('Finish'), core: lab('Weight Block'), w: { 15: [rg, df, isFinite(psa) ? psa : 0] }, sym, retired: /^no$/i.test(lab('Avail. for Sales Orders')) });
  });
}
// SWAG: 15 lb RG / differential / mass bias strength in its product details
async function swag(lib) {
  const sm = await get('https://www.swagbowling.com/product-sitemap.xml'); if (!sm) return null;
  const urls = [...sm.matchAll(/<loc>(https:\/\/www\.swagbowling\.com\/product\/[^<]*bowling-ball[^<]*)<\/loc>/g)].map(m => m[1]);
  return readPages([...new Set(urls)], lib, () => false, (html, url) => {
    const tk = tokens(html);
    const rg = num(after(tk, 'Radius of Gyration: RG (15LB)')), df = num(after(tk, 'Differential: Diff (15LB)'));
    if (!isFinite(rg) || !isFinite(df)) return null;
    const mb = num(after(tk, 'Mass Bias Strength')), shape = after(tk, 'Bowling Ball Core Shape');
    const title = h1(html), retired = /discontinued|retired/i.test(title);
    const name = title.replace(/^swag\s+/i, '').replace(/\b(discontinued|retired)\b/ig, '').replace(/\s*bowling ball\s*/i, ' ').replace(/\s+/g, ' ').trim(); if (!name) return null;
    return record({ brand: 'SWAG', name, url, released: null, cover: after(tk, 'Bowling Ball Cover Name'), coverType: after(tk, 'Bowling Ball Coverstock Type'),
      finish: after(tk, 'Surface Finish'), core: after(tk, 'Bowling Ball Core Name'), w: { 15: [rg, df, isFinite(mb) ? mb : 0] }, sym: /asym/i.test(shape) ? 'asym' : 'sym', retired });
  });
}
// read each page (skipping retired balls already in the library), parse it, and record what was found
async function readPages(urls, lib, isRetiredUrl, parse) {
  const found = []; let n = 0, skipped = 0;
  for (const url of urls) {
    if (lib.balls[url] && isRetiredUrl(url) && lib.balls[url].x) { found.push(lib.balls[url]); skipped++; continue; }
    if (lib.skip[url]) { skipped++; continue; } // a page known not to be a ball, or older than the library keeps
    if (n >= LIMIT) break;
    const html = await get(url); n++;
    if (html == null) { if (hostState[new URL(url).host]?.blocked) return { found, blocked: true }; continue; }
    let r = null; try { r = parse(html, url); } catch (e) { console.log(`    could not read ${url}: ${e.message}`); }
    if (!r) { lib.skip[url] = 'no specs'; continue; }
    found.push(r);
    if (n % 20 === 0) console.log(`    ${n} pages read, ${found.length} balls`);
  }
  console.log(`    ${n} pages read (${skipped} already in the library), ${found.length} balls`);
  return { found, blocked: false };
}

/* ---------------- library + app ---------------- */
(async () => {
  if (!fs.existsSync(APP)) throw new Error(`Can't find the app file: ${APP}`);
  let src = fs.readFileSync(APP, 'utf8');
  const re = /\/\*BALL_DB_START\*\/[\s\S]*?\/\*BALL_DB_END\*\//;
  if (!re.test(src)) throw new Error('BALL_DB markers missing in the app');
  const prev = JSON.parse(src.match(/const BALL_DB = (\[[\s\S]*?\]);\n\/\*BALL_DB_END/)[1]);
  const lib = fs.existsSync(LIB) ? JSON.parse(fs.readFileSync(LIB, 'utf8')) : { note: 'Balls read from the makers\' own product pages by update-balls-makers.js; kept 7 years from release.', covered: {}, balls: {}, skip: {} };
  lib.skip = lib.skip || {}; lib.covered = lib.covered || {};
  const today = new Date().toISOString().slice(0, 10);
  const prevKey = x => `${x.b}|${x.n}`.toLowerCase().replace(/[^a-z0-9|]+/g, '');
  const prevBy = new Map(prev.map(x => [prevKey(x), x]));

  if (!NO_FETCH) {
    const families = [
      ['Brunswick', ['Brunswick'], () => brunswickFamily('brunswickbowling.com', 'Brunswick', lib)],
      ['Radical', ['Radical'], () => brunswickFamily('radicalbowling.com', 'Radical', lib)],
      ['DV8', ['DV8'], () => brunswickFamily('dv8bowling.com', 'DV8', lib)],
      ['Motiv', ['Motiv'], () => motiv(lib)],
      ['SWAG', ['SWAG'], () => swag(lib)],
      ['Storm, Roto Grip, 900 Global', Object.keys(STORM_BRANDS), () => storm(lib, prev)],
    ];
    for (const [label, brands, run] of families) {
      console.log(`${label}:`);
      const res = await run();
      if (!res) { console.log('    site not reachable; brand keeps its previous entries'); continue; }
      for (const r of res.found) {
        const old = lib.balls[r.src], p = prevBy.get(prevKey(r));
        // no release date on the page: keep the one we had, else the previous list's date, else when we first saw it
        if (!r.rel) { r.rel = old?.rel || (p?.d && parseDate(p.d) ? parseDate(p.d).toISOString().slice(0, 10) : null); r.d = r.d || old?.d || p?.d || ''; }
        if (!r.x && p?.x && !r.src.includes('/current/')) r.x = 1;
        // retired with no release date anywhere: almost always older than the window, so don't start a 7-year clock today
        if (r.x && !r.rel) { lib.skip[r.src] = 'retired, no release date'; continue; }
        lib.balls[r.src] = { ...r, firstSeen: old?.firstSeen || today, lastSeen: today };
      }
      // a brand switches to the makers' data once a full read worked and found balls
      if (!res.blocked && res.found.length) for (const b of brands) if (res.found.some(r => r.b === b)) lib.covered[b] = today;
      if (res.blocked) console.log('    stopped early (the site asked to slow down or said no); balls read so far are kept');
    }
  }
  // drop balls released more than KEEP_YEARS ago (no date: counted from when they were first seen)
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - KEEP_YEARS);
  for (const [u, r] of Object.entries(lib.balls)) if (new Date(r.rel || r.firstSeen) < cutoff) { delete lib.balls[u]; lib.skip[u] = 'older than ' + KEEP_YEARS + ' years'; }
  if (DRY) {
    const sample = Object.values(lib.balls).filter(r => r.lastSeen === today);
    console.log(`\nDry run: ${sample.length} balls read. Samples:`);
    for (const b of [...new Set(sample.map(r => r.b))]) { const r = sample.find(x => x.b === b); console.log(JSON.stringify(r)); }
    return;
  }
  fs.mkdirSync(path.dirname(LIB), { recursive: true });
  lib.updated = today; fs.writeFileSync(LIB, JSON.stringify(lib, null, 1));

  // the app's list: covered brands from the library (one entry per name: the newest page wins), the rest from before
  const fromLib = new Map();
  for (const r of Object.values(lib.balls)) if (lib.covered[r.b]) { const k = prevKey(r), o = fromLib.get(k); if (!o || (r.lastSeen > o.lastSeen)) fromLib.set(k, r); }
  const out = [...[...fromLib.values()].map(({ src, rel, firstSeen, lastSeen, ...rec }) => rec), ...prev.filter(x => !lib.covered[x.b])];
  out.sort((a, b) => a.b.localeCompare(b.b) || a.n.localeCompare(b.n));
  if (out.length < prev.length * 0.6) { console.error(`\nStopped: the new list has ${out.length} balls (the app has ${prev.length}). Nothing was written to the app; the library was saved.`); process.exit(2); }
  const block = `/*BALL_DB_START*/const BALL_DB_DATE = '${today}';\nconst BALL_DB = ${JSON.stringify(out)};\n/*BALL_DB_END*/`;
  fs.copyFileSync(APP, APP.replace(/\.html$/, '') + '.before-update.html');
  src = src.replace(re, () => block); fs.writeFileSync(APP, src);
  const byBrand = {}; out.forEach(x => { byBrand[x.b] = byBrand[x.b] || { m: 0, o: 0 }; lib.covered[x.b] ? byBrand[x.b].m++ : byBrand[x.b].o++; });
  console.log(`\nApp list: ${out.length} balls (was ${prev.length}).`);
  console.log(Object.entries(byBrand).map(([b, v]) => `  ${b}: ${v.m ? v.m + ' from the maker' : v.o + ' from the previous list'}`).join('\n'));
  console.log(`Library: ${Object.keys(lib.balls).length} balls in data/ball-library.json`);
})().catch(e => { console.error(e); process.exit(1); });
