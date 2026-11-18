/** Content rules from the master plan, enforced on every build (CI). */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS } from '../src/config/tool-map';

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

describe('keyword map', () => {
  it('every page has one unique primary keyword', () => {
    const seen = new Map<string, string>();
    for (const d of docs) {
      const k = d.fm.keyword?.toLowerCase();
      expect(k, d.file).toBeTruthy();
      expect(seen.get(k), `${d.file} reuses "${k}"`).toBeUndefined();
      seen.set(k, d.file);
    }
  });
  it('no secondary keyword is another page\'s primary', () => {
    const primaries = new Map(docs.map((d) => [d.fm.keyword.toLowerCase(), d.file]));
    for (const d of docs) for (const s of d.secondary) {
      const owner = primaries.get(s);
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

describe('article queue (planned keywords)', () => {
  const q = fs.readFileSync('content/queue-de.csv', 'utf8').trim().split('\n').slice(1);
  const parse = (line: string) => { const out: string[] = []; let f = '', inQ = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (inQ) { if (ch === '"' && line[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') inQ = false; else f += ch; } else if (ch === '"') inQ = true; else if (ch === ',') { out.push(f); f = ''; } else f += ch; } out.push(f); return out; };
  const rows = q.map(parse);
  it('no planned keyword collides with a live page or another brief', () => {
    const live = new Map<string, string>();
    for (const d of docs) { live.set(d.fm.keyword.toLowerCase(), d.file); for (const s of d.secondary) live.set(s, d.file); }
    const seen = new Map<string, string>();
    for (const r of rows) {
      for (const k of [r[0], ...(r[10] ? r[10].split('|') : [])].map((x) => x.toLowerCase())) {
        expect(live.get(k), `queue "${r[0]}" uses "${k}" owned by ${live.get(k)}`).toBeUndefined();
        expect(seen.get(k), `"${k}" planned twice (${seen.get(k)} and ${r[0]})`).toBeUndefined();
        seen.set(k, r[0]);
      }
      expect(r[1].length, r[1]).toBeLessThanOrEqual(60);
    }
  });
});
