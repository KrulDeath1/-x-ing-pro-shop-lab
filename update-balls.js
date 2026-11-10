// Pulls current balls plus balls discontinued in the last 5 years (every weight) from bowwwl.com's database and injects
// them into the app HTML. Discontinued balls carry x: 1.
// usage: node update-balls.js [path-to-app.html]   (default: x-ing-pro-shop-lab.html next to this script)
// Safe to re-run: it backs up the app first, refuses to write if the download looks broken, and lists what changed.
const fs = require('fs'), path = require('path');
const app = process.argv[2] || path.join(__dirname, 'x-ing-pro-shop-lab.html');
const BRAND = {
  '900-global': '900 Global', 'abs-300': 'ABS 300', brunswick: 'Brunswick', dv8: 'DV8', ebonite: 'Ebonite', elite: 'Elite',
  hammer: 'Hammer', 'hih-bowling': 'HIH Bowling', 'kr-strikeforce': 'KR Strikeforce', motiv: 'Motiv', 'on-the-ball-bowling': 'On The Ball',
  'pro-am': 'Pro-Am', probowl: 'Probowl', pyramid: 'Pyramid', radical: 'Radical', 'roto-grip': 'Roto Grip', storm: 'Storm', swag: 'SWAG',
  track: 'Track', 'columbia-300': 'Columbia 300', seismic: 'Seismic', 'lord-field': 'Lord Field', amf: 'AMF', 'big-bowling': 'Big Bowling',
};
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const cell = (tr, cls) => { const m = tr.match(new RegExp(`<td[^>]*class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)</td>`)); return m ? m[1] : ''; };
const span = (h, cls) => { const m = h.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</span>`)); return m ? strip(m[1]) : ''; };
function coverKey(t) {
  t = (t || '').toLowerCase();
  if (t.includes('urethane') || t.includes('microcell')) return 'urethane';
  if (t.includes('polyester') || t.includes('rubber')) return 'plastic';
  if (t.includes('pearl')) return 'pearl';
  if (t.includes('hybrid')) return 'hybrid';
  return 'solid';
}
function gritKey(f) {
  const s = (f || '').toLowerCase();
  const nums = (s.match(/\d{3,4}/g) || []).map(Number);
  const top = nums.length ? Math.max(...nums) : 2000;
  if (/lsp|polish|compound|shine|gloss|power edge|reacta|factory finish compound/.test(s)) return top <= 2000 ? '1500p' : 'polish';
  const opts = [360, 500, 1000, 1500, 2000, 3000, 4000];
  return String(opts.reduce((a, b) => Math.abs(b - top) < Math.abs(a - top) ? b : a));
}
async function get(url) { // the DNS here is flaky; retry a few times
  for (let t = 0; t < 6; t++) { try { return await (await fetch(url)).text(); } catch (e) { await new Promise(r => setTimeout(r, 1500)); } }
  throw new Error('fetch failed: ' + url);
}
// discontinued balls are kept if released within the last DISC_YEARS years (bowwwl lists them newest first)
const DISC_YEARS = 5;
const CUTOFF = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - DISC_YEARS); d.setDate(1); return d; })();
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const relDate = s => { const m = (s || '').match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/); return m && MON[m[1].toLowerCase()] != null ? new Date(+m[2], MON[m[1].toLowerCase()], 1) : null; };
async function pages(weight, onRow, disc = 0) {
  for (let p = 0; p < 40; p++) {
    const html = await get(`https://www.bowwwl.com/bowling-ball-database?discontinued=${disc}&overseas=All&weight=${weight}&page=${p}`);
    const body = (html.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1];
    if (!body) break;
    const rows = body.split(/<tr[\s>]/).slice(1);
    if (!rows.length) break;
    if (!disc) { rows.forEach(r => onRow(r, 0)); continue; }
    // discontinued: keep the recent ones; stop once a whole page is older than the cutoff
    let recent = 0;
    for (const r of rows) { const d = relDate(strip(cell(r, 'field-release-date'))); if (d && d >= CUTOFF) { recent++; onRow(r, 1); } }
    if (!recent) break;
  }
}
(async () => {
  const out = [], bySlug = {};
  // specs change with ball weight (lighter balls usually have higher RG and lower differentials), so keep every weight
  const WEIGHTS = [16, 14, 13, 12, 11, 10];
  if (!fs.existsSync(app)) throw new Error(`Can't find the app file: ${app}`);
  console.log('Downloading the current ball list from bowwwl.com (takes a minute or two)...');
  const addRow = (tr, disc) => {
      const nameCell = cell(tr, 'views-field-nothing-2');
      const href = (nameCell.match(/href="(\/bowling-ball-database\/[^"]+)"/) || [])[1] || '';
      if (bySlug[href]) return;
      const name = strip((nameCell.match(/hreflang="en">([\s\S]*?)<\/a>/) || [])[1] || '');
      const brandSlug = href.split('/')[2] || '';
      const cov = cell(tr, 'views-field-nothing-1'), core = cell(tr, 'views-field-nothing views');
      const coreHtml = core || (tr.match(/class="core-name"[\s\S]*?<\/td>/) || [''])[0];
      const rg = parseFloat(strip(cell(tr, 'field-rg'))), diff = parseFloat(strip(cell(tr, 'field-differential'))), mb = parseFloat(strip(cell(tr, 'field-mass-bias-differential')));
      const coreType = /Asymmetric/.test(coreHtml) ? 'asym' : 'sym';
      if (!name || !isFinite(rg)) return;
      const rec = {
        b: BRAND[brandSlug] || brandSlug, n: name, d: strip(cell(tr, 'field-release-date')),
        cv: span(cov, 'coverstock-name'), ct: span(cov, 'coverstock-type'), c: coverKey(span(cov, 'coverstock-type')),
        f: strip(cell(tr, 'field-factory-finish')), g: gritKey(strip(cell(tr, 'field-factory-finish'))),
        k: span(coreHtml, 'core-name'), s: coreType, rg, df: isFinite(diff) ? diff : 0, mb: coreType === 'asym' && isFinite(mb) ? mb : 0,
        i: /globe|International/.test(cell(tr, 'field-international')) ? 1 : 0,
        w: { 15: [rg, isFinite(diff) ? diff : 0, coreType === 'asym' && isFinite(mb) ? mb : 0] },
      };
      if (disc) rec.x = 1; // discontinued
      out.push(rec); bySlug[href] = rec;
  };
  await pages(15, addRow, 0);
  const nCurrent = out.length;
  console.log(`  ${nCurrent} current balls; adding discontinued balls released since ${CUTOFF.toISOString().slice(0, 7)}...`);
  await pages(15, addRow, 1);
  console.log(`  ${out.length - nCurrent} discontinued balls added`);
  const addWeight = wt => tr => {
      const nameCell = cell(tr, 'views-field-nothing-2');
      const href = (nameCell.match(/href="(\/bowling-ball-database\/[^"]+)"/) || [])[1] || '';
      const rec = bySlug[href]; if (!rec) return;
      const rg = parseFloat(strip(cell(tr, 'field-rg'))), diff = parseFloat(strip(cell(tr, 'field-differential'))), mb = parseFloat(strip(cell(tr, 'field-mass-bias-differential')));
      if (isFinite(rg)) rec.w[wt] = [rg, isFinite(diff) ? diff : 0, rec.s === 'asym' && isFinite(mb) ? mb : 0];
  };
  for (const wt of WEIGHTS) {
    await pages(wt, addWeight(wt), 0);
    await pages(wt, addWeight(wt), 1);
    console.log(`  ${wt} lb specs done`);
  }
  out.sort((a, b) => a.b.localeCompare(b.b) || a.n.localeCompare(b.n));
  const stamp = new Date().toISOString().slice(0, 10);
  const block = `/*BALL_DB_START*/const BALL_DB_DATE = '${stamp}';\nconst BALL_DB = ${JSON.stringify(out)};\n/*BALL_DB_END*/`;
  let src = fs.readFileSync(app, 'utf8');
  const re = /\/\*BALL_DB_START\*\/[\s\S]*?\/\*BALL_DB_END\*\//;
  if (!re.test(src)) throw new Error('marker missing in app');
  // what the app has now, to compare against
  let prev = [];
  try { prev = JSON.parse(src.match(/const BALL_DB = (\[[\s\S]*?\]);\n\/\*BALL_DB_END/)[1]); } catch (e) { /* first run */ }
  // a site change or outage can return a partial list; never shrink the app's list by more than 30% in one go
  if (prev.length && out.length < prev.length * 0.7) {
    console.error(`\nStopped: only ${out.length} balls came back (the app has ${prev.length}). The website may be down or changed. Nothing was written.`);
    process.exit(2);
  }
  const key = x => `${x.b}|${x.n}|${x.i}`, had = new Set(prev.map(key)), now = new Set(out.map(key));
  const added = out.filter(x => !had.has(key(x))), gone = prev.filter(x => !now.has(key(x)));
  fs.copyFileSync(app, app.replace(/\.html$/, '') + '.before-update.html');   // one backup, overwritten each run
  src = src.replace(re, () => block);
  fs.writeFileSync(app, src);
  console.log(`\nBall list updated: ${out.length} balls - ${nCurrent} current + ${out.length - nCurrent} discontinued in the last ${DISC_YEARS} years (was ${prev.length || 'none'}).`);
  console.log(added.length ? `New (${added.length}):\n  ` + added.map(x => `${x.b} ${x.n}${x.i ? ' (intl)' : ''}${x.d ? ' - ' + x.d : ''}`).join('\n  ') : 'No new balls since the last update.');
  if (gone.length) console.log(`No longer listed as current (${gone.length}): ` + gone.map(x => `${x.b} ${x.n}`).join(', ') + '\n  (saved arsenal records keep their specs)');
  console.log(`Backup of the previous app: ${path.basename(app.replace(/\.html$/, '') + '.before-update.html')}`);
})().catch(e => { console.error(e); process.exit(1); });
