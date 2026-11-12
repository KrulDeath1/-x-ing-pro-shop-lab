// Records the app's 3D lane as a short video for the front page, straight from the running app (localhost:5317).
// The 3D canvas is recorded in the page itself (canvas.captureStream + MediaRecorder), so no video encoder is needed.
// As in shots.mjs, cloud.js is served unlocked only during the capture; the app's own files are not changed.
//   node tools/lane-clip.mjs [cam] [seconds] [speed]     e.g.  node tools/lane-clip.mjs chase 9 0.5
//   cam: chase | behind | pins | high (default chase); writes assets/app/lane-3d-<cam>.webm
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [CAM = 'chase', SECS = '9', SPEED = '0.5'] = process.argv.slice(2);
const APP = 'http://localhost:5317/';
const OUT = path.resolve('assets/app');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const PORT = 9334, W = 1440, H = 900, DPR = 1.5;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-clip-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
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

  // the same sample bowler as the front page's worked example, with the ball the hero's ball view shows
  console.log(await ev(`
    const $ = id => document.getElementById(id), set = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    set('bName', 'Sample bowler'); set('speed', '16.5'); set('revs', '360'); set('papOver', '5 1/4'); set('papUp', '1/2');
    [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save')?.click(); await wait(400);
    const o = [...document.querySelectorAll('#ballSearchList option')].map(o => o.value).find(v => v.toLowerCase().includes('zero mercy pearl'));
    if (o) { const e = $('ballSearch'); e.value = o; e.dispatchEvent(new Event('input', {bubbles:true})); await wait(700); }
    $('btnRec').click(); await wait(1200);
    return 'ball: ' + (o || 'default');
  `));

  const res = await ev(`
    const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('#laneSeg [data-v="3d"]').click(); await wait(2500);
    if ($('lane3dHost').classList.contains('hidden')) return { error: '3D lane did not open (three.js offline?)' };
    const cam = $('cam'); cam.value = ${JSON.stringify(CAM)}; cam.dispatchEvent(new Event('change', {bubbles:true}));
    $('slowmo').value = ${JSON.stringify(SPEED)}; $('slowmo').dispatchEvent(new Event('change', {bubbles:true}));
    const host = $('lane3dHost'); host.scrollIntoView({ block: 'center' }); await wait(600);
    const canvas = host.querySelector('canvas'); if (!canvas) return { error: 'no canvas in the 3D lane' };
    const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 5_000_000 });
    const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r);
    rec.start(250); await wait(300);
    $('play').click();
    // a few stills along the way, to check the clip without playing it
    const stills = [], T = ${Number(SECS) * 1000};
    for (const f of [0.1, 0.4, 0.7, 0.95]) { await wait(T * f - (stills.length ? T * [0.1, 0.4, 0.7, 0.95][stills.length - 1] : 0)); stills.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]); }
    await wait(T * 0.05); rec.stop(); await done;
    const blob = new Blob(chunks, { type });
    const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
    return { type, w: canvas.width, h: canvas.height, bytes: blob.size, b64, stills };
  `);
  if (res.error) throw new Error(res.error);
  const file = path.join(OUT, `lane-3d-${CAM}.webm`);
  fs.writeFileSync(file, Buffer.from(res.b64, 'base64'));
  console.log(`${path.basename(file)}  ${res.w}x${res.h}  ${(res.bytes / 1024 / 1024).toFixed(2)} MB  ${res.type}`);
  if (process.env.STILLS) {
    fs.mkdirSync(process.env.STILLS, { recursive: true });
    res.stills.forEach((b, i) => fs.writeFileSync(path.join(process.env.STILLS, `${CAM}-${i}.jpg`), Buffer.from(b, 'base64')));
    console.log(`stills: ${res.stills.length} in ${process.env.STILLS}`);
  }
} catch (e) { console.error(e); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill(); await sleep(500); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
