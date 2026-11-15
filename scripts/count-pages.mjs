// Cloudflare Pages (free) allows 20,000 files per deploy. Warn early.
import fs from 'node:fs';
import path from 'node:path';
let n = 0;
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : n++; } })('dist');
const LIMIT = 20000;
console.log(`dist has ${n} files (${Math.round((n / LIMIT) * 100)}% of the ${LIMIT} file limit)`);
if (n > LIMIT * 0.8) console.log('::warning::Over 80% of the Cloudflare Pages file limit — plan the move of long-tail pages to Cloudflare Workers (see README).');
if (n > LIMIT) process.exit(1);
