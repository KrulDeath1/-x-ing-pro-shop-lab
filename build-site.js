// Builds dist/ for Cloudflare Pages: only the files the website needs.
// Nothing else in this folder (backups, notes, supabase/*.local.json, the taste-skill kit) is published.
//   node build-site.js
//   npx wrangler pages deploy dist --project-name x-ing-pro-shop-lab --branch main
//
//   /            the front page (landing/index.html) and only the kit files it loads (landing/tools/loaded-files.txt)
//   /app/        the app (x-ing-pro-shop-lab.html) and js/cloud.js
const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'dist'), landing = path.join(root, 'landing');
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const copyDir = (from, to) => { for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); e.isDirectory() ? copyDir(a, b) : copy(a, b); } };
fs.rmSync(out, { recursive: true, force: true });

// the app at /app/
copy(path.join(root, 'x-ing-pro-shop-lab.html'), path.join(out, 'app', 'index.html'));
copy(path.join(root, 'js', 'cloud.js'), path.join(out, 'app', 'js', 'cloud.js'));

// the front page at /
const list = fs.readFileSync(path.join(landing, 'tools', 'loaded-files.txt'), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
for (const f of list) copy(path.join(landing, f), path.join(out, f));
copy(path.join(landing, 'share.jpg'), path.join(out, 'share.jpg'));
// each effect and moment the page uses ships whole (stills and fallbacks it may load later)
for (const d of ['assets/moments/word-highlight', 'assets/moments/iris-opens']) copyDir(path.join(landing, d), path.join(out, d));

// old links to the app's file name open the app
fs.writeFileSync(path.join(out, '_redirects'), '/x-ing-pro-shop-lab.html /app/ 301\n');

let n = 0, bytes = 0; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { n++; bytes += fs.statSync(p).size; } } })(out);
console.log(`dist/ ready: ${n} files, ${(bytes / 1048576).toFixed(1)} MB`);
