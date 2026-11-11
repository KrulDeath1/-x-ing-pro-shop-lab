// Captures X-ING app screens for the front page, straight from the running app (localhost:5317).
// Only during the capture, cloud.js is served with every plan feature unlocked and no sign-in lock,
// so the screens show Pro and Shop features. The app's own files are not changed.
//   node tools/shots.mjs            (writes assets/app/*.png at 2x)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const APP = 'http://localhost:5317/';
const OUT = path.resolve('assets/app');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const PORT = 9333, W = 1440, H = 900, DPR = 2;
fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map(), handlers = [];
async function connect() {
  for (let i = 0; i < 50; i++) { try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = t.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(200); }
  throw new Error('chrome did not start');
}
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };

async function shot(name, selector, pad = 0, maxH = 0) {
  const rect = await ev(`document.querySelector('header').style.visibility='hidden'; const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'start'}); await new Promise(r=>setTimeout(r,500)); const b=e.getBoundingClientRect(); return {x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height};`);
  const clip = { x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad), width: rect.w + 2 * pad, height: (maxH ? Math.min(rect.h, maxH) : rect.h) + 2 * pad, scale: 1 };
  const r = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log(`${name}.png  ${Math.round(clip.width)}x${Math.round(clip.height)} css px`);
}

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

  // a bowler with a small arsenal, a couple of logged shots, on a real house pattern
  console.log(await ev(`
    window.print = () => {};
    const $ = id => document.getElementById(id), set = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    set('bName', 'Sample bowler'); set('speed', '16.5'); set('revs', '360'); set('papOver', '5 1/4'); set('papUp', '1/2');
    $('bSave')?.click(); document.querySelector('button#bSave, [id$="Save"]');
    const save = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save'); save?.click(); await wait(400);
    const pick = async (q) => { const o = [...document.querySelectorAll('#ballSearchList option')].map(o => o.value).find(v => v.toLowerCase().includes(q)); if (!o) return 'missing ' + q; const e = $('ballSearch'); e.value = o; e.dispatchEvent(new Event('input', {bubbles:true})); await wait(700); return o; };
    const added = [];
    for (const q of ['zero mercy pearl', 'phaze ii', 'hy-road pearl', 'black widow 3.0']) { const t = await pick(q); $('btnRec').click(); await wait(500); $('arsAdd').click(); await wait(500); added.push(t); }
    await pick('zero mercy pearl'); $('btnRec').click(); await wait(800);
    return 'arsenal: ' + added.join(', ');
  `));
  await sleep(1500);

  await shot('app-top', 'header', 0); // header only, to measure
  // the first screen of the app as a bowler sees it
  const r0 = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, captureBeyondViewport: true });
  await ev('scrollTo(0,0)'); await sleep(300);
  fs.writeFileSync(path.join(OUT, 'app-first-screen.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } })).data, 'base64'));
  console.log('app-first-screen.png 1440x900');

  await ev(`document.querySelector('header').style.visibility='visible'; const y=document.getElementById('layCard').getBoundingClientRect().top+scrollY-130; scrollTo(0,y); await new Promise(r=>setTimeout(r,800));`);
  fs.writeFileSync(path.join(OUT, 'app-window.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); console.log('app-window.png 1440x900 (viewport)');
  await shot('layout', '#layCard', 0);
  await shot('ball-view', '#ballA', 0);
  await shot('read', '#readCard', 0);
  await shot('lane-2d', '#lane2d', 0);
  await shot('motion-stats', '#statsHost', 0);
  await shot('arsenal', '#arsCard', 0);
  await shot('coverage', '#covChart', 0);

  // Compare A / B: both layouts side by side
  await ev(`const c=document.getElementById('compare'); if(!c.checked){ c.click(); } await new Promise(r=>setTimeout(r,1500));`);
  await shot('compare-layout', '#layCard', 0);
  await shot('compare-balls', '#ballsHost', 0);
  await ev(`const c=document.getElementById('compare'); if(c.checked){ c.click(); } await new Promise(r=>setTimeout(r,800));`);

  // 3D lane
  const ok3d = await ev(`document.querySelector('#laneSeg [data-v="3d"]').click(); await new Promise(r=>setTimeout(r,2500)); document.getElementById('slowmo').value='0.25'; document.getElementById('play').click(); await new Promise(r=>setTimeout(r,2600)); return !document.getElementById('lane3dHost').classList.contains('hidden');`);
  if (ok3d) await shot('lane-3d', '#lane3dHost', 0); else console.log('3D lane did not open (three.js offline?)');
  await ev(`document.querySelector('#laneSeg [data-v="2d"]').click();`);

  // log two shots so the shot log has rows
  console.log(await ev(`
    const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
    const setv = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event('input', {bubbles:true})); };
    setv('calBoard', '9'); setv('calFt', '41'); $('shotStrike').click(); await wait(900);
    const pin = document.querySelector('#pinDeck [data-pin="10"], #pinDeck button:last-child'); pin?.click();
    setv('calBoard', '8'); setv('calFt', '42'); $('shotLog').click(); await wait(900);
    return 'shots: ' + document.querySelectorAll('#shotTable tr').length + ' rows';
  `));
  await shot('log-a-shot', '#logBox', 0);

  // Driller mode
  await ev(`document.querySelector('[data-mode=driller]').click(); await new Promise(r=>setTimeout(r,1200));`);
  await shot('driller-layout', '#layCard', 0);
  await shot('fit', '#fitCard', 0);
  fs.unlinkSync(path.join(OUT, 'app-top.png'));
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
