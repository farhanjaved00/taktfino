/** Content rules from the master plan, enforced on every build (CI). */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS, toolsFor } from '../src/config/tool-map';
import { LOCALES } from '../src/config/locales';

interface Doc { file: string; type: string; fm: Record<string, string>; secondary: string[]; body: string }
function load(): Doc[] {
  const out: Doc[] = [];
  for (const type of ['tools', 'articles', 'regions']) {
    const base = path.join('src/content', type);
    for (const lang of fs.readdirSync(base)) for (const f of fs.readdirSync(path.join(base, lang))) {
      const raw = fs.readFileSync(path.join(base, lang, f), 'utf8');
      const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw)!;
      const fm: Record<string, string> = {};
      for (const line of m[1].split('\n')) { const k = /^(\w+):\s*"?(.*?)"?$/.exec(line); if (k) fm[k[1]] = k[2]; }
      const sec = /secondary:\s*\[(.*)\]/.exec(m[1]);
      out.push({ file: `${type}/${lang}/${f}`, type, fm, secondary: sec ? [...sec[1].matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase()) : [], body: m[2] });
    }
  }
  return out;
}
const docs = load();
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Keywords are unique per language (the same phrase can be used in es and pt-br, they are different SERPs). */
const lang = (d: Doc) => d.file.split('/')[1];
const kk = (l: string, k: string) => `${l}:${k.toLowerCase()}`;

describe('keyword map', () => {
  it('every page has one unique primary keyword', () => {
    const seen = new Map<string, string>();
    for (const d of docs) {
      expect(d.fm.keyword, d.file).toBeTruthy();
      const k = kk(lang(d), d.fm.keyword);
      expect(seen.get(k), `${d.file} reuses "${k}"`).toBeUndefined();
      seen.set(k, d.file);
    }
  });
  it('no secondary keyword is another page\'s primary', () => {
    const primaries = new Map(docs.map((d) => [kk(lang(d), d.fm.keyword), d.file]));
    for (const d of docs) for (const s of d.secondary) {
      const owner = primaries.get(kk(lang(d), s));
      if (owner) expect(owner, `${d.file} targets "${s}" which belongs to ${owner}`).toBe(d.file);
    }
  });
});

describe('page template rules', () => {
  it('title ≤ 60, description ≤ 155', () => {
    for (const d of docs) {
      expect(d.fm.title.length, d.file).toBeLessThanOrEqual(60);
      expect(d.fm.description.length, d.file).toBeLessThanOrEqual(155);
    }
  });
  it('tool and region pages have a 40–60 word direct answer', () => {
    for (const d of docs.filter((x) => x.type !== 'articles')) {
      const n = words(d.fm.answer);
      expect(n, `${d.file}: ${n} words`).toBeGreaterThanOrEqual(40);
      expect(n, `${d.file}: ${n} words`).toBeLessThanOrEqual(60);
    }
  });
  it('every article links its hub tool within the first 100 words', () => {
    for (const d of docs.filter((x) => x.type === 'articles')) {
      const lang = d.file.split('/')[1] as 'de';
      const slug = TOOLS.find((t) => t.id === d.fm.tool)!.slug[lang];
      const first = d.body.trim().split(/\s+/).slice(0, 100).join(' ');
      expect(first.includes(`/${lang}/${slug}/`), d.file).toBe(true);
    }
  });
  it('every tool has content in German', () => {
    for (const t of TOOLS) expect(docs.some((d) => d.file === `tools/de/${t.id}.md`), t.id).toBe(true);
  });
});

describe('article queues (planned keywords)', () => {
  const parse = (line: string) => { const out: string[] = []; let f = '', inQ = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (inQ) { if (ch === '"' && line[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') inQ = false; else f += ch; } else if (ch === '"') inQ = true; else if (ch === ',') { out.push(f); f = ''; } else f += ch; } out.push(f); return out; };
  for (const file of fs.readdirSync('content').filter((f) => /^queue-.+\.csv$/.test(f))) {
    const l = file.slice(6, -4);
    const lines = fs.readFileSync(`content/${file}`, 'utf8').trim().split('\n');
    const head = parse(lines[0]);
    const rows = lines.slice(1).map(parse);
    const col = (r: string[], n: string) => r[head.indexOf(n)] || '';
    it(`${file}: no planned keyword collides with a live page or another brief`, () => {
      expect(LOCALES.some((x) => x.code === l), `unknown language ${l}`).toBe(true);
      const live = new Map<string, string>();
      for (const d of docs.filter((x) => lang(x) === l)) { live.set(d.fm.keyword.toLowerCase(), d.file); for (const s of d.secondary) live.set(s, d.file); }
      // keywords reserved for tool pages that scripts/draft-locale.ts will write
      const planned = JSON.parse(fs.readFileSync('src/data/locale-keywords.json', 'utf8'))[l]?.tools || {};
      for (const [id, x] of Object.entries<any>(planned)) for (const k of [x.primary.keyword, ...x.secondary]) if (!live.has(k.toLowerCase())) live.set(k.toLowerCase(), `planned tool page ${l}/${id}`);
      const seen = new Map<string, string>();
      for (const r of rows) {
        const kw = col(r, 'keyword');
        for (const k of [kw, ...(col(r, 'secondary') ? col(r, 'secondary').split('|') : [])].map((x) => x.toLowerCase())) {
          expect(live.get(k), `queue "${kw}" uses "${k}" owned by ${live.get(k)}`).toBeUndefined();
          expect(seen.get(k), `"${k}" planned twice (${seen.get(k)} and ${kw})`).toBeUndefined();
          seen.set(k, kw);
        }
        expect(col(r, 'title').length, col(r, 'title')).toBeLessThanOrEqual(60);
        expect(TOOLS.some((t) => t.id === col(r, 'tool')), `${kw}: tool "${col(r, 'tool')}"`).toBe(true);
        expect(['work', 'pay', 'dates'], `${kw}: category`).toContain(col(r, 'category'));
        if (l !== 'de') expect(toolsFor(l as 'es').some((t) => t.id === col(r, 'tool')), `${kw}: tool ${col(r, 'tool')} does not exist in ${l}`).toBe(true);
      }
    });
  }
});

describe('languages', () => {
  it('every live language has a page for each of its tools and all static pages', () => {
    for (const l of LOCALES.filter((x) => x.live)) {
      for (const t of toolsFor(l.code)) expect(fs.existsSync(`src/content/tools/${l.code}/${t.id}.md`), `${l.code}/${t.id}`).toBe(true);
      if (l.code !== 'de') for (const p of ['about', 'contact', 'imprint', 'privacy', 'terms', 'editorial']) expect(fs.existsSync(`src/content/pages/${l.code}/${p}.md`), `${l.code}/${p}`).toBe(true);
    }
  });
  it('planned keywords per language (src/data/locale-keywords.json) are unique and cover every tool', () => {
    const kw = JSON.parse(fs.readFileSync('src/data/locale-keywords.json', 'utf8'));
    for (const l of LOCALES.filter((x) => x.code !== 'de')) {
      const tools = kw[l.code]?.tools || {};
      const all = Object.values(tools).flatMap((x: any) => [x.primary.keyword, ...x.secondary]).map((x: string) => x.toLowerCase());
      expect(new Set(all).size, `${l.code}: duplicate keyword`).toBe(all.length);
      for (const t of toolsFor(l.code)) expect(tools[t.id], `${l.code}/${t.id}`).toBeTruthy();
    }
  });
});
