#!/usr/bin/env node
/**
 * Daily article drafts.
 * - Takes the next N topics from content/queue.csv
 * - Asks OpenAI for a Markdown article (JSON response) following the editorial rules
 * - Writes src/content/guides/<slug>.md, moves the topic to content/published.csv
 * - Runs automatic checks (weekday/date consistency, length, table, tool link, FAQ)
 *   and writes a review checklist to $PR_BODY (used as the pull-request description)
 *
 * It never publishes: the GitHub workflow opens a pull request that a human reviews and merges.
 *
 * Env: OPENAI_API_KEY (required), OPENAI_MODEL (default gpt-4.1-mini), ARTICLES_PER_RUN (default 2),
 *      PR_BODY (path for the review notes, default ./article-review.md), AUTHOR_NAME (optional)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const QUEUE = path.join(ROOT, 'content/queue.csv');
const DONE = path.join(ROOT, 'content/published.csv');
const OUT_DIR = path.join(ROOT, 'src/content/guides');
const RELEASE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/release.json'), 'utf8'));
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const COUNT = Number(process.env.ARTICLES_PER_RUN || 2);
const PR_BODY = process.env.PR_BODY || path.join(ROOT, 'article-review.md');
const CATEGORIES = ['Work', 'Holidays', 'Life', 'Time', 'Travel', 'Pregnancy', 'Calendar', 'School'];
const DRY = process.argv.includes('--dry-run');

/* ---------------- CSV (RFC 4180-ish) */
function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
const csvCell = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));

/* ---------------- dates (tiny copy of the engine, enough for checks and the reference calendar) */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const today = (() => { const n = new Date(); return utc(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate()); })();
const iso = (d) => d.toISOString().slice(0, 10);
const long = (d) => `${WD[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;

function calendarReference(months = 15) {
  const lines = [];
  for (let i = -1; i < months; i++) {
    const first = utc(today.getUTCFullYear(), today.getUTCMonth() + 1 + i, 1);
    const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    lines.push(`${MONTHS[first.getUTCMonth()]} ${first.getUTCFullYear()}: day 1 is a ${WD[first.getUTCDay()]}, ${days} days`);
  }
  return lines.join('\n');
}

/** Find "Weekday, Month D, YYYY" and "Weekday, D Month YYYY" in text and verify the weekday. */
function checkWeekdays(text) {
  const problems = [];
  const re1 = new RegExp(`(${WD.join('|')}),?\\s+(${MONTHS.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'g');
  const re2 = new RegExp(`(${WD.join('|')}),?\\s+(\\d{1,2})\\s+(${MONTHS.join('|')}),?\\s+(\\d{4})`, 'g');
  for (const m of text.matchAll(re1)) {
    const d = utc(+m[4], MONTHS.indexOf(m[2]) + 1, +m[3]);
    if (WD[d.getUTCDay()] !== m[1]) problems.push(`"${m[0]}" — that date is a ${WD[d.getUTCDay()]}`);
  }
  for (const m of text.matchAll(re2)) {
    const d = utc(+m[4], MONTHS.indexOf(m[3]) + 1, +m[2]);
    if (WD[d.getUTCDay()] !== m[1]) problems.push(`"${m[0]}" — that date is a ${WD[d.getUTCDay()]}`);
  }
  return problems;
}

/* ---------------- release check: only link tools that are live */
function expand(spec = []) {
  const out = new Set();
  for (const s of spec) {
    if (typeof s === 'number') out.add(s);
    else { const m = /^(\d+)-(\d+)$/.exec(s); if (m) for (let i = +m[1]; i <= +m[2]; i++) out.add(i); else out.add(String(s)); }
  }
  return out;
}
const HUBS = ['/days-from-today/', '/weeks-from-today/', '/days-until/', '/hours-from-now/', '/days-ago/', '/date-duration-calculator/', '/age-calculator/', '/countdown/'];
function liveToolUrl(url) {
  if (HUBS.includes(url)) return url;
  const m = /^\/([a-z-]+)\/([a-z0-9-]+)\/$/.exec(url || '');
  if (m && RELEASE[m[1]]) {
    const set = expand(RELEASE[m[1]]);
    if (set.has(Number(m[2])) || set.has(m[2])) return url;
    return `/${m[1]}/`; // fall back to the hub until that page is released
  }
  return '/days-from-today/';
}

const slugify = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-+$/, '');

/* ---------------- OpenAI */
const SYSTEM = `You write clear, accurate guides for a free date & time tools website used in the US, UK and Canada.
Rules (follow all of them):
1. Answer the search question directly in the first two sentences. No preamble like "In this article".
2. Include at least one worked example that uses real dates. Use ONLY the calendar reference provided to work out weekdays; double-check every weekday you write.
3. Include at least one Markdown table.
4. Link to the related tool at least once with a Markdown link to the exact URL given (a relative URL starting with /).
5. 800–1,500 words. No filler, no repetition, no generic padding.
6. Never invent facts, statistics, studies, quotes or laws. If a rule varies by country/state or changes over time, say so and tell the reader to check the official source. Do not give legal, medical or financial advice.
7. Use "##" for section headings (no "#" title — the title is added separately). End with a section "## FAQ" containing 3–4 questions as "### Question" followed by a short answer.
8. Write in plain American English, but mention UK/Canadian differences where relevant (e.g. date formats DD/MM/YYYY, bank holidays).
Return JSON: {"description": "<=155 characters meta description", "body": "<the Markdown article>"}`;

async function writeArticle(topic) {
  const user = `Keyword: ${topic.keyword}
Title: ${topic.title}
Related tool URL: ${topic.tool}
Category: ${topic.category}
Today's date: ${long(today)} (${iso(today)})

Calendar reference (use it for every weekday):
${calendarReference()}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  if (!parsed.body || !parsed.description) throw new Error('OpenAI response missing body/description');
  return parsed;
}

/* ---------------- main */
async function main() {
  if (!KEY && !DRY) { console.error('OPENAI_API_KEY is not set'); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(QUEUE, 'utf8'));
  const header = rows.shift();
  if (!rows.length) { console.log('Queue is empty — add topics to content/queue.csv'); fs.writeFileSync(PR_BODY, ''); return; }
  const existing = new Set(fs.readdirSync(OUT_DIR).map((f) => f.replace(/\.md$/, '')));
  const report = [];
  const used = [];
  let i = 0;
  while (used.length < COUNT && i < rows.length) {
    const [keyword, title, tool, category] = rows[i++];
    const slug = slugify(title);
    if (existing.has(slug)) { console.log(`skip (exists): ${slug}`); used.push({ row: [keyword, title, tool, category], slug, skipped: true }); continue; }
    const topic = { keyword, title, tool: liveToolUrl(tool), category: CATEGORIES.includes(category) ? category : 'Calendar' };
    console.log(`writing: ${title}`);
    if (DRY) { used.push({ row: [keyword, title, tool, category], slug, skipped: true }); continue; }
    const { description, body } = await writeArticle(topic);
    const author = process.env.AUTHOR_NAME ? `\nauthor: ${JSON.stringify(process.env.AUTHOR_NAME)}` : '';
    const md = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description.slice(0, 200))}
date: ${iso(today)}${author}
category: ${topic.category}
relatedTools: [${JSON.stringify(topic.tool)}]
draft: false
---

${body.trim()}
`;
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), md);
    // automatic checks for the reviewer
    const words = body.split(/\s+/).filter(Boolean).length;
    const issues = [];
    if (words < 800 || words > 1600) issues.push(`Length is ${words} words (target 800–1,500).`);
    if (!/\n\|.*\|\n\|\s*:?-{3}/.test(body)) issues.push('No Markdown table found.');
    if (!body.includes(`](${topic.tool}`)) issues.push(`No link to the related tool ${topic.tool}.`);
    if (!/^##\s*FAQ/im.test(body)) issues.push('No "## FAQ" section.');
    if (/\b(\d{1,3}(\.\d+)?%|studies show|according to (a|one) (study|survey))/i.test(body)) issues.push('Contains a percentage or study claim — verify the source or remove it.');
    for (const p of checkWeekdays(body)) issues.push(`Weekday mismatch: ${p}`);
    report.push({ title, slug, words, tool: topic.tool, issues });
    used.push({ row: [keyword, title, tool, category], slug });
  }
  // move used rows from queue → published
  const remaining = rows.filter((r) => !used.some((u) => u.row[1] === r[1]));
  if (DRY) { console.log(`dry run: would use ${used.length} topic(s); queue unchanged`); return; }
  fs.writeFileSync(QUEUE, [header, ...remaining].map((r) => r.map(csvCell).join(',')).join('\n') + '\n');
  const doneRows = used.filter((u) => !u.skipped || existing.has(u.slug)).map((u) => [...u.row, u.slug, iso(today)].map(csvCell).join(','));
  if (doneRows.length && !DRY) fs.appendFileSync(DONE, doneRows.join('\n') + '\n');

  const body = [
    `## ${report.length} new guide draft${report.length === 1 ? '' : 's'} for review`,
    '',
    'These were drafted by AI. **Please review before merging — merging publishes them.**',
    '',
    ...report.flatMap((r) => [
      `### ${r.title}`,
      `- File: \`src/content/guides/${r.slug}.md\` (${r.words} words) · tool: \`${r.tool}\``,
      r.issues.length ? '- ⚠️ Automatic checks:\n' + r.issues.map((x) => `  - ${x}`).join('\n') : '- ✅ Automatic checks passed',
      '',
    ]),
    '### Reviewer checklist',
    '- [ ] The first two sentences answer the question',
    '- [ ] Every date and weekday in the worked example is correct (check with the site’s calculators)',
    '- [ ] No invented facts, statistics or legal/medical claims',
    '- [ ] Links work and point to a live tool',
    '- [ ] Reads naturally, no filler',
    '',
    `Topics left in the queue: ${remaining.length}`,
  ].join('\n');
  fs.writeFileSync(PR_BODY, report.length ? body : '');
  console.log(report.length ? `done: ${report.length} article(s)` : 'no new articles');
}

main().catch((e) => { console.error(e); process.exit(1); });
