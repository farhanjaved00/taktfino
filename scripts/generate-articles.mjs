#!/usr/bin/env node
/**
 * Article drafts (plan §12): brief (content/queue-<lang>.csv) → AI draft in that language → review → publish.
 * Default: drafts are `reviewed: false` (noindex, not in sitemap) and the workflow opens a PULL REQUEST for review.
 * AUTO_PUBLISH=true: drafts that pass every automatic check get `reviewed: true` (indexable) and the workflow pushes
 * to main; drafts with warnings stay `reviewed: false` and are listed in the run summary.
 *
 *   npx tsx scripts/generate-articles.mjs            next N briefs for every LIVE language that has a queue
 *   LANG_CODE=de npx tsx scripts/generate-articles.mjs   only German
 *   npx tsx scripts/generate-articles.mjs --dry-run  show what would be written
 * Env: OPENAI_API_KEY, OPENAI_MODEL (default gpt-4.1), ARTICLES_PER_RUN (per language, default 1), LANG_CODE, AUTO_PUBLISH, PR_BODY
 * Run with tsx (it imports the slugs from src/config/tool-map.ts so URLs can never drift).
 */
import fs from 'node:fs';
import path from 'node:path';

import { TOOLS, CATEGORIES, toolsFor } from '../src/config/tool-map.ts';
import { LOCALES } from '../src/config/locales.ts';
import { factsFor, checkFacts, keywordStuffing } from './lib/facts.ts';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const AUTO = process.env.AUTO_PUBLISH === 'true';
const LANGS = process.env.LANG_CODE && process.env.LANG_CODE !== 'all'
  ? [process.env.LANG_CODE]
  : LOCALES.filter((l) => l.live && fs.existsSync(path.join(ROOT, `content/queue-${l.code}.csv`))).map((l) => l.code);
let LANG = 'de', QUEUE = '', DONE = '', OUT = '';
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const COUNT = Number(process.env.ARTICLES_PER_RUN || 1);
const PR_BODY = process.env.PR_BODY || path.join(ROOT, 'article-review.md');
const DRY = process.argv.includes('--dry-run');
const toolSlug = (id) => (LANG === 'de' || toolsFor(LANG).some((t) => t.id === id)) ? TOOLS.find((t) => t.id === id)?.slug[LANG] : undefined;
const catSlug = (c) => CATEGORIES[c]?.[LANG];

function parseCSV(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
const cell = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
const slugify = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-+$/, '');

/* dates for the reference calendar and the weekday check */
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const iso = (d) => d.toISOString().slice(0, 10);
function calendar() {
  const out = [];
  const intl = LOCALES.find((l) => l.code === LANG).intl;
  const wd = (d) => d.toLocaleDateString(intl, { weekday: 'long', timeZone: 'UTC' });
  const mo = (d) => d.toLocaleDateString(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  for (let i = -1; i < 15; i++) {
    const f = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1));
    const days = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate();
    out.push(LANG === 'de' ? `${MONTHS[f.getUTCMonth()]} ${f.getUTCFullYear()}: der 1. ist ein ${WD[f.getUTCDay()]}, ${days} Tage` : `${mo(f)}: day 1 = ${wd(f)}, ${days} days`);
  }
  return out.join('\n');
}
/** "Montag, 16. November 2026" / "Mo, 16.11.2026" weekday consistency */
function weekdayProblems(text) {
  const p = [];
  for (const m of text.matchAll(new RegExp(`(${WD.join('|')}),?\\s+(\\d{1,2})\\.\\s*(${MONTHS.join('|')})\\s+(\\d{4})`, 'g'))) {
    const d = new Date(Date.UTC(+m[4], MONTHS.indexOf(m[3]), +m[2]));
    if (WD[d.getUTCDay()] !== m[1]) p.push(`„${m[0]}“ – das ist ein ${WD[d.getUTCDay()]}`);
  }
  for (const m of text.matchAll(/\b(So|Mo|Di|Mi|Do|Fr|Sa),?\s+(\d{1,2})\.(\d{1,2})\.(\d{4})/g)) {
    const d = new Date(Date.UTC(+m[4], +m[3] - 1, +m[2]));
    if (WD[d.getUTCDay()].slice(0, 2) !== m[1]) p.push(`„${m[0]}“ – das ist ein ${WD[d.getUTCDay()]}`);
  }
  return p;
}

const SYSTEM_DE = `Du schreibst Ratgeber für eine kostenlose Rechner-Website (Arbeitszeit, Stunden, Arbeitstage, Lohn) für Deutschland, Österreich und die Schweiz.
Regeln – alle einhalten:
1. Beantworte die Suchfrage in den ersten zwei Sätzen. Keine Einleitung wie „In diesem Artikel“.
2. Verlinke den Rechner (relative URL, genau wie angegeben) innerhalb der ersten 100 Wörter als Markdown-Link.
3. Mindestens ein Rechenbeispiel mit echten Daten. Wochentage NUR aus dem Kalender unten ableiten und doppelt prüfen.
4. Mindestens eine Markdown-Tabelle.
5. Gliederung mit "##"-Überschriften (keine "#"-Überschrift; der Titel wird separat gesetzt). Nutze die vorgegebenen H2 als Leitfaden.
6. 700–1.200 Wörter. Kein Fülltext, keine Wiederholungen.
7. Erfinde NIE Fakten, Zahlen, Studien, Zitate oder Urteile. Nenne Paragraphen nur, wenn du sicher bist. Wo Regeln je nach Land, Bundesland, Tarifvertrag abweichen, sage das. Keine Rechtsberatung.
8. Deutsch in natürlicher, sachlicher Sprache (Sie-Form). Österreich/Schweiz erwähnen, wenn relevant.
9. VERBINDLICHE FAKTEN: Für Feiertage, Daten, Wochentage, Bundesländer, Anzahlen, Mindestlohn und Kalenderwochen verwendest du AUSSCHLIESSLICH die Angaben im Abschnitt „Verbindliche Fakten“. Übernimm Listen von Bundesländern vollständig. Was dort nicht steht, nennst du ohne konkrete Zahl oder lässt es weg. Einen Feiertag, der nicht in allen 16 Ländern gilt, nie als bundesweit bezeichnen.
10. Mindestens 750 Wörter.
11. Keywords NIE wörtlich in Klammern, Anführungszeichen oder kleingeschrieben einbauen. Schreibe Substantive groß („Brückentage 2027 in NRW“), formuliere natürlich. Keine Zeiträume erfinden: Freie Tage nur aus „Freie Zeiträume“ übernehmen.
Antworte als JSON: {"title": "SEO-Titel, 40–58 Zeichen, beginnt möglichst mit dem Hauptkeyword (Substantive groß), konkret und ohne Clickbait", "description": "Meta-Beschreibung ≤ 150 Zeichen", "body": "Markdown-Artikel", "faq": [{"q": "...", "a": "..."}] (3–4 Fragen, kurz)}`;

const LANGUAGE = { es: 'Spanish (Mexico first, understandable in Spain)', 'pt-br': 'Brazilian Portuguese', nl: 'Dutch', fr: 'French', pl: 'Polish', it: 'Italian', en: 'American English' };
const systemFor = (l) => l === 'de' ? SYSTEM_DE : `You write guides for a free calculator website (work time, hours, dates, pay) for readers in ${LOCALES.find((x) => x.code === l).countries.join(', ')}.
Follow every rule:
1. Answer the search question in the first two sentences. No intro like "In this article".
2. Link the calculator (relative URL exactly as given) as a Markdown link within the first 100 words.
3. At least one worked example with real dates/numbers. Take weekdays ONLY from the calendar below and double-check them.
4. At least one Markdown table.
5. Structure with "##" headings (no "#"; the title is set separately). Use the suggested H2s as a guide.
6. 700–1,200 words. No filler, no repetition.
7. NEVER invent facts, numbers, studies, quotes or court cases. Name laws/articles only when certain. Where rules differ by country, state or contract, say so. No legal advice.
8. Natural ${LANGUAGE[l]} as a native writer would use it – not a translation. Use the secondary keywords naturally once each.
Answer as JSON: {"title": "SEO title, 40–58 characters, starting with the primary keyword where natural, specific, no clickbait", "description": "meta description ≤ 150 characters", "body": "Markdown article", "faq": [{"q": "...", "a": "..."}] (3–4 short questions)}`;

function evaluate(j, b) {
  if (!j.body || !j.description) throw new Error('OpenAI response missing body/description');
  const issues = [];
  const t0 = (b.title || String(j.title || '')).trim();
  if (!t0) throw new Error(`no title for ${b.keyword}`);
  const title = t0.length > 60 ? (issues.push(`title ${t0.length} chars (max 60) – cut`), t0.slice(0, 60).replace(/\s+\S*$/, '')) : t0;
  const desc = j.description.length > 155 ? (issues.push('description cut (max 155)'), j.description.slice(0, 152) + '…') : j.description;
  const w = j.body.split(/\s+/).filter(Boolean).length;
  if (w < 700 || w > 1300) issues.push(`length ${w} words (target 700–1,200)`);
  if (!/\n\|.*\|\n\|\s*:?-{3}/.test('\n' + j.body)) issues.push('no table');
  if (!j.body.split(/\s+/).slice(0, 100).join(' ').includes(b.toolUrl)) issues.push(`calculator link ${b.toolUrl} missing in first 100 words`);
  if (/\b\d{1,3}(,\d+)?\s?%|Studie|laut einer Umfrage|Urteil vom|\bstud(y|ies|io|ie)\b|\bestudio\b|\bpesquisa\b|\benquête\b|\bbadani/i.test(j.body)) issues.push('contains percentages/studies/court cases – verify source or remove');
  if (LANG === 'de') for (const p of weekdayProblems(j.body)) issues.push(`Wochentag falsch: ${p}`);
  if (LANG === 'de') for (const p of checkFacts(j.body + '\n' + (j.faq || []).map((x) => `${x.q} ${x.a}`).join('\n'), b)) issues.push(`Fakt falsch: ${p}`);
  if (LANG === 'de') issues.push(...keywordStuffing(j.body, [b.keyword, ...b.secondary]));
  return { issues, title, desc };
}

async function repair(j, b) {
  let res = evaluate(j, b);
  for (let round = 1; round <= FIX_ROUNDS && res.issues.length; round++) {
    console.log(`  fix round ${round}: ${res.issues.length} issue(s)`);
    try {
      const fixed = await ask(LANG === 'de' ? SYSTEM_DE : systemFor(LANG),
        `Here is your previous article as JSON:\n${JSON.stringify(j)}\n\nThe automatic checks found these problems:\n- ${res.issues.join('\n- ')}\n\n` +
        (LANG === 'de' ? `Verbindliche Fakten:\n${factsFor(b, today)}\n\nKalender:\n${calendar()}\n\n` : '') +
        'Fix exactly these problems (remove a claim if unsure). Keep everything else. Answer with the full corrected JSON in the same format.');
      const r2 = evaluate(fixed, b);
      if (r2.issues.length <= res.issues.length) { j = fixed; res = r2; }
    } catch (err) { console.warn(`  fix round ${round} failed: ${err.message}`); }
  }
  return { j, res };
}

async function draft(b) {
  if (LANG !== 'de') {
    const user = `Primary keyword: ${b.keyword}
Secondary keywords: ${b.secondary.join(', ') || '-'}
Title: ${b.title || '(write it yourself, see JSON field title)'}
Search intent: ${b.intent}
Suggested H2: ${b.h2s || '(none – choose 4–6 H2s that match the search intent)'}
Questions (People also ask): ${b.questions || '(none – answer the 3–4 questions people most likely ask)'}
Calculator link: ${b.toolUrl}
Today: ${today.toISOString().slice(0, 10)}

Calendar:
${calendar()}`;
    return ask(systemFor(LANG), user);
  }
  const user = `Hauptkeyword: ${b.keyword}
Nebenkeywords (je einmal natürlich verwenden): ${b.secondary.join(', ') || '-'}
Titel: ${b.title || '(selbst formulieren, siehe JSON-Feld title)'}
Suchintention: ${b.intent}
Vorgeschlagene H2: ${b.h2s || '(keine – wähle 4–6 H2 passend zur Suchintention)'}
Fragen (People also ask): ${b.questions || '(keine – beantworte die 3–4 naheliegendsten Fragen)'}
Rechner-Link: ${b.toolUrl}
Heute: ${WD[today.getUTCDay()]}, ${today.getUTCDate()}. ${MONTHS[today.getUTCMonth()]} ${today.getUTCFullYear()}

Kalender:
${calendar()}

Verbindliche Fakten (aus den getesteten Daten der Website – nur diese verwenden):
${factsFor(b, today)}`;
  return ask(SYSTEM_DE, user);
}

async function ask(system, user) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const j = JSON.parse((await res.json()).choices[0].message.content);
  if (!j.body || !j.description) throw new Error('OpenAI response missing body/description');
  return j;
}

const ALL_REPORTS = [];
const FIX_ROUNDS = Number(process.env.FIX_ROUNDS ?? 2);


// Drafts that still failed after the repair rounds get another repair on every later run (max STUCK_TRIES runs).
const STUCK_TRIES = 5;
async function retryStuck(report) {
  const trackFile = path.join(ROOT, 'content/autofix.json');
  const track = fs.existsSync(trackFile) ? JSON.parse(fs.readFileSync(trackFile, 'utf8')) : {};
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.md'))) {
    const file = path.join(OUT, f), src = fs.readFileSync(file, 'utf8');
    const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m || !/^reviewed: false$/m.test(m[1]) || !/^reviewer: reviewer$/m.test(m[1])) continue; // only bot drafts
    const key = `${LANG}/${f}`;
    if ((track[key] || 0) >= STUCK_TRIES) continue;
    track[key] = (track[key] || 0) + 1;
    const get = (k) => { const x = m[1].match(new RegExp(`^${k}: (.*)$`, 'm')); return x ? x[1] : ''; };
    const json = (k, d) => { try { return JSON.parse(get(k)); } catch { return d; } };
    const b = { keyword: json('keyword', ''), title: json('title', ''), tool: get('tool'), category: get('category'), secondary: json('secondary', []), intent: '', h2s: '', questions: '' };
    const ts = toolSlug(b.tool), cs = catSlug(b.category);
    if (!ts || !cs) continue;
    b.toolUrl = `/${LANG}/${ts}/`;
    const faq = [...m[1].matchAll(/  - q: (.*)\n    a: (.*)/g)].map((x) => ({ q: JSON.parse(x[1]), a: JSON.parse(x[2]) }));
    console.log(`retry stuck draft (${track[key]}/${STUCK_TRIES}): ${key}`);
    let out;
    try { out = await repair({ title: b.title, description: json('description', ''), body: m[2], faq }, b); } catch (err) { console.warn(`  retry failed: ${err.message}`); continue; }
    if (out.res.issues.length) { report.push({ title: out.res.title, slug: f.replace(/\.md$/, ''), w: 0, issues: out.res.issues, publish: false, url: `/${LANG}/${cs}/${f.replace(/\.md$/, '')}/` }); continue; }
    writeArticle(out.j, out.res, b, f.replace(/\.md$/, ''), get('date') || iso(today), true);
    delete track[key];
    report.push({ title: out.res.title, slug: f.replace(/\.md$/, ''), w: 0, issues: [], publish: true, url: `/${LANG}/${cs}/${f.replace(/\.md$/, '')}/` });
  }
  fs.writeFileSync(trackFile, JSON.stringify(track, null, 2) + '\n');
}

function writeArticle(j, res, b, slug, date, publish) {
  const faq = (j.faq || []).slice(0, 4);
  const fm = [
    '---', `title: ${JSON.stringify(res.title)}`, `description: ${JSON.stringify(res.desc)}`, `keyword: ${JSON.stringify(b.keyword)}`, `secondary: ${JSON.stringify(b.secondary)}`,
    `category: ${b.category}`, `tool: ${b.tool}`, `translationKey: ${slug}`, `date: ${date}`, `updated: ${iso(today)}`,
    // Without a human review nobody is named as reviewer (E-E-A-T honesty).
    'author: author', ...(publish ? [] : ['reviewer: reviewer']), `reviewed: ${publish}`,
    ...(faq.length ? ['faq:', ...faq.flatMap((x) => [`  - q: ${JSON.stringify(x.q)}`, `    a: ${JSON.stringify(x.a)}`])] : []),
    '---', '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, `${slug}.md`), fm + j.body.trim() + '\n');
}

async function runLang() {
  if (!fs.existsSync(QUEUE)) { console.warn(`no queue for ${LANG}`); return; }
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(DONE)) fs.writeFileSync(DONE, fs.readFileSync(QUEUE, 'utf8').split('\n')[0] + ',slug,published\n');
  const rows = parseCSV(fs.readFileSync(QUEUE, 'utf8'));
  const header = rows.shift();
  const col = (r, name) => r[header.indexOf(name)] || '';
  const existing = new Set(fs.readdirSync(OUT).map((f) => f.replace(/\.md$/, '')));
  const used = [], report = [];
  if (!DRY && AUTO) await retryStuck(report);
  for (const r of rows) {
    if (used.length >= COUNT) break;
    const b = { keyword: col(r, 'keyword'), title: col(r, 'title'), tool: col(r, 'tool'), category: col(r, 'category'), intent: col(r, 'intent'), h2s: col(r, 'h2s'), questions: col(r, 'questions'),
      secondary: col(r, 'secondary').split('|').map((x) => x.trim()).filter(Boolean) };
    const slug = slugify(b.keyword);
    const ts = toolSlug(b.tool), cs = catSlug(b.category);
    if (!ts || !cs) { console.warn(`skip (tool/category not available in ${LANG}): ${b.title}`); continue; }
    b.toolUrl = `/${LANG}/${ts}/`;
    if (existing.has(slug)) { console.warn(`skip (exists): ${slug}`); used.push({ r, slug }); continue; }
    console.log(`${DRY ? '[dry] ' : ''}draft: ${b.title || `[${b.keyword}]`} → /${LANG}/${cs}/${slug}/`);
    if (DRY) { used.push({ r, slug }); continue; }
    const j0 = await draft(b);
    const { j, res } = await repair(j0, b);
    const { issues, title, desc } = res;
    const publish = AUTO && !issues.length;
    writeArticle(j, res, b, slug, iso(today), publish);
    const w = j.body.split(/\s+/).filter(Boolean).length;
    report.push({ title, slug, w, issues, publish, url: `/${LANG}/${cs}/${slug}/` });
    used.push({ r, slug });
  }
  if (DRY) return;
  const remaining = rows.filter((r) => !used.some((u) => u.r === r));
  fs.writeFileSync(QUEUE, [header, ...remaining].map((r) => r.map(cell).join(',')).join('\n') + '\n');
  if (used.length) fs.appendFileSync(DONE, used.map((u) => [...u.r, u.slug, iso(today)].map(cell).join(',')).join('\n') + '\n');
  for (const r of report) ALL_REPORTS.push({ ...r, lang: LANG });
  console.log(`${LANG}: ${report.length} drafted, ${remaining.length} left in queue`);
}

async function main() {
  if (!KEY && !DRY) { console.error('OPENAI_API_KEY is not set'); process.exit(1); }
  if (!LANGS.length) { console.log('no live language with a queue'); return; }
  for (const l of LANGS) {
    LANG = l; QUEUE = path.join(ROOT, `content/queue-${l}.csv`); DONE = path.join(ROOT, `content/published-${l}.csv`); OUT = path.join(ROOT, 'src/content/articles', l);
    await runLang();
  }
  if (DRY) return;
  fs.writeFileSync(PR_BODY, ALL_REPORTS.length ? [
    `## ${ALL_REPORTS.length} guide draft(s)`, '',
    AUTO ? 'AUTO_PUBLISH is on: drafts without warnings are `reviewed: true` and go live; drafts with ⚠️ stay noindex until fixed.'
      : 'AI draft. **Native speaker review required.** Set `reviewed: true` before merging – otherwise the page stays noindex.', '',
    ...ALL_REPORTS.flatMap((r) => [`### [${r.lang}] ${r.title}`, `- File: \`src/content/articles/${r.lang}/${r.slug}.md\` (${r.w} words) · URL: \`${r.url}\`${r.publish ? ' · ✅ published' : ''}`,
      r.issues.length ? '- ⚠️ Automatic checks:\n' + r.issues.map((x) => `  - ${x}`).join('\n') : '- ✅ Automatic checks passed', '']),
    '### Checklist', '- [ ] First two sentences answer the question', '- [ ] All dates/weekdays checked with the calculators', '- [ ] No invented facts; laws only when correct', '- [ ] Natural native language', '- [ ] `reviewed: true` set', '',
  ].join('\n') : '');
  console.log(ALL_REPORTS.length ? `done: ${ALL_REPORTS.length}` : 'nothing new');
}
main().catch((e) => { console.error(e); process.exit(1); });
