#!/usr/bin/env node
/**
 * Article drafts (plan §12): brief → AI draft in the target language → PULL REQUEST → native review → merge.
 * Never publishes: drafts are written with `reviewed: false` (noindex, not in sitemap) and opened as a PR.
 *
 *   node scripts/generate-articles.mjs            next N briefs from content/queue-de.csv
 *   node scripts/generate-articles.mjs --dry-run  show what would be written
 * Env: OPENAI_API_KEY, OPENAI_MODEL (default gpt-4.1), ARTICLES_PER_RUN (default 1), LANG_CODE (default de), PR_BODY
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LANG = process.env.LANG_CODE || 'de';
const QUEUE = path.join(ROOT, `content/queue-${LANG}.csv`);
const DONE = path.join(ROOT, `content/published-${LANG}.csv`);
const OUT = path.join(ROOT, 'src/content/articles', LANG);
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const COUNT = Number(process.env.ARTICLES_PER_RUN || 1);
const PR_BODY = process.env.PR_BODY || path.join(ROOT, 'article-review.md');
const DRY = process.argv.includes('--dry-run');
const TOOL_SLUG = { worktime: 'arbeitszeitrechner', hours: 'stundenrechner', workdays: 'arbeitstage-rechner', wage: 'stundenlohnrechner', overtime: 'ueberstundenrechner', days: 'tage-rechner', age: 'alter-berechnen', week: 'kalenderwoche', minutes: 'minuten-in-stunden', timesheet: 'stundenzettel', notice: 'kuendigungsfrist-rechner', surcharge: 'zuschlagsrechner', maternity: 'mutterschutz-rechner' };
const CAT_SLUG = { work: 'arbeitszeit', pay: 'lohn-gehalt', dates: 'datum' };

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
const slugify = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-+$/, '');

/* dates for the reference calendar and the weekday check */
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const iso = (d) => d.toISOString().slice(0, 10);
function calendar() {
  const out = [];
  for (let i = -1; i < 15; i++) {
    const f = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1));
    out.push(`${MONTHS[f.getUTCMonth()]} ${f.getUTCFullYear()}: der 1. ist ein ${WD[f.getUTCDay()]}, ${new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate()} Tage`);
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

const SYSTEM = `Du schreibst Ratgeber für eine kostenlose Rechner-Website (Arbeitszeit, Stunden, Arbeitstage, Lohn) für Deutschland, Österreich und die Schweiz.
Regeln – alle einhalten:
1. Beantworte die Suchfrage in den ersten zwei Sätzen. Keine Einleitung wie „In diesem Artikel“.
2. Verlinke den Rechner (relative URL, genau wie angegeben) innerhalb der ersten 100 Wörter als Markdown-Link.
3. Mindestens ein Rechenbeispiel mit echten Daten. Wochentage NUR aus dem Kalender unten ableiten und doppelt prüfen.
4. Mindestens eine Markdown-Tabelle.
5. Gliederung mit "##"-Überschriften (keine "#"-Überschrift; der Titel wird separat gesetzt). Nutze die vorgegebenen H2 als Leitfaden.
6. 700–1.200 Wörter. Kein Fülltext, keine Wiederholungen.
7. Erfinde NIE Fakten, Zahlen, Studien, Zitate oder Urteile. Nenne Paragraphen nur, wenn du sicher bist. Wo Regeln je nach Land, Bundesland, Tarifvertrag abweichen, sage das. Keine Rechtsberatung.
8. Deutsch in natürlicher, sachlicher Sprache (Sie-Form). Österreich/Schweiz erwähnen, wenn relevant.
Antworte als JSON: {"description": "Meta-Beschreibung ≤ 150 Zeichen", "body": "Markdown-Artikel", "faq": [{"q": "...", "a": "..."}] (3–4 Fragen, kurz)}`;

async function draft(b) {
  const user = `Hauptkeyword: ${b.keyword}
Titel: ${b.title}
Suchintention: ${b.intent}
Vorgeschlagene H2: ${b.h2s}
Fragen (People also ask): ${b.questions}
Rechner-Link: ${b.toolUrl}
Heute: ${WD[today.getUTCDay()]}, ${today.getUTCDate()}. ${MONTHS[today.getUTCMonth()]} ${today.getUTCFullYear()}

Kalender:
${calendar()}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const j = JSON.parse((await res.json()).choices[0].message.content);
  if (!j.body || !j.description) throw new Error('OpenAI response missing body/description');
  return j;
}

async function main() {
  if (!KEY && !DRY) { console.error('OPENAI_API_KEY is not set'); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(QUEUE, 'utf8'));
  const header = rows.shift();
  const col = (r, name) => r[header.indexOf(name)] || '';
  const existing = new Set(fs.readdirSync(OUT).map((f) => f.replace(/\.md$/, '')));
  const used = [], report = [];
  for (const r of rows) {
    if (used.length >= COUNT) break;
    const b = { keyword: col(r, 'keyword'), title: col(r, 'title'), tool: col(r, 'tool'), category: col(r, 'category'), intent: col(r, 'intent'), h2s: col(r, 'h2s'), questions: col(r, 'questions') };
    const slug = slugify(b.keyword);
    b.toolUrl = `/${LANG}/${TOOL_SLUG[b.tool]}/`;
    if (!TOOL_SLUG[b.tool] || !CAT_SLUG[b.category]) { console.warn(`skip (bad tool/category): ${b.title}`); continue; }
    if (existing.has(slug)) { console.warn(`skip (exists): ${slug}`); used.push({ r, slug }); continue; }
    console.log(`${DRY ? '[dry] ' : ''}draft: ${b.title} → /${LANG}/${CAT_SLUG[b.category]}/${slug}/`);
    if (DRY) { used.push({ r, slug }); continue; }
    const j = await draft(b);
    const issues = [];
    const title = b.title.length > 60 ? (issues.push(`Titel hat ${b.title.length} Zeichen (max. 60) – gekürzt.`), b.title.slice(0, 60)) : b.title;
    const desc = j.description.length > 155 ? (issues.push('Beschreibung gekürzt (max. 155).'), j.description.slice(0, 152) + '…') : j.description;
    const faq = (j.faq || []).slice(0, 4);
    const fm = [
      '---', `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(desc)}`, `keyword: ${JSON.stringify(b.keyword)}`, 'secondary: []',
      `category: ${b.category}`, `tool: ${b.tool}`, `translationKey: ${slug}`, `date: ${iso(today)}`, `updated: ${iso(today)}`,
      'author: author', 'reviewer: reviewer', 'reviewed: false',
      ...(faq.length ? ['faq:', ...faq.flatMap((x) => [`  - q: ${JSON.stringify(x.q)}`, `    a: ${JSON.stringify(x.a)}`])] : []),
      '---', '',
    ].join('\n');
    fs.writeFileSync(path.join(OUT, `${slug}.md`), fm + j.body.trim() + '\n');
    const w = j.body.split(/\s+/).filter(Boolean).length;
    if (w < 700 || w > 1300) issues.push(`Länge ${w} Wörter (Ziel 700–1.200).`);
    if (!/\n\|.*\|\n\|\s*:?-{3}/.test(j.body)) issues.push('Keine Tabelle gefunden.');
    if (!j.body.split(/\s+/).slice(0, 100).join(' ').includes(b.toolUrl)) issues.push(`Rechner-Link ${b.toolUrl} fehlt in den ersten 100 Wörtern.`);
    if (/\b\d{1,3}(,\d+)?\s?%|Studie|laut einer Umfrage|Urteil vom/i.test(j.body)) issues.push('Enthält Prozentzahlen, Studien oder Urteile – Quelle prüfen oder entfernen.');
    for (const p of weekdayProblems(j.body)) issues.push(`Wochentag falsch: ${p}`);
    report.push({ title, slug, w, issues, url: `/${LANG}/${CAT_SLUG[b.category]}/${slug}/` });
    used.push({ r, slug });
  }
  if (DRY) return;
  const remaining = rows.filter((r) => !used.some((u) => u.r === r));
  fs.writeFileSync(QUEUE, [header, ...remaining].map((r) => r.map(cell).join(',')).join('\n') + '\n');
  if (used.length) fs.appendFileSync(DONE, used.map((u) => [...u.r, u.slug, iso(today)].map(cell).join(',')).join('\n') + '\n');
  fs.writeFileSync(PR_BODY, report.length ? [
    `## ${report.length} Ratgeber-Entwurf/Entwürfe zur Prüfung`, '',
    'KI-Entwurf. **Bitte von einem Muttersprachler prüfen.** Erst `reviewed: true` setzen, dann mergen – sonst bleibt die Seite noindex.', '',
    ...report.flatMap((r) => [`### ${r.title}`, `- Datei: \`src/content/articles/${LANG}/${r.slug}.md\` (${r.w} Wörter) · URL: \`${r.url}\``,
      r.issues.length ? '- ⚠️ Automatische Prüfung:\n' + r.issues.map((x) => `  - ${x}`).join('\n') : '- ✅ Automatische Prüfung bestanden', '']),
    '### Checkliste', '- [ ] Erste zwei Sätze beantworten die Frage', '- [ ] Alle Daten/Wochentage mit den Rechnern geprüft', '- [ ] Keine erfundenen Fakten, Paragraphen nur wenn korrekt', '- [ ] Natürliches Deutsch', '- [ ] `secondary` Keywords ergänzt (aus Semrush)', '- [ ] `reviewed: true` gesetzt', '',
    `Noch in der Warteschlange: ${remaining.length}`,
  ].join('\n') : '');
  console.log(report.length ? `done: ${report.length}` : 'nothing new');
}
main().catch((e) => { console.error(e); process.exit(1); });
