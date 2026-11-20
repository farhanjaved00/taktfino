/**
 * Yearly rollover of the German Bundesland pages (src/content/regions/de/workdays-*.md):
 * "2026/2027" → "<this year>/<next year>". OpenAI rewrites the year-specific parts using numbers computed
 * from the tested holiday rules; a page is only replaced if it passes checkFacts. Run with tsx.
 */
import fs from 'node:fs';
import path from 'node:path';
import { holidaysFor } from '../src/tools/holiday-rules.ts';
import { checkFacts } from './lib/facts.ts';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIR = path.join(ROOT, 'src/content/regions/de');
const KEY = process.env.OPENAI_API_KEY, MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const Y = Number(process.env.ROLL_YEAR || new Date().getUTCFullYear()), Y2 = Y + 1;
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function facts(region) {
  return [Y, Y2].map((y) => {
    const all = holidaysFor(region, y);
    const off = new Set(all.filter((h) => !h.partial || h.defaultOn).map((h) => h.date));
    let wd = 0;
    for (let t = Date.UTC(y, 0, 1); t <= Date.UTC(y, 11, 31); t += 864e5) { const x = new Date(t), g = x.getUTCDay(); if (g && g < 6 && !off.has(x.toISOString().slice(0, 10))) wd++; }
    const r = { workdays: wd };
    const hol = all.map((h) => `${h.name}: ${h.date} (${WD[new Date(h.date + 'T00:00:00Z').getUTCDay()]})${h.partial ? ' – nur teilweise' + (h.note ? `, ${h.note}` : '') : ''}`);
    return `${y}: ${r.workdays} Arbeitstage bei Mo–Fr (Standard-Einstellung des Rechners).\nFeiertage ${y}:\n- ${hol.join('\n- ')}`;
  }).join('\n\n');
}

async function ask(content) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [
      { role: 'system', content: 'Du aktualisierst deutsche Markdown-Seiten über Feiertage und Arbeitstage. Antworte nur mit der vollständigen Datei (Frontmatter + Text), ohne Codeblock.' },
      { role: 'user', content } ] }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  return (await res.json()).choices[0].message.content.trim().replace(/^```\w*\n|\n```$/g, '') + '\n';
}

let changed = 0, failed = [];
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const file = path.join(DIR, f), src = fs.readFileSync(file, 'utf8');
  if (src.includes(`${Y}/${Y2}`)) continue;
  const region = src.match(/^region: (\w+)/m)[1];
  const prompt = `Aktualisiere diese Seite von den bisherigen Jahren auf ${Y}/${Y2}.
Regeln: Struktur, Frontmatter-Felder, Links und Tonfall bleiben gleich. Ersetze alle jahresbezogenen Angaben (Titel, Beschreibung, answer, secondary-Keywords, FAQ, Text) durch ${Y} und ${Y2}. Verwende ausschließlich diese getesteten Fakten, erfinde nichts. Setze updated: ${new Date().toISOString().slice(0, 10)}. Der Titel endet mit "${Y}/${Y2}".

Fakten:
${facts(region)}

Datei:
${src}`;
  let out = '', problems = ['not tried'];
  for (let i = 0; i < 3 && problems.length; i++) {
    try {
      out = await ask(i ? `${prompt}\n\nDein letzter Versuch hatte diese Fehler, korrigiere sie:\n- ${problems.join('\n- ')}` : prompt);
      const kw = out.match(/^keyword: "?(.*?)"?$/m)?.[1], title = out.match(/^title: "?(.*?)"?$/m)?.[1];
      problems = [];
      if (!out.startsWith('---\n') || !kw || !title) problems.push('Frontmatter kaputt');
      else if (!title.includes(`${Y}/${Y2}`)) problems.push(`Titel ohne ${Y}/${Y2}`);
      else if (!new RegExp(`^region: ${region}$`, 'm').test(out)) problems.push('region-Feld fehlt');
      else problems.push(...checkFacts(out.split(/^---$/m).slice(2).join('---'), { keyword: kw, title }));
    } catch (e) { problems = [e.message]; }
  }
  if (problems.length) { failed.push(`${f}: ${problems.join('; ')}`); continue; }
  fs.writeFileSync(file, out); changed++;
  console.log(`rolled ${f} → ${Y}/${Y2}`);
}
console.log(`${changed} updated, ${failed.length} kept old`);
if (failed.length) console.log(failed.join('\n'));
