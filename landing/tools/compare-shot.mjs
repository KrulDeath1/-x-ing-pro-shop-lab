// Captures the app's Compare A / B ball views for the front page, with the pin-to-PAP of each layout set by hand,
// straight from the running app (localhost:5317). As in shots.mjs, cloud.js is served unlocked only during the
// capture; the app's own files are not changed. Then cut the picture with: node tools/crops.mjs compare-crop
//   node tools/compare-shot.mjs [A pin-to-PAP] [B pin-to-PAP]     e.g.  node tools/compare-shot.mjs "3 1/2" "5"
//   writes assets/app/compare-balls.png (2x); the drilling and VAL angles stay at A 55°/45°, B 65°/55°, pin up
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [P2P_A = '3 1/2', P2P_B = '5'] = process.argv.slice(2);
const APP = 'http://localhost:5317/';
const OUT = path.resolve('assets/app');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const PORT = 9335, W = 1440, H = 900, DPR = 2;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-compare-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map();
async function connect() {
  for (let i = 0; i < 50; i++) { try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = t.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(200); }
  throw new Error('chrome did not start');
}
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };

try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', async m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === 'Fetch.requestPaused') {
      const { requestId } = d.params;
      const body = Buffer.from((await send('Fetch.getResponseBody', { requestId })).body, 'base64').toString('utf8');
      const open = body
        .replace(/get isPaid\(\) \{[^\n]*\},/, 'get isPaid() { return true; },')
        .replace(/get isShop\(\) \{[^\n]*\},/, 'get isShop() { return true; },')
        .replace('if (!user) lockForGuests(hg, box);', '')
        .replace("box.innerHTML = `<button class=\"btn\" type=\"button\" data-a=\"signin\">Sign in</button>`;", "box.innerHTML = '';");
      if (open === body) console.warn('warning: cloud.js was not unlocked');
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from(open).toString('base64') });
    }
  });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*js/cloud.js*', requestStage: 'Response' }] });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.navigate', { url: APP });
  await sleep(6000);

  console.log(await ev(`
    const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
    const set = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
    set('bName', 'Sample bowler'); set('speed', '16.5'); set('revs', '360'); set('papOver', '5 1/4'); set('papUp', '1/2');
    [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save')?.click(); await wait(400);
    $('btnRec').click(); await wait(800);
    const c = $('compare'); if (!c.checked) c.click(); await wait(1500);
    const lay = (X, da, p2p, val) => { document.querySelector('input[name=' + X + '_sys][value=dual]').click(); set(X + '_da', da); set(X + '_p2p', p2p); set(X + '_val', val); set(X + '_pin', 'up'); };
    lay('A', 55, ${JSON.stringify(P2P_A)}, 45); await wait(600);
    lay('B', 65, ${JSON.stringify(P2P_B)}, 55); await wait(2000);
    return 'A ' + $('A_da').value + ' x ' + $('A_p2p').value + ' x ' + $('A_val').value + ' | B ' + $('B_da').value + ' x ' + $('B_p2p').value + ' x ' + $('B_val').value;
  `));

  const rect = await ev(`document.querySelector('header').style.visibility='hidden'; const e=document.getElementById('ballsHost'); e.scrollIntoView({block:'start'}); await new Promise(r=>setTimeout(r,800)); const b=e.getBoundingClientRect(); return {x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height};`);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 }, captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, 'compare-balls.png'), Buffer.from(r.data, 'base64'));
  console.log(`compare-balls.png  ${Math.round(rect.w)}x${Math.round(rect.h)} css px`);
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
