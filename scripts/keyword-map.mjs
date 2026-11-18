// Writes docs/keyword-map.csv: every URL (live + planned) with its primary and secondary keywords.
// One primary keyword per URL; tests/content.test.ts fails the build if a keyword is used twice.
import fs from 'node:fs';
import path from 'node:path';
const TOOL = { worktime: 'arbeitszeitrechner', hours: 'stundenrechner', workdays: 'arbeitstage-rechner', wage: 'stundenlohnrechner', overtime: 'ueberstundenrechner', days: 'tage-rechner', age: 'alter-berechnen', week: 'kalenderwoche', minutes: 'minuten-in-stunden', timesheet: 'stundenzettel', notice: 'kuendigungsfrist-rechner', surcharge: 'zuschlagsrechner' };
const CAT = { work: 'arbeitszeit', pay: 'lohn-gehalt', dates: 'datum' };
const REG = { nw: 'nordrhein-westfalen', by: 'bayern', bw: 'baden-wuerttemberg', ni: 'niedersachsen', he: 'hessen' };
const rows = [['status', 'url', 'primary', 'secondary', 'type']];
for (const type of ['tools', 'regions', 'articles']) {
  const dir = path.join('src/content', type, 'de');
  for (const f of fs.readdirSync(dir)) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    const g = (k) => (new RegExp(`^${k}:\\s*"?(.*?)"?$`, 'm').exec(s) || [])[1] || '';
    const sec = ((/secondary:\s*\[(.*)\]/.exec(s) || [])[1] || '').replace(/"/g, '');
    const url = type === 'tools' ? `/de/${TOOL[g('tool')]}/` : type === 'regions' ? `/de/arbeitstage-rechner/${REG[g('region')]}/` : `/de/${CAT[g('category')]}/${f.replace('.md', '')}/`;
    rows.push([g('reviewed') === 'true' ? 'live' : 'needs review', url, g('keyword'), sec, type]);
  }
}
const q = fs.readFileSync('content/queue-de.csv', 'utf8').trim().split('\n').slice(1);
for (const line of q) { const kw = line.split(',')[0]; rows.push(['planned (queue)', '', kw, '', 'article']); }
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/keyword-map.csv', rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n');
console.log(`docs/keyword-map.csv: ${rows.length - 1} rows`);
