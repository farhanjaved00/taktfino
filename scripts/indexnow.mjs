#!/usr/bin/env node
/**
 * Tells IndexNow engines (Bing — which also feeds ChatGPT search — Yandex, Seznam, Naver) about URLs.
 * Google does not use IndexNow; it reads the sitemap.
 *   node scripts/indexnow.mjs days-from-today guides      submit the URLs of these sitemaps (from dist/)
 *   node scripts/indexnow.mjs --all                       every sitemap
 * Env: SITE_URL, INDEXNOW_KEY (the same key must be set in Cloudflare so /<key>.txt is deployed)
 */
import fs from 'node:fs';
import path from 'node:path';
const KEY = process.env.INDEXNOW_KEY;
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!KEY || !SITE) { console.log('IndexNow skipped: set INDEXNOW_KEY and SITE_URL'); process.exit(0); }
const dir = 'dist/sitemaps';
const families = process.argv.includes('--all') ? fs.readdirSync(dir).map((f) => f.replace('.xml', '')) : process.argv.slice(2);
const urls = families.flatMap((f) => {
  const p = path.join(dir, `${f}.xml`);
  return fs.existsSync(p) ? [...fs.readFileSync(p, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [];
});
if (!urls.length) { console.log('IndexNow: no URLs'); process.exit(0); }
const host = new URL(SITE).host;
for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow: ${Math.min(10000, urls.length - i)} URLs → HTTP ${res.status}`);
}
