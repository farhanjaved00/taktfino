// Runs after `astro build`:
// 1. Per-language 404: Cloudflare Pages serves the nearest 404.html, so copy /de/404/index.html → /de/404.html
// 2. Pagefind search index (German stemming etc. from <html lang>)
// 3. IndexNow key file (if INDEXNOW_KEY is set)
// 4. Warn about remaining [PLACEHOLDERS] and unreviewed pages
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

for (const dir of fs.readdirSync('dist')) {
  const src = path.join('dist', dir, '404', 'index.html');
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join('dist', dir, '404.html')); fs.rmSync(path.join('dist', dir, '404'), { recursive: true }); }
}
execSync('npx pagefind --site dist --quiet', { stdio: 'inherit' });

// One live language → "/" 301 to it (the picker would be a thin page). Prepend so it wins over other rules.
const liveCodes = [...fs.readFileSync('src/config/locales.ts', 'utf8').matchAll(/code: '([a-z-]+)'[^\n]*live: true/g)].map((m) => m[1]);
if (liveCodes.length === 1) {
  const rf = 'dist/_redirects';
  const cur = fs.existsSync(rf) ? fs.readFileSync(rf, 'utf8') : '';
  fs.writeFileSync(rf, `/ /${liveCodes[0]}/ 301\n` + cur);
}

const key = process.env.INDEXNOW_KEY;
if (key && /^[a-zA-Z0-9-]{8,128}$/.test(key)) fs.writeFileSync(`dist/${key}.txt`, key);

const cfg = fs.readFileSync('src/config/site.ts', 'utf8');
const placeholders = [...new Set(cfg.match(/'\[[^\]]+\]'/g) || [])];
if (placeholders.length) console.warn(`\n⚠  ${placeholders.length} placeholders left in src/config/site.ts (brand, imprint, people) – fill them before launch.`);
let unreviewed = 0;
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.md') && /reviewed:\s*false/.test(fs.readFileSync(p, 'utf8'))) unreviewed++; } })('src/content');
if (unreviewed) console.warn(`⚠  ${unreviewed} content pages are not reviewed yet – they are built with noindex and left out of the sitemap.\n`);
