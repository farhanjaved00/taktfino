#!/usr/bin/env tsx
/**
 * Draft a whole new language with OpenAI (Master Plan v2 §21 — the "launch checklist" in one command):
 *   1. src/i18n/<lang>.json      — every key of de.json, translated and adapted to the target market
 *   2. src/content/tools/<lang>/  — one page per universal tool (toolsFor), keywords from src/data/locale-keywords.json
 *   3. src/content/pages/<lang>/  — about, contact, imprint, privacy, terms, editorial
 * Only MISSING files/keys are written, so it is safe to re-run (it resumes after an error).
 *
 *   npx tsx scripts/draft-locale.ts es             draft Spanish (stays live:false)
 *   npx tsx scripts/draft-locale.ts es --live      …and switch it live in src/config/locales.ts
 *   npx tsx scripts/draft-locale.ts es --dry-run   list what would be written
 * Env: OPENAI_API_KEY, OPENAI_MODEL (default gpt-4.1),
 *      AUTO_PUBLISH=true → pages that pass every automatic check get reviewed:true (indexable without a human).
 *
 * Country LAW tools (worktime, notice, surcharge, maternity, parental, vacation, workdays) are NOT drafted:
 * their rules must be coded + tested per country first (src/tools/*), see docs/LANGUAGE-ROADMAP.md §3.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOCALES, type LocaleCode } from '../src/config/locales';
import { TOOLS, toolsFor, toolPath, type ToolId } from '../src/config/tool-map';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const LANG = args.find((a) => !a.startsWith('--')) as LocaleCode;
const DRY = args.includes('--dry-run');
const GO_LIVE = args.includes('--live');
const AUTO = process.env.AUTO_PUBLISH === 'true';
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const loc = LOCALES.find((l) => l.code === LANG);
if (!loc || LANG === 'de') { console.error(`Usage: tsx scripts/draft-locale.ts <${LOCALES.filter((l) => l.code !== 'de').map((l) => l.code).join('|')}> [--live] [--dry-run]`); process.exit(1); }
if (!KEY && !DRY) { console.error('OPENAI_API_KEY is not set'); process.exit(1); }

const LANGUAGE: Record<LocaleCode, string> = { de: 'German', es: 'Spanish (Mexico first, neutral enough for Spain)', 'pt-br': 'Brazilian Portuguese', nl: 'Dutch (Netherlands, also Belgium)', fr: 'French (France, also Belgium/Switzerland)', pl: 'Polish', it: 'Italian', en: 'American English' };
const MARKETS = loc.countries.join(', ');
const today = new Date().toISOString().slice(0, 10);
const report: string[] = [];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const q = (s: string) => JSON.stringify(s);

async function ai(system: string, user: string): Promise<Record<string, any>> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    });
    if (res.ok) return JSON.parse((await res.json()).choices[0].message.content);
    if (attempt >= 3 || (res.status < 500 && res.status !== 429)) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

/* ---------- 1. UI strings ---------- */
type Tree = { [k: string]: string | Tree };
const flat = (o: Tree, p = ''): Record<string, string> => Object.fromEntries(Object.entries(o).flatMap(([k, v]) =>
  k.startsWith('$') ? [] : typeof v === 'string' ? [[p + k, v]] : Object.entries(flat(v, `${p}${k}.`))));
function setDeep(o: Tree, key: string, v: string) {
  const parts = key.split('.'); let cur = o;
  for (const p of parts.slice(0, -1)) cur = (cur[p] ??= {}) as Tree;
  cur[parts.at(-1)!] = v;
}
const vars = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(',');

async function translateUi() {
  const de = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/de.json'), 'utf8')) as Tree;
  const file = path.join(ROOT, `src/i18n/${LANG}.json`);
  const cur = (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}) as Tree;
  const have = flat(cur);
  const todo = Object.entries(flat(de)).filter(([k]) => !(k in have));
  console.log(`i18n: ${todo.length} keys to translate`);
  if (DRY || !todo.length) return;
  const system = `You localise the UI of a free calculator website (work time, hours, dates, pay) from German into ${LANGUAGE[LANG]} for users in ${MARKETS}.
Rules: keep every JSON key exactly; translate only values; keep placeholders like {n} {date} unchanged; keep it short, natural and UI-like (like a native product team would write).
Adapt, don't translate literally: where German text speaks about Germany/Austria/Switzerland in general (tagline, home description) write it for ${MARKETS} instead.
Keys that describe a specific German/Austrian/Swiss law (e.g. ruleDE, ruleAT, ruleCH, "ArbZG", "§") must stay about that country — translate them faithfully, do not invent rules for other countries.
Country names: use the normal ${LANGUAGE[LANG]} name. Currency/number formats are handled by code — never add currency symbols that are not in the source.
Answer as JSON object {"key": "translation", ...} with exactly the keys given.`;
  for (let i = 0; i < todo.length; i += 60) {
    const chunk = Object.fromEntries(todo.slice(i, i + 60));
    const out = await ai(system, JSON.stringify(chunk, null, 1));
    for (const [k, v] of Object.entries(chunk)) {
      const tr = out[k];
      if (typeof tr !== 'string' || !tr.trim()) { report.push(`i18n: no translation for ${k}`); continue; }
      if (vars(tr) !== vars(v)) { report.push(`i18n: placeholder mismatch in ${k} – kept German`); setDeep(cur, k, v); continue; }
      setDeep(cur, k, tr);
    }
    fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n'); // save after each chunk → resumable
    console.log(`  ${Math.min(i + 60, todo.length)}/${todo.length}`);
  }
}

/* ---------- 2. Tool pages ---------- */
const KW = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locale-keywords.json'), 'utf8'));

function allKeywords(): Set<string> {
  const set = new Set<string>();
  for (const dir of ['tools', 'articles', 'regions']) {
    const base = path.join(ROOT, 'src/content', dir);
    for (const l of fs.existsSync(base) ? fs.readdirSync(base) : []) for (const f of fs.readdirSync(path.join(base, l)))
      { const m = fs.readFileSync(path.join(base, l, f), 'utf8').match(/^keyword:\s*"?(.*?)"?\s*$/m); if (m) set.add(`${l}:${m[1].toLowerCase()}`); }
  }
  return set;
}

async function draftTool(id: ToolId) {
  const file = path.join(ROOT, `src/content/tools/${LANG}/${id}.md`);
  if (fs.existsSync(file)) return;
  const kw = KW[LANG]?.tools?.[id];
  if (!kw) { report.push(`tool ${id}: no keyword in src/data/locale-keywords.json – skipped`); return; }
  console.log(`tool: ${id} → ${toolPath(id, LANG)} (“${kw.primary.keyword}”)`);
  if (DRY) return;
  const ref = fs.readFileSync(path.join(ROOT, `src/content/tools/de/${id}.md`), 'utf8');
  const related = toolsFor(LANG).map((t) => t.id).filter((x) => x !== id);
  const system = `You write the text around a free online calculator for ${MARKETS}, in natural ${LANGUAGE[LANG]} (how a native would write; not a translation).
The German page below is the REFERENCE for structure and for what the calculator can do. Rewrite it for the new market:
- Primary keyword "${kw.primary.keyword}" in title, h1, first sentence of answer, and once in the first paragraph of the body. Use these secondary keywords naturally once each: ${kw.secondary.join(', ') || '(none)'}.
- title ≤ 55 characters, description 120–150 characters, h1 short.
- answer: 45–55 words, answers the search directly with a concrete example.
- body: Markdown, "##" headings only, 300–600 words, at least one table with worked examples (recompute every number — they must be correct), no German laws, no German-only facts.
- Never invent laws, percentages, studies or statistics. If a rule differs by country or contract, say so in general terms.
- faq: 3–4 short Q&A pairs people in ${MARKETS} actually ask.
Answer as JSON: {"title","description","h1","answer","body","faq":[{"q","a"}]}`;
  let j: Record<string, any> = {}; const issues: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    j = await ai(system, `German reference page:\n\n${ref}`);
    issues.length = 0;
    if (!j.title || !j.description || !j.h1 || !j.answer || !j.body) issues.push('missing fields');
    else {
      if (j.title.length > 60) issues.push(`title ${j.title.length} chars`);
      if (j.description.length > 155) issues.push(`description ${j.description.length} chars`);
      const w = words(j.answer); if (w < 40 || w > 60) issues.push(`answer ${w} words`);
      if (!/\n\|.*\|\n\|\s*:?-{3}/.test('\n' + j.body)) issues.push('no table');
      if (/\b(ArbZG|BGB|EStG|MuSchG|BEEG|BUrlG|Bundesland)\b/.test(j.body)) issues.push('mentions German law');
      if (!j.answer.toLowerCase().includes(kw.primary.keyword.toLowerCase().split(' ')[0])) issues.push('answer misses keyword');
    }
    if (!issues.length) break;
  }
  if (!j.title || !j.body) { report.push(`tool ${id}: FAILED (${issues.join(', ')})`); return; }
  if (allKeywords().has(`${LANG}:${kw.primary.keyword.toLowerCase()}`)) issues.push('primary keyword already used on another page');
  const ok = !issues.length;
  const faq = (j.faq || []).slice(0, 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, [
    '---', `tool: ${id}`, `keyword: ${q(kw.primary.keyword)}`, `secondary: ${JSON.stringify(kw.secondary)}`,
    `title: ${q(j.title.slice(0, 60))}`, `description: ${q(j.description.length > 155 ? j.description.slice(0, 152) + '…' : j.description)}`,
    `h1: ${q(j.h1)}`, `answer: ${q(j.answer)}`, `related: ${JSON.stringify(related.slice(0, 4))}`, `updated: ${today}`,
    'author: author', ...(AUTO && ok ? [] : ['reviewer: reviewer']), `reviewed: ${AUTO && ok}`,
    ...(faq.length ? ['faq:', ...faq.flatMap((x: any) => [`  - q: ${q(x.q)}`, `    a: ${q(x.a)}`])] : []),
    '---', '', j.body.trim(), '',
  ].join('\n'));
  report.push(`tool ${id}: ${ok ? '✅' : '⚠️ ' + issues.join(', ')} – ${toolPath(id, LANG)}`);
}

/* ---------- 3. Static / legal pages ---------- */
const PAGE_BRIEF: Record<string, string> = {
  about: 'About us: a small independent team building free, private calculators (all calculations run in the browser). How calculators are tested (unit tests against official examples), how content is reviewed by a native speaker, how to report errors.',
  contact: 'Contact: invite questions, error reports and tool wishes. Do NOT write the e-mail address (it is inserted separately); refer to "the address above". List what to include in an error report. State that no legal advice is given.',
  imprint: 'Legal notice / site operator page. The operator name, address and e-mail are inserted ABOVE your text automatically. Write only: liability for content (no guarantee, not legal advice), liability for external links, and copyright of the site. Keep it neutral.',
  privacy: `Privacy policy draft for ${MARKETS}. Controller details are inserted above automatically. Cover: calculations stay in the browser (localStorage for history, user can delete), hosting/CDN by Cloudflare (server logs, IP), optional analytics (Google Analytics 4 only with consent via Consent Mode v2) and Google AdSense with a certified consent platform, e-mail contact, user rights under the local data-protection law (${loc.countries.includes('MX') ? 'LFPDPPP' : loc.countries.includes('BR') ? 'LGPD' : loc.countries.includes('US') ? 'US state privacy laws such as CCPA' : 'GDPR'}). Start with one italic line saying this is a draft that must be checked before launch.`,
  terms: 'Terms of use: free service, results without guarantee and not legal/tax advice, no liability for decisions, content may change, governing rules in general terms.',
  editorial: 'Editorial policy: how pages are researched (official sources), AI-assisted drafting + human native review before indexing, how numbers/dates are checked with the calculators, corrections policy, independence from advertisers, sources linked on each page.',
};
const PAGE_IDS = ['about', 'contact', 'imprint', 'privacy', 'terms', 'editorial'] as const;

async function draftPage(page: (typeof PAGE_IDS)[number]) {
  const file = path.join(ROOT, `src/content/pages/${LANG}/${page}.md`);
  if (fs.existsSync(file)) return;
  console.log(`page: ${page}`);
  if (DRY) return;
  const j = await ai(`You write the ${page} page of "Taktfino", a free calculator website, in natural ${LANGUAGE[LANG]} for ${MARKETS}.
Never invent facts about the company, people, numbers or certifications. No e-mail addresses, no postal addresses.
Answer as JSON {"h1": "short page title", "description": "meta description 100–150 characters", "body": "Markdown, ## headings, 150–450 words"}`, PAGE_BRIEF[page]);
  if (!j.h1 || !j.body) { report.push(`page ${page}: FAILED`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Legal pages never go live without a human check, even with AUTO_PUBLISH.
  const ok = AUTO && page !== 'privacy' && page !== 'imprint' && page !== 'terms';
  fs.writeFileSync(file, ['---', `page: ${page}`, `h1: ${q(j.h1)}`, `description: ${q(String(j.description || j.h1).slice(0, 155))}`, `updated: ${today}`, `reviewed: ${ok}`, '---', '', j.body.trim(), ''].join('\n'));
  report.push(`page ${page}: ✅ drafted${ok ? '' : ' (needs review)'}`);
}

/* ---------- 4. go live ---------- */
function goLive() {
  const file = path.join(ROOT, 'src/config/locales.ts');
  const src = fs.readFileSync(file, 'utf8');
  const re = new RegExp(`(code: '${LANG}'[\\s\\S]*?live: )false`);
  if (!re.test(src)) { report.push(`live: ${LANG} already live or pattern not found`); return; }
  fs.writeFileSync(file, src.replace(re, '$1true'));
  report.push(`live: ${LANG} switched to live:true`);
}

async function main() {
  console.log(`Drafting ${LANG} (${LANGUAGE[LANG]}) – ${DRY ? 'dry run' : MODEL}${AUTO ? ', AUTO_PUBLISH' : ''}`);
  await translateUi();
  for (const t of toolsFor(LANG)) await draftTool(t.id);
  for (const p of PAGE_IDS) await draftPage(p);
  const skipped = TOOLS.filter((t) => !toolsFor(LANG).includes(t)).map((t) => t.id);
  report.push(`not drafted (country law, needs coded rules): ${skipped.join(', ')}`);
  if (GO_LIVE && !DRY) goLive();
  const out = process.env.PR_BODY;
  const text = [`## Language draft: ${LANG}`, '', ...report.map((r) => `- ${r}`), '',
    AUTO ? 'AUTO_PUBLISH is on: pages that passed every check are reviewed:true. Legal pages always need a human.' : 'All pages are reviewed:false (noindex) until a native speaker checks them and sets reviewed:true.'].join('\n');
  if (out) fs.writeFileSync(out, text + '\n');
  console.log('\n' + text);
}
main().catch((e) => { console.error(e); process.exit(1); });
