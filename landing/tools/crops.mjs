// Cuts the front page's result views out of the captured app screens (assets/app/*.png, from tools/shots.mjs).
// Each crop stacks one or more rectangles of a source image, so a view can keep the rows that show the result
// (the layout, its reasons, the bowler read) and leave out input forms and lines the front page must not show
// (on-screen text names no sources). Renders with headless Chrome; no image library needed.
//   node tools/crops.mjs            (run from landing/; writes assets/app/ex-*.png and *-crop.png at the source's 2x)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const APP = path.resolve('assets/app');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!CHROME) throw new Error('Chrome or Edge not found');

// [x, y, width, height] in source pixels; pad adds the card's white margin around the stack
const crops = {
  // the hero window: the ball view cut to the ball and its labels (the empty dark sides are left out), 3:2
  'ball-hero': { src: 'ball-view.png', pad: 0, rects: [[380, 0, 1080, 720]] },
  // the printed drill sheet (tools/sheet.mjs): its head (letterhead, title, date and ball) for a small card
  'sheet-head': { src: 'drill-sheet.png', pad: 0, rects: [[60, 50, 790, 300]] },
  // the pro shop view of the sheet: the letterhead, then the fit card down to the grip and ball box
  'sheet-fit': { src: 'drill-sheet.png', pad: 0, rects: [[60, 50, 1400, 190], [60, 780, 1400, 1608]] },
  // Compare A and B: the top of each ball, where the two layouts differ (DA 55° vs 65°, 5" vs 5 1/2", VAL 45° vs 55°)
  'compare-crop': { src: 'compare-balls.png', pad: 0, rects: [[240, 20, 580, 215], [1230, 20, 580, 215]] },
  // the shot log, narrow: the pin deck to tap, then the log's last shots and strike rate
  'log-crop': { src: 'log-a-shot.png', pad: 0, rects: [[0, 112, 410, 420], [0, 742, 410, 146]] },
  // the coverage chart around the three balls (40 to 44 ft), so the points and their names stay whole
  'coverage-crop': { src: 'coverage.png', pad: 0, rects: [[560, 140, 640, 500]] },
  // the worked example, step 1: the bowler's numbers (name to rev rate), no hints or calculators
  'ex-inputs': { src: 'app-first-screen.png', pad: 0, rects: [[36, 166, 756, 834]] },
  // the worked example, step 2: the layout and its reasons (the Pinel line, bullet 4, is left out)
  'ex-layout': { src: 'layout.png', pad: 0, rects: [[4, 688, 680, 78], [4, 1158, 680, 128], [4, 1334, 680, 90]] },
  // the bowler read: the chips, the one-line read and the target motion (the "Book check" line is left out)
  'read-crop': { src: 'read.png', pad: 0, rects: [[4, 4, 1636, 188], [4, 270, 1636, 50]] },
  // both layout systems with where the pin and PSA land
  'specs-crop': { src: 'driller-layout.png', pad: 0, rects: [[4, 688, 740, 268]] },
  // Advanced: both systems, the RG at the PAP and the drilled RG and differential (the "book:" note is left out)
  'driller-crop': { src: 'driller-layout.png', pad: 0, rects: [[4, 688, 1296, 357], [4, 1045, 536, 100]] },
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-crops-'));
try {
  for (const [name, c] of Object.entries(crops)) {
    const W = Math.max(...c.rects.map(r => r[2])) + 2 * c.pad;
    const H = c.rects.reduce((s, r) => s + r[3], 0) + 2 * c.pad;
    const src = pathToFileURL(path.join(APP, c.src)).href;
    const rows = c.rects.map(([x, y, w, h]) => `<div style="width:${w}px;height:${h}px;background:url('${src}') -${x}px -${y}px no-repeat"></div>`).join('');
    const html = `<!doctype html><html><head><style>html,body{margin:0;background:#fff}body{padding:${c.pad}px;width:${W - 2 * c.pad}px}</style></head><body>${rows}</body></html>`;
    const file = path.join(tmp, name + '.html');
    fs.writeFileSync(file, html);
    const out = path.join(APP, name + '.png');
    execFileSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files', `--window-size=${W},${H}`, `--screenshot=${out}`, pathToFileURL(file).href], { stdio: 'ignore' });
    console.log(`${name}.png  ${W}x${H}`);
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
