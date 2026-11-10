// X-ING Pro Shop Lab — accounts, per-user cloud storage and plan gates.
//
// The app only ever talks to `store.get` / `store.set`. This module keeps that
// contract and adds:
//   • signed out  → the old behaviour: plain localStorage keys on this device ("guest").
//   • signed in   → keys are cached in localStorage as `u:<userId>:<key>` and every
//                   set() is pushed to Supabase (table user_store) shortly after.
//                   Edits made offline are remembered in a dirty list and pushed on
//                   the next load / when the browser comes back online.
// The module uses top-level await, so the app's own module starts only after the
// signed-in user's data has been pulled into the local cache.

const SUPABASE_URL = 'https://yeoraqksuvaohauxvvgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yyPXb_0hDXRKt1_z_H_ung_5Pq1iI6n'; // publishable: safe in the browser, RLS protects the data
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const AUTH_STORAGE_KEY = 'sb-yeoraqksuvaohauxvvgt-auth-token';

export const KEYS = ['layoutlab.bowlers', 'layoutlab.balls', 'xing.calib', 'xing.calibOil', 'layoutlab.mode'];
const PAID_PLANS = ['pro', 'shop'];
const PAID_STATUS = ['trialing', 'active', 'past_due'];

/* ---------- raw localStorage, never throws ---------- */
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const parse = (s, d) => { if (s == null) return d; try { return JSON.parse(s); } catch { return d; } };
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/* ---------- state ---------- */
let sb = null;          // supabase client (null if the library could not load)
let user = null;        // { id, email }
let profile = null;     // row from public.profiles
let online = false;     // last pull from the server worked
let cloudEmpty = false; // signed in, but the account has no data yet
let status = 'guest';   // guest | saving | saved | offline
const listeners = new Set();
const setStatus = s => { status = s; listeners.forEach(f => f()); };

const ns = k => (user ? `u:${user.id}:${k}` : k);
const metaKey = name => `u:${user.id}:__${name}`;
const dirty = () => new Set(parse(ls.get(metaKey('dirty')), []));
const saveDirty = s => ls.set(metaKey('dirty'), JSON.stringify([...s]));

/* ---------- the store the app uses ---------- */
export const store = {
  get(k, d) { return parse(ls.get(ns(k)), d); },
  set(k, v) { ls.set(ns(k), JSON.stringify(v)); push(k); }
};

/* ---------- push (debounced per key) ---------- */
const timers = {}, ver = {};
function push(k) {
  if (!user || !KEYS.includes(k)) return;
  const d = dirty(); d.add(k); saveDirty(d);
  ver[k] = (ver[k] || 0) + 1;
  clearTimeout(timers[k]);
  setStatus('saving');
  timers[k] = setTimeout(() => send(k), 800);
}
async function send(k) {
  delete timers[k];
  if (!sb || !user) { setStatus('offline'); return; }
  const raw = ls.get(ns(k)); if (raw == null) return;
  const v = ver[k];
  try {
    const { error } = await withTimeout(sb.from('user_store').upsert({ user_id: user.id, key: k, value: JSON.parse(raw) }), 15000);
    if (error) throw error;
    if (ver[k] === v) { const d = dirty(); d.delete(k); saveDirty(d); }
    if (!Object.keys(timers).length) setStatus(dirty().size ? 'offline' : 'saved');
  } catch (e) {
    console.warn('[cloud] save failed, will retry', k, e);
    setStatus('offline');
  }
}
async function flush() {
  if (!user) return;
  for (const k of dirty()) { clearTimeout(timers[k]); await send(k); }
}
window.addEventListener('online', flush);
window.addEventListener('pagehide', () => { for (const k of Object.keys(timers)) { clearTimeout(timers[k]); send(k); } });

/* ---------- start-up: restore session, pull data ---------- */
try {
  const { createClient } = await withTimeout(import(SUPABASE_JS), 8000);
  sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: AUTH_STORAGE_KEY },
    global: { fetch: (...a) => window.fetch(...a) } }); // looked up per call, so tests can stub it
  const { data } = await withTimeout(sb.auth.getSession(), 6000);
  const u = data?.session?.user; if (u) user = { id: u.id, email: u.email };
} catch (e) {
  console.warn('[cloud] auth library unavailable, working from this device', e);
  const cached = parse(ls.get(AUTH_STORAGE_KEY), null)?.user; // stay in the signed-in cache while offline
  if (cached?.id) user = { id: cached.id, email: cached.email };
}

if (user) {
  profile = parse(ls.get(metaKey('profile')), null);
  try {
    await flush();
    const [rows, prof] = await withTimeout(Promise.all([
      sb.from('user_store').select('key,value'),
      sb.from('profiles').select('*').eq('id', user.id).single()
    ]), 8000);
    if (rows.error) throw rows.error;
    if (prof.data) { profile = prof.data; ls.set(metaKey('profile'), JSON.stringify(profile)); }
    const d = dirty();
    for (const r of rows.data) if (!d.has(r.key)) ls.set(ns(r.key), JSON.stringify(r.value));
    cloudEmpty = rows.data.length === 0 && !d.size;
    online = true;
    setStatus(d.size ? 'offline' : 'saved');
  } catch (e) {
    console.warn('[cloud] could not reach the server, using this device’s copy', e);
    setStatus('offline');
  }
  sb?.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_OUT' || (session && session.user.id !== user.id)) location.reload(); });
}

/* ---------- plans ---------- */
export const cloud = {
  get user() { return user; },
  get profile() { return profile; },
  get status() { return status; },
  get isPaid() { return !!profile && PAID_PLANS.includes(profile.plan) && PAID_STATUS.includes(profile.plan_status); },
  get isShop() { return this.isPaid && profile.plan === 'shop'; },
  onChange(f) { listeners.add(f); },
  /** true if the user's plan includes this feature (no dialog) */
  can(feature) { return (FEATURES[feature]?.tier || 'pro') === 'shop' ? this.isShop : this.isPaid; },
  /** returns true if the user may use the feature; otherwise shows the upgrade dialog */
  require(feature) { if (this.can(feature)) return true; openUpsell(feature); return false; },
  /** marks every [data-plan] control the user's plan doesn't include as .locked (greyed out + Pro/Shop badge) */
  markLocks(root = document) {
    root.querySelectorAll('[data-plan]').forEach(e => e.classList.toggle('locked', !this.can(e.dataset.plan)));
  }
};

/* ---------- Shop: customer contact cards ----------
   Table public.customers, one row per bowler (bowler_key = the bowler's name in 'layoutlab.bowlers').
   The database only lets a paid Shop account read or write it, so this needs the server (no offline copy). */
const CUST_COLS = 'id,bowler_key,phone,email,notes,updated_at';
const custErr = e => {
  const missing = e && (e.code === '42P01' || e.code === 'PGRST205' || /customers/.test(e.message || '') && /not find|does not exist/.test(e.message || ''));
  if (e?.code === '42501') return new Error('Your plan doesn’t include the customer list. It’s part of Shop.');
  return new Error(missing ? 'The customer list isn’t set up on the server yet.' : e?.message === 'timeout' || !online ? 'Couldn’t reach the server. Check your connection and try again.' : (e?.message || 'Something went wrong.'));
};
export const customers = {
  async list() {
    if (!sb || !user) throw new Error('Sign in to see your customers.');
    try { const { data, error } = await withTimeout(sb.from('customers').select(CUST_COLS).order('bowler_key'), 10000); if (error) throw error; return data; }
    catch (e) { throw custErr(e); }
  },
  /** creates or updates the contact card for one bowler */
  async save({ bowler_key, phone, email, notes }) {
    if (!sb || !user) throw new Error('Sign in first.');
    const row = { shop_id: user.id, bowler_key: bowler_key.trim(), phone: phone?.trim() || null, email: email?.trim() || null, notes: notes?.trim() || null };
    try { const { data, error } = await withTimeout(sb.from('customers').upsert(row, { onConflict: 'shop_id,bowler_key' }).select(CUST_COLS).single(), 10000); if (error) throw error; return data; }
    catch (e) { throw custErr(e); }
  },
  async remove(id) {
    if (!sb || !user) throw new Error('Sign in first.');
    try { const { error } = await withTimeout(sb.from('customers').delete().eq('id', id), 10000); if (error) throw error; }
    catch (e) { throw custErr(e); }
  }
};

/* ==================== UI ==================== */
const css = `
.acct { display:inline-flex; align-items:center; gap:8px; }
.acct .sync { font-size:12px; color:var(--ink-2); }
.acct .sync.offline { color:var(--warn-ink); }
.plan-badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; padding:1px 7px; border-radius:999px; background:var(--chip); color:var(--ink-2); }
.plan-badge.paid { background:var(--accent); color:var(--accent-ink); }
dialog.xd { border:1px solid var(--line); border-radius:12px; background:var(--panel); color:var(--ink); padding:0; width:min(420px, calc(100vw - 32px)); }
dialog.xd::backdrop { background:rgba(0,0,0,.55); }
.xd form, .xd .body { padding:18px 20px; display:grid; gap:10px; }
.xd h2 { margin:0; font-size:18px; }
.xd label { display:grid; gap:4px; font-size:12px; color:var(--ink-2); }
.xd input, .xd select { font:inherit; font-size:14px; padding:7px 9px; border:1px solid var(--line); border-radius:8px; background:var(--panel-2); color:var(--ink); }
.xd .tabs { display:flex; border-bottom:1px solid var(--line); }
.xd .tabs button { flex:1; background:none; border:0; padding:12px; font:inherit; font-weight:600; color:var(--ink-2); cursor:pointer; border-bottom:2px solid transparent; }
.xd .tabs button.on { color:var(--ink); border-bottom-color:var(--accent); }
.xd .row2 { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
.xd .msg { font-size:13px; min-height:1em; }
.xd .msg.err { color:#c0392b; }
.xd .msg.ok { color:var(--good); }
.xd .link { background:none; border:0; padding:0; color:var(--a); cursor:pointer; font:inherit; font-size:12px; justify-self:start; }
.xd ul { margin:0; padding-left:18px; }
.import-banner { display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:8px 16px; background:var(--warn-bg); color:var(--warn-ink); border-bottom:1px solid var(--line); font-size:13px; }
#logBox.locked > span:first-child::after, .locked[data-badge]::after { content:attr(data-badge); margin-left:6px; font-size:10px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; padding:1px 6px; border-radius:999px; background:var(--accent); color:var(--accent-ink); vertical-align:middle; }
#logBox.locked > span:first-child::after { content:'Pro'; }
.locked[data-badge] { opacity:.6; white-space:nowrap; }
.locked[data-badge]:hover { opacity:.85; }
.plan-lock { display:inline-flex; gap:6px; align-items:center; }
.guest-dim { opacity:.45; filter:grayscale(.4); user-select:none; }
.guest-banner { background:var(--panel-2); color:var(--ink); }
`;
const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.assign(e, attrs); if (html) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const planName = () => !profile ? 'Free' : (cloud.isPaid ? (profile.plan === 'shop' ? 'Shop' : 'Pro') : 'Free');

function mount() {
  document.head.appendChild(el('style', {}, css));
  const hg = document.querySelector('header .hgroup');
  const box = el('div', { className: 'acct' });
  hg.appendChild(box);
  const render = () => {
    if (!user) {
      box.innerHTML = `<button class="btn" type="button" data-a="signin">Sign in</button>`;
      return;
    }
    const s = { saving: 'Saving…', saved: 'Saved', offline: 'Offline — saved on this device' }[status] || '';
    box.innerHTML = `<span class="sync ${status}">${s}</span><button class="btn" type="button" data-a="account" title="${esc(user.email)}">${esc(profile?.display_name || user.email)} <span class="plan-badge ${cloud.isPaid ? 'paid' : ''}">${planName()}</span></button>`;
  };
  box.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'signin') openAuth('signin'); if (a === 'account') openAccount(); });
  cloud.onChange(render); render();

  // shot log is a Pro feature
  const lb = document.getElementById('logBox');
  if (lb && !cloud.isPaid) lb.classList.add('locked');
  // every other gated control carries data-plan="<feature>"; the badge text comes from the feature's tier
  document.querySelectorAll('[data-plan]').forEach(e => { if (!e.dataset.badge) e.dataset.badge = (FEATURES[e.dataset.plan]?.tier === 'shop' ? 'Shop' : 'Pro'); });
  cloud.markLocks();

  if (user && online && cloudEmpty && KEYS.some(k => ls.get(k) != null)) showImportBanner();
  if (!user) lockForGuests(hg, box);
  // the front page's "Create a free account" links land on app/#signup: open the sign-up window straight away
  if (location.hash === '#signup') {
    history.replaceState(null, '', location.pathname + location.search);
    if (!user) openAuth('signup');
  }
}

// Signed out: the app stays visible but nothing can be clicked or typed until the visitor signs in.
// `inert` blocks mouse, keyboard and focus, so this can't be tabbed around.
function lockForGuests(hg, box) {
  document.body.classList.add('guest-locked');
  const targets = [document.querySelector('main'), ...[...hg.children].filter(c => c !== box)].filter(Boolean);
  targets.forEach(t => { t.inert = true; t.classList.add('guest-dim'); });
  const b = el('div', { className: 'import-banner guest-banner', role: 'status' },
    `<span><b>Sign in or create a free account to start.</b> Your bowlers, balls and layouts are saved to your account.</span>
     <button class="btn sm primary" type="button" data-a="signup">Create free account</button><button class="btn sm" type="button" data-a="signin">Sign in</button>`);
  b.addEventListener('click', e => { const a = e.target.dataset.a; if (a) openAuth(a); });
  document.querySelector('header').after(b);
}

function dialog(html) {
  const d = el('dialog', { className: 'xd' }, html);
  document.body.appendChild(d);
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.showModal();
  return d;
}

function openAuth(tab = 'signin') {
  const d = dialog(`
    <div class="tabs"><button type="button" data-t="signin">Sign in</button><button type="button" data-t="signup">Create account</button></div>
    <form method="dialog" novalidate>
      <div class="up"><label>Your name or shop name<input name="name" autocomplete="name" maxlength="80"></label></div>
      <div class="up"><label>I am a<select name="type"><option value="bowler">Bowler</option><option value="shop">Pro shop (many bowlers)</option></select></label></div>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" minlength="8" required></label>
      <button class="link in" type="button" data-a="forgot">Forgot password?</button>
      <div class="msg"></div>
      <div class="row2"><button class="btn" type="button" data-a="cancel">Cancel</button><button class="btn primary" type="submit">Sign in</button></div>
    </form>`);
  const f = d.querySelector('form'), msg = d.querySelector('.msg'), submit = f.querySelector('[type=submit]');
  const say = (t, kind = 'err') => { msg.textContent = t; msg.className = 'msg ' + kind; };
  const setTab = t => {
    tab = t;
    d.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    d.querySelectorAll('.up').forEach(x => (x.hidden = t !== 'signup'));
    d.querySelectorAll('.in').forEach(x => (x.hidden = t !== 'signin'));
    f.password.autocomplete = t === 'signup' ? 'new-password' : 'current-password';
    submit.textContent = t === 'signup' ? 'Create account' : 'Sign in';
    say('');
  };
  d.querySelector('.tabs').addEventListener('click', e => { const t = e.target.dataset.t; if (t) setTab(t); });
  d.querySelector('[data-a=cancel]').addEventListener('click', () => d.close());
  d.querySelector('[data-a=forgot]').addEventListener('click', async () => {
    const email = f.email.value.trim(); if (!email) return say('Enter your email first.');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    say(error ? error.message : 'If that email has an account, a reset link is on its way.', error ? 'err' : 'ok');
  });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (!sb) return say('Can’t reach the sign-in service. Check your connection.');
    const email = f.email.value.trim(), password = f.password.value;
    if (!email || !password) return say('Enter your email and password.');
    if (tab === 'signup' && password.length < 8) return say('Use at least 8 characters for the password.');
    submit.disabled = true; say('');
    try {
      if (tab === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.reload();
      } else {
        const { data, error } = await sb.auth.signUp({ email, password, options: {
          emailRedirectTo: location.origin + location.pathname,
          data: { display_name: f.name.value.trim() || undefined, account_type: f.type.value } } });
        if (error) throw error;
        if (data.session) return location.reload();
        d.close();
        notice(`Almost done: we sent a confirmation link to ${email}. Click it to finish creating your account, then sign in.`);
      }
    } catch (err) { say(err.message || 'Something went wrong.'); }
    finally { submit.disabled = false; }
  });
  setTab(tab);
}

function openAccount() {
  const p = profile || {};
  const renews = p.plan_renews_at ? new Date(p.plan_renews_at).toLocaleDateString() : '';
  const d = dialog(`<div class="body">
    <h2>${esc(p.display_name || user.email)}</h2>
    <div>${esc(user.email)} · ${p.account_type === 'shop' ? 'Pro shop' : 'Bowler'}</div>
    <div>Plan: <span class="plan-badge ${cloud.isPaid ? 'paid' : ''}">${planName()}</span>${p.plan_status === 'trialing' ? ' (trial)' : ''}${renews ? ` · renews ${esc(renews)}` : ''}</div>
    <div class="hint">${status === 'offline' ? 'Some changes are only on this device. They upload when you’re back online.' : 'Your bowlers, balls, shots and lane calibration are saved to your account.'}</div>
    <div class="row2">
      ${cloud.isPaid ? '' : '<button class="btn primary" type="button" data-a="upgrade">See Pro plans</button>'}
      <button class="btn" type="button" data-a="signout">Sign out</button>
      <button class="btn" type="button" data-a="close">Close</button>
    </div></div>`);
  d.querySelector('[data-a=close]').addEventListener('click', () => d.close());
  d.querySelector('[data-a=upgrade]')?.addEventListener('click', () => { d.close(); openUpsell(); });
  d.querySelector('[data-a=signout]').addEventListener('click', async () => {
    await flush();
    await sb?.auth.signOut();
    location.reload();
  });
}

// every gated feature: what it's called in the upsell and the lowest plan that includes it
const FEATURES = {
  shotlog:  { label: 'The shot log and lane calibration', tier: 'pro' },
  autoline: { label: 'Auto line (best strike line)', tier: 'pro' },
  strike:   { label: 'Strike chance', tier: 'pro' },
  lane3d:   { label: 'The 3D lane view', tier: 'pro' },
  compare:  { label: 'Compare A / B', tier: 'pro' },
  print:    { label: 'Printing drill and spec sheets', tier: 'pro' },
  coverage: { label: 'The arsenal coverage chart', tier: 'pro' },
  export:   { label: 'Exporting your data', tier: 'pro' },
  driller:  { label: 'Driller mode', tier: 'shop' },
  customers: { label: 'The customer list', tier: 'shop' }
};
function openUpsell(feature) {
  const f = FEATURES[feature], plan = f?.tier === 'shop' ? 'Shop' : 'Pro';
  const d = dialog(`<div class="body">
    <h2>${f ? `${esc(f.label)} is part of ${plan}` : 'X-ING plans'}</h2>
    <ul>
      <li><b>Free</b>: unlimited bowlers and balls, layout recommendations, PAP, ball motion, the 3D drilled ball, the top-down lane, and import.</li>
      <li><b>Pro</b> (bowlers): plus Auto line and strike chance, the 3D lane, Compare A / B, arsenal coverage, printing drill and spec sheets, export, and the shot log with lane calibration.</li>
      <li><b>Shop</b> (pro shops): everything in Pro, plus Driller mode and the customer list.</li>
    </ul>
    <div class="hint">${user ? 'Online checkout is coming soon.' : 'Create a free account first, then upgrade.'}</div>
    <div class="row2">
      ${user ? '' : '<button class="btn primary" type="button" data-a="signup">Create account</button>'}
      <button class="btn" type="button" data-a="close">Close</button>
    </div></div>`);
  d.querySelector('[data-a=close]').addEventListener('click', () => d.close());
  d.querySelector('[data-a=signup]')?.addEventListener('click', () => { d.close(); openAuth('signup'); });
}

function notice(text) {
  document.querySelector('.import-banner.note')?.remove();
  const b = el('div', { className: 'import-banner note', role: 'status' });
  b.append(el('span', { textContent: text }), el('button', { className: 'btn sm', type: 'button', textContent: 'OK' }));
  b.querySelector('button').addEventListener('click', () => b.remove());
  document.querySelector('header').after(b);
}

function showImportBanner() {
  const b = el('div', { className: 'import-banner' }, `<span>This device has X-ING data saved from before you signed in. Copy it into your account?</span>
    <button class="btn sm" type="button" data-a="yes">Copy it into my account</button><button class="btn sm" type="button" data-a="no">Not now</button>`);
  document.querySelector('header').after(b);
  b.addEventListener('click', async e => {
    const a = e.target.dataset.a; if (!a) return;
    if (a === 'no') { b.remove(); return; }
    e.target.disabled = true;
    for (const k of KEYS) { const raw = ls.get(k); if (raw != null) { ls.set(ns(k), raw); push(k); } }
    await flush();
    location.reload();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
