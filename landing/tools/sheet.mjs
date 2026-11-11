// Prints X-ING's drill sheet for the front page's pro shop proof: a sample bowler and fit, Layout A, and the
// shop letterhead filled in with X-ING's own name and mark (no invented shop). Like shots.mjs, cloud.js is
// served with every plan unlocked during the capture only; the app's files are not changed.
//   node tools/sheet.mjs            (run from landing/, needs the local server on :5317; writes assets/app/drill-sheet.png at 2x)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const APP = 'http://localhost:5317/';
const OUT = path.resolve('assets/app');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const PORT = 9335, W = 1440, H = 900, SHEET_W = 760, DPR = 2;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-sheet-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };

// X-ING's mark (the favicon's X on the ink square), drawn as a PNG for the letterhead
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="192" height="192"><rect width="24" height="24" rx="6" fill="#0b0c0e"/><text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#eef0f3">X</text></svg>`;

try {
  let wsUrl; for (let i = 0; i < 50 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await sleep(200); }
  ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', async m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); return; }
    if (d.method === 'Fetch.requestPaused') {
      const { requestId } = d.params;
      const body = Buffer.from((await send('Fetch.getResponseBody', { requestId })).body, 'base64').toString('utf8');
      const open = body
        .replace(/get isPaid\(\) \{[^\n]*\},/, 'get isPaid() { return true; },')
        .replace(/get isShop\(\) \{[^\n]*\},/, 'get isShop() { return true; },')
        .replace('if (!user) lockForGuests(hg, box);', '');
      if (open === body) console.warn('warning: cloud.js was not unlocked');
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from(open).toString('base64') });
    }
  });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*js/cloud.js*', requestStage: 'Response' }] });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  // the letterhead is read from the store when the sheet prints; a guest's store is plain localStorage
  await send('Page.navigate', { url: APP }); await sleep(1500);
  await ev(`
    const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(${JSON.stringify(MARK)}); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 192; c.getContext('2d').drawImage(img, 0, 0, 192, 192);
    localStorage.setItem('xing.shop', JSON.stringify({ name: 'X-ING Pro Shop Lab', email: 'Proshoplab@gmail.com', web: 'x-ing-pro-shop-lab.pages.dev', logo: c.toDataURL('image/png') }));
  `);
  await send('Page.navigate', { url: APP }); await sleep(6000);

  console.log(await ev(`
    window.print = () => {};
    const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
    const set = (e, v) => { if (!e) return; e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
    set($('bName'), 'Sample bowler'); set($('speed'), '16.5'); set($('revs'), '360'); set($('papOver'), '5 1/4'); set($('papUp'), '1/2');
    const o = [...document.querySelectorAll('#ballSearchList option')].map(o => o.value).find(v => v.toLowerCase().includes('zero mercy pearl'));
    set($('ballSearch'), o); await wait(700); $('btnRec').click(); await wait(800);
    document.querySelector('[data-mode=advanced], [data-mode=driller]')?.click(); await wait(1000);
    // a sample fit: whatever fields the fit card has, by name
    const fit = { grip: 'Fingertip', th_size: '63/64', mf_size: '43/64', rf_size: '41/64', mf_sfull: '4 17/64', rf_sfull: '4 25/64', bridge: '1/4' };
    const ids = [...document.querySelectorAll('[id^="fit_"]')].map(e => e.id);
    for (const [k, v] of Object.entries(fit)) set($('fit_' + k), v);
    await wait(500);
    $('btnPrint').click(); await wait(400); $('printChkGo').click(); await wait(800);
    return 'fit fields: ' + ids.join(' ') + ' | sheet chars: ' + $('sheet').innerHTML.length;
  `));
  await send('Emulation.setDeviceMetricsOverride', { width: SHEET_W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send('Emulation.setEmulatedMedia', { media: 'print', features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await ev(`const s=document.createElement('style'); s.textContent='html,body{margin:0;background:#fff} #sheet{padding:36px 40px;background:#fff}'; document.head.append(s); scrollTo(0,0); await new Promise(r=>setTimeout(r,600));`);
  const rect = await ev(`const b=document.getElementById('sheet').getBoundingClientRect(); return {x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height};`);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 }, captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, 'drill-sheet.png'), Buffer.from(r.data, 'base64'));
  console.log(`drill-sheet.png  ${Math.round(rect.w)}x${Math.round(rect.h)} css px`);
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
