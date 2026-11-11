// Lists every file the front page loads (desktop and phone, scrolled to the bottom), so the build ships only those.
//   node tools/loaded-files.mjs   (needs the local server on :5317)  -> tools/loaded-files.txt
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const URL_ = 'http://localhost:5317/landing/index.html';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const PORT = 9334, sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xing-files-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
let ws, id = 0; const pending = new Map(), files = new Set();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  let wsUrl; for (let i = 0; i < 50 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await sleep(200); }
  ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id).res(d.result); pending.delete(d.id); } if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (u.includes('/landing/')) files.add(decodeURIComponent(u.split('/landing/')[1].split(/[?#]/)[0])); } });
  await send('Network.enable'); await send('Page.enable');
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url: URL_ }); await sleep(4000);
    for (let y = 0; y < 14; y++) { await send('Runtime.evaluate', { expression: `scrollBy(0, ${h})` }); await sleep(600); }
    await send('Runtime.evaluate', { expression: `document.querySelector('.nav__item .nav__link')?.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}))` }); await sleep(800);
  }
  const list = [...files].filter(Boolean).sort();
  fs.writeFileSync('tools/loaded-files.txt', list.join('\n') + '\n');
  console.log(list.length + ' files'); console.log(list.join('\n'));
} finally { try { ws?.close(); } catch {} chrome.kill(); await sleep(400); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
