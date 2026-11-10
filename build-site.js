// Builds dist/ for Cloudflare Pages: only the files the website needs.
// Nothing else in this folder (backups, notes, supabase/*.local.json) is published.
//   node build-site.js
//   npx wrangler pages deploy dist --project-name x-ing-pro-shop-lab --branch main
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'js'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'x-ing-pro-shop-lab.html'), path.join(out, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'js', 'cloud.js'), path.join(out, 'js', 'cloud.js'));
// old links to the page's file name keep working
fs.writeFileSync(path.join(out, '_redirects'), '/x-ing-pro-shop-lab.html / 301\n');
console.log('dist/ ready:', fs.readdirSync(out, { recursive: true }).join(', '));
