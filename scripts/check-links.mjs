// Verifies every internal link in dist/ points to a built page, and every page has one canonical + valid JSON-LD.
import fs from 'node:fs';
import path from 'node:path';
const root = 'dist';
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(root);
const exists = (u) => { const p = path.join(root, u); return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const u = m[1];
    if (!exists(u)) { console.log(`BROKEN ${f} -> ${u}`); bad++; }
    else if (!u.endsWith('/') && !/\.[a-z0-9]+$/i.test(u)) { console.log(`NO-SLASH ${f} -> ${u}`); bad++; }
  }
  const canon = [...html.matchAll(/rel="canonical"/g)].length;
  if (canon !== 1) { console.log(`CANONICAL x${canon} ${f}`); bad++; }
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(m[1]); } catch { console.log(`BAD JSON-LD ${f}`); bad++; }
  }
}
// a redirect must never shadow a page that exists
if (fs.existsSync(path.join(root, '_redirects'))) {
  for (const line of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n')) {
    const src = line.trim().split(/\s+/)[0];
    if (!src || src.startsWith('#') || src.includes('*')) continue;
    if (exists(src)) { console.log(`REDIRECT SHADOWS PAGE ${src}`); bad++; }
  }
}
console.log(`${files.length} pages checked, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
