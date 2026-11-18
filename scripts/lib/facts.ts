/**
 * Verified facts for AI drafts, taken from the site's own TESTED data (holiday rules, minimum wage, ISO weeks) —
 * never from the model's memory. Used twice:
 *   factsFor()   → a "binding facts" block that goes into the prompt
 *   checkFacts() → compares every holiday date, weekday, Bundesland list, holiday count, minimum wage and
 *                  week count in a finished article against the same data; any mismatch is an issue
 *                  (with AUTO_PUBLISH the article then stays noindex).
 * German content only for now (the only market with coded rules).
 */
import { holidaysFor, DE_REGIONS, type HolidayEntry } from '../../src/tools/holiday-rules';
import { weeksInYear } from '../../src/tools/week';
import wage from '../../src/data/minimum-wage.json' with { type: 'json' };

export const LAND: Record<string, string> = {
  bw: 'Baden-Württemberg', by: 'Bayern', be: 'Berlin', bb: 'Brandenburg', hb: 'Bremen', hh: 'Hamburg', he: 'Hessen',
  mv: 'Mecklenburg-Vorpommern', ni: 'Niedersachsen', nw: 'Nordrhein-Westfalen', rp: 'Rheinland-Pfalz', sl: 'Saarland',
  sn: 'Sachsen', st: 'Sachsen-Anhalt', sh: 'Schleswig-Holstein', th: 'Thüringen',
};
/** Abbreviations as used in German texts (NW and NRW both mean Nordrhein-Westfalen) */
const ABBR: Record<string, string> = { BW: 'bw', BY: 'by', BE: 'be', BB: 'bb', HB: 'hb', HH: 'hh', HE: 'he', MV: 'mv', NI: 'ni', NW: 'nw', NRW: 'nw', RP: 'rp', SL: 'sl', SN: 'sn', ST: 'st', SH: 'sh', TH: 'th' };
const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const wdOf = (iso: string) => WD[new Date(iso + 'T00:00:00Z').getUTCDay()];
const de = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d}.${m}.${y}`; };

/** Other names writers use for the same holiday */
const ALIASES: Record<string, string[]> = {
  'tag-der-arbeit': ['Tag der Arbeit', 'Maifeiertag', '1. Mai'],
  'weihnachten-1': ['1. Weihnachtstag', 'Erster Weihnachtstag', '1. Weihnachtsfeiertag', 'Erster Weihnachtsfeiertag'],
  'weihnachten-2': ['2. Weihnachtstag', 'Zweiter Weihnachtstag', '2. Weihnachtsfeiertag', 'Zweiter Weihnachtsfeiertag'],
  'christi-himmelfahrt': ['Christi Himmelfahrt'],
  'heilige-drei-koenige': ['Heilige Drei Könige', 'Dreikönigstag', 'Epiphanias'],
  'buss-und-bettag': ['Buß- und Bettag', 'Buss- und Bettag'],
  'frauentag': ['Internationaler Frauentag', 'Frauentag'],
  'weltkindertag': ['Weltkindertag'],
};

export interface DeHoliday { key: string; name: string; date: string; full: string[]; partial: { land: string; note?: string }[] }

/** Every German holiday of a year with the Länder where it applies (full) and where only in parts (partial). */
export function deHolidays(year: number): DeHoliday[] {
  const map = new Map<string, DeHoliday>();
  for (const r of DE_REGIONS) for (const h of holidaysFor(r, year) as HolidayEntry[]) {
    const e = map.get(h.key) ?? { key: h.key, name: h.name, date: h.date, full: [], partial: [] };
    if (h.partial) e.partial.push({ land: r, note: h.note }); else e.full.push(r);
    map.set(h.key, e);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
/** Count of statutory holidays per Land (full ones; partial ones listed separately) */
export function countsPerLand(year: number) {
  return Object.fromEntries(DE_REGIONS.map((r) => {
    const all = holidaysFor(r, year) as HolidayEntry[];
    return [r, { full: all.filter((h) => !h.partial).length, withPartial: all.length, withDefault: all.filter((h) => !h.partial || h.defaultOn).length }];
  })) as Record<string, { full: number; withPartial: number; withDefault: number }>;
}
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const dow = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay();
/** Free days around a holiday for someone working Mon–Fri: expands over weekends and nationwide holidays.
 *  `bridge` = the same block when one vacation day is taken on the Friday after a Thursday / the Monday before a Tuesday. */
export function freeBlocks(year: number) {
  const hs = deHolidays(year);
  const off = new Set(hs.filter((h) => h.full.length === 16).map((h) => h.date));
  const block = (from: string, to: string, extra: Set<string>) => {
    const free = (d: string) => dow(d) === 0 || dow(d) === 6 || off.has(d) || extra.has(d);
    while (free(addDays(from, -1))) from = addDays(from, -1);
    while (free(addDays(to, 1))) to = addDays(to, 1);
    return { from, to, days: Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1 };
  };
  return hs.map((h) => {
    const own = new Set([h.date]);
    const plain = block(h.date, h.date, own);
    const b = dow(h.date) === 4 ? addDays(h.date, 1) : dow(h.date) === 2 ? addDays(h.date, -1) : null;
    const bridge = b ? { ...block(h.date < b ? h.date : b, h.date < b ? b : h.date, new Set([h.date, b])), day: b } : null;
    return { key: h.key, name: h.name, date: h.date, plain, bridge };
  });
}
const span = (b: { from: string; to: string; days: number }) => `${de(b.from).replace(/\.\d{4}$/, '.')}–${de(b.to)} (${b.days} ${b.days === 1 ? 'Tag' : 'Tage'})`;

const namesOf = (h: { key: string; name: string }) => [h.name, ...(ALIASES[h.key] || [])];
const minWage = (y: number) => [...wage.DE.rates].reverse().find((r) => r.from <= `${y}-12-31`)?.hourly;

/* ------------------------------------------------------------------ prompt block */
export function yearsOf(text: string, today = new Date()): number[] {
  const ys = [...new Set([...text.matchAll(/\b(20[2-4]\d)\b/g)].map((m) => +m[1]))];
  return ys.length ? ys.sort() : [today.getUTCFullYear(), today.getUTCFullYear() + 1];
}

export function factsFor(brief: { keyword: string; title: string; tool: string; h2s?: string; questions?: string }, today = new Date()): string {
  const text = `${brief.keyword} ${brief.title} ${brief.h2s || ''} ${brief.questions || ''}`;
  const years = yearsOf(text, today);
  const out: string[] = [];
  for (const y of years) {
    out.push(`Jahr ${y}: ${new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1 ? 366 : 365} Tage, ${weeksInYear(y)} ISO-Kalenderwochen. Gesetzlicher Mindestlohn Deutschland ab 1.1.${y}: ${minWage(y)?.toFixed(2).replace('.', ',')} € pro Stunde. Österreich und Schweiz: kein allgemeiner gesetzlicher Mindestlohn.`);
  }
  const holidayTopic = /feiertag|brückentag|urlaub|arbeitstag|kalender|frei/i.test(text) || ['workdays', 'vacation', 'surcharge'].includes(brief.tool);
  if (holidayTopic) for (const y of years) {
    const hs = deHolidays(y);
    out.push(`\nFeiertage Deutschland ${y} (bundesweit = alle 16 Länder):`);
    for (const h of hs) {
      const where = h.full.length === 16 ? 'bundesweit' : h.full.map((r) => r.toUpperCase()).join(', ');
      const part = h.partial.map((p) => `${p.land.toUpperCase()} nur teilweise (${p.note})`).join('; ');
      out.push(`- ${h.name}: ${de(h.date)} (${wdOf(h.date)}) – ${where}${part ? `; ${part}` : ''}`);
    }
    out.push(`Bundesweit gelten genau ${hs.filter((h) => h.full.length === 16).length} Feiertage.`);
    out.push(`Freie Zeiträume ${y} bei einer Fünf-Tage-Woche (Mo–Fr), nur diese Spannen verwenden:`);
    for (const f of freeBlocks(y)) {
      if (dow(f.date) === 0 || dow(f.date) === 6) { out.push(`- ${f.name}: fällt auf ${wdOf(f.date)} – kein zusätzlicher freier Tag, kein Brückentag`); continue; }
      out.push(`- ${f.name}: ohne Urlaub ${span(f.plain)}${f.bridge ? `; mit Brückentag ${wdOf(f.bridge.day)} ${de(f.bridge.day)}: ${span(f.bridge)}` : ''}`);
    }
    const c = countsPerLand(y);
    out.push(`Anzahl gesetzlicher Feiertage ${y} je Land (ohne nur teilweise geltende; Brandenburg inkl. Ostersonntag und Pfingstsonntag): ${Object.entries(c).map(([r, n]) => `${LAND[r]} ${n.full}`).join(', ')}.`);
    out.push(`Österreich ${y} (bundesweit): ${(holidaysFor('at', y) as HolidayEntry[]).map((h) => `${h.name} ${de(h.date)} (${wdOf(h.date)})`).join(', ')}. Karfreitag ist in Österreich seit 2019 kein allgemeiner Feiertag.`);
    out.push(`Schweiz ${y}: Einziger bundesweiter Feiertag ist die Bundesfeier am 1.8. (${wdOf(`${y}-08-01`)}); alle anderen Feiertage regeln die Kantone. Beispiel Kanton Zürich: ${(holidaysFor('ch-zh', y) as HolidayEntry[]).map((h) => `${h.name} ${de(h.date)}`).join(', ')}.`);
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ checker */
const DATE_RE = new RegExp(`\\b(\\d{1,2})\\.\\s?(?:(\\d{1,2})\\.\\s?(\\d{4})?|(${MONTHS.join('|')})\\b(?:\\s+(\\d{4}))?)`, 'g');
const DATE_RE_ONE = new RegExp(DATE_RE.source);
const MON_ABBR = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const monthNo = (t?: string) => { if (!t) return 0; if (/^\d+$/.test(t)) return +t; const i = MON_ABBR.findIndex((m) => t.startsWith(m)); return i + 1; };
const RANGE_RE = /(\d{1,2})\.\s?(?:(\d{1,2})\.|((?:Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)[a-zä]*\.?))?\s?(?:–|-|bis)\s?(\d{1,2})\.\s?(?:(\d{1,2})\.|((?:Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)[a-zä]*\.?))/g;
/** "6.–9. Mai", "27.–30.5.2027", "28. März – 1. April" → ISO from/to (single year assumed) */
function rangesIn(line: string, year: number) {
  const out: { from: string; to: string }[] = [];
  for (const m of line.matchAll(RANGE_RE)) {
    const m2 = monthNo(m[5] || m[6]); const m1 = monthNo(m[2] || m[3]) || m2;
    if (!m1 || !m2 || m1 > 12 || m2 > 12) continue;
    const iso = (mo: number, d: string) => `${year}-${String(mo).padStart(2, '0')}-${d.padStart(2, '0')}`;
    out.push({ from: iso(m1, m[1]), to: iso(m2, m[4]) });
  }
  return out;
}
function datesIn(line: string, defaultYear?: number): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(DATE_RE)) {
    const d = +m[1]; const mo = m[2] ? +m[2] : MONTHS.indexOf(m[4]) + 1; const y = +(m[3] || m[5] || defaultYear || 0);
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    if (m[2] && !m[3] && !defaultYear) continue;
    out.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return out;
}
function landsIn(cell: string): { all: Set<string>; partial: Set<string> } {
  const all = new Set<string>(), partial = new Set<string>();
  for (const m of cell.matchAll(/(teilw(?:\.|eise)?\s*)?\b(NRW|BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)\b(\s*\(?teilw)?/g)) {
    const r = ABBR[m[2]]; all.add(r); if (m[1] || m[3]) partial.add(r);
  }
  for (const [r, name] of Object.entries(LAND)) if (new RegExp(`(^|[^-\\wäöüÄÖÜ])${name}(?![-\\wäöü])`).test(cell)) all.add(r);
  return { all, partial };
}

/** Returns human-readable problems. Empty = every checkable fact matches the data. */
export function checkFacts(body: string, brief: { keyword: string; title: string }): string[] {
  const years = yearsOf(`${brief.keyword} ${brief.title}`);
  const single = years.length === 1 ? years[0] : undefined;
  const issues: string[] = [];
  const hol = new Map(years.map((y) => [y, deHolidays(y)]));
  const allNames = [...new Set([...hol.values()].flat().flatMap(namesOf))].sort((a, b) => b.length - a.length);
  const findHolidays = (line: string) => {
    let rest = line; const found: string[] = [];
    for (const n of allNames) if (rest.includes(n)) { found.push(n); rest = rest.split(n).join(' '); }
    return found;
  };
  const byName = (n: string, y: number) => hol.get(y)?.find((h) => namesOf(h).includes(n));
  let header = '', section = '';
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) { header = ''; continue; }
    if (line.startsWith('#')) { section = line; header = ''; continue; }
    const isRow = line.startsWith('|');
    if (isRow && /^\|[\s:|-]+\|$/.test(line)) continue;
    if (isRow && !header) { header = line; continue; }
    const cells = isRow ? line.split('|').slice(1, -1).map((c) => c.trim()) : [line];
    const dates = datesIn(line, single);
    const names = findHolidays(line);
    const short = line.slice(0, 90);

    // 1. holiday date (only when the line is about exactly one holiday, so lists of several cannot mis-pair)
    // (other dates in the same line – e.g. the bridge day after a holiday – are fine as long as the right one is there)
    if (names.length === 1 && dates.length && !(single && rangesIn(line, single).length)) {
      const hs = dates.map((d) => byName(names[0], +d.slice(0, 4))).filter(Boolean) as DeHoliday[];
      if (hs.length && !dates.some((d) => hs.some((h) => h.date === d)) && !/(Ostersonntag|Pfingstsonntag)/.test(line) && !/\b(nach|vor|vom|bis|zwischen|danach|davor|Brückentag\w*|Urlaubstag\w*)\b/i.test(line))
        issues.push(`Datum falsch: „${names[0]}“ ist ${de(hs[0].date)}, nicht ${dates.map(de).join(' / ')} – „${short}“`);
    }
    // 1b. a "free from – to" span next to a holiday must be one of the computed blocks
    if (single) for (const r of rangesIn(line, single)) {
      const keys = names.flatMap((n) => hol.get(single)!.filter((h) => namesOf(h).includes(n)).map((h) => h.key));
      if (/\bOstern\b/.test(line)) keys.push('karfreitag', 'ostermontag');
      if (!keys.length || /\d+\s+Urlaubstage/.test(line)) continue;
      const blocks = freeBlocks(single).filter((f) => keys.includes(f.key)).flatMap((f) => [f.plain, ...(f.bridge ? [f.bridge] : [])]);
      if (!blocks.some((b) => b.from === r.from && b.to === r.to))
        issues.push(`Zeitraum falsch: ${de(r.from)}–${de(r.to)} passt nicht; richtig ${[...new Set(blocks.map(span))].join(' oder ')} – „${short}“`);
    }
    // 2. weekday next to a date (tables: same row)
    const wds = WD.filter((w) => new RegExp(`\\b${w}\\b`).test(line));
    const near = isRow || (wds.length === 1 && Math.abs(line.search(new RegExp(`\\b${wds[0]}\\b`)) - line.search(DATE_RE_ONE)) < 30);
    if (near && dates.length === 1 && wds.length === 1 && wdOf(dates[0]) !== wds[0]) issues.push(`Wochentag falsch: ${de(dates[0])} ist ${wdOf(dates[0])}, nicht ${wds[0]} – „${short}“`);
    // 3. which Länder a holiday applies in
    if (names.length === 1 && single) {
      const h = byName(names[0], single);
      const { all, partial } = landsIn(isRow ? cells.slice(1).join(' ') : line.replace(names[0], ''));
      if (h && all.size >= 2 && h.full.length < 16) {
        const p = new Set(h.partial.map((x) => x.land));
        const missing = h.full.filter((r) => !all.has(r) && !/(u\. ?a\.|unter anderem|z\. ?B\.|etwa|beispielsweise)/.test(line));
        const wrong = [...all].filter((r) => !h.full.includes(r) && !p.has(r));
        const notPartial = [...partial].filter((r) => h.full.includes(r) && !p.has(r));
        if (missing.length) issues.push(`${h.name}: es fehlen ${missing.map((r) => r.toUpperCase()).join(', ')} – „${short}“`);
        if (wrong.length) issues.push(`${h.name} ist kein Feiertag in ${wrong.map((r) => r.toUpperCase()).join(', ')} – „${short}“`);
        if (notPartial.length) issues.push(`${h.name} gilt in ${notPartial.map((r) => r.toUpperCase()).join(', ')} landesweit, nicht nur teilweise`);
      }
      if (h && h.full.length === 16 && /\b(nur|lediglich)\b.*\b(in|im)\b/.test(line)) issues.push(`${h.name} ist bundesweit – „${short}“`);
    }
    // 3b. a regional holiday listed in a "nationwide" table/section
    if (isRow && single && names.length === 1 && /bundesweit|bundeseinheitlich|alle(n)? (16 )?Bundesländer/i.test(section)) {
      const h = byName(names[0], single);
      if (h && h.full.length < 16) issues.push(`${h.name} steht in einer Tabelle bundesweiter Feiertage, gilt aber nur in ${h.full.map((r) => r.toUpperCase()).join(', ') || 'Teilen einzelner Länder'}`);
    }
    // 4. holiday count per Land in a table about counts
    if (isRow && single && /anzahl|feiertage/i.test(header)) {
      const { all } = landsIn(cells[0]);
      const num = cells.slice(1).map((c) => c.match(/^(\d{1,2})\b/)).find(Boolean);
      if (all.size === 1 && num) {
        const r = [...all][0]; const c = countsPerLand(single)[r]; const n = +num[1];
        if (![c.full, c.withDefault, c.withPartial].includes(n)) issues.push(`${LAND[r]} hat ${single} ${c.full} Feiertage${c.withPartial !== c.full ? ` (mit nur teilweise geltenden ${c.withPartial})` : ''}, nicht ${n}`);
      }
    }
    // 5. number of nationwide holidays
    if (!/Österreich|Schweiz/.test(line)) for (const y of years) {
      const nat = hol.get(y)!.filter((h) => h.full.length === 16).length;
      const m = line.match(/\b(\d{1,2}|acht|neun|zehn|elf|zwölf)\s+(bundesweite|bundeseinheitliche|gesetzliche Feiertage, die in allen)/i);
      const words: Record<string, number> = { acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12 };
      if (m && (words[m[1].toLowerCase()] ?? +m[1]) !== nat) { issues.push(`Es gibt ${nat} bundesweite Feiertage, nicht ${m[1]} – „${short}“`); break; }
    }
    // 6. minimum wage
    if (/mindestlohn/i.test(line)) for (const m of line.matchAll(/(?<![\d.])(\d{2}),(\d{2})\s?(€|Euro)/g)) {
      const v = +`${m[1]}.${m[2]}`; if (v < 8 || v > 25) continue; /* hourly rates only */ const ys = datesIn(line).map((d) => +d.slice(0, 4)).concat([...line.matchAll(/\b(20[2-4]\d)\b/g)].map((x) => +x[1]));
      const ok = (ys.length ? ys : years).some((y) => minWage(y) === v) || wage.DE.rates.some((r) => r.hourly === v && line.includes(r.from.slice(0, 4)));
      if (!ok) issues.push(`Mindestlohn ${m[1]},${m[2]} € passt zu keinem Jahr im Text (Daten: ${wage.DE.rates.map((r) => `${r.from.slice(0, 4)}: ${r.hourly}`).join(', ')})`);
    }
    // 7. ISO weeks per year
    for (const m of line.matchAll(/\b(20[2-4]\d)\b[^.;|\d]{0,40}?\b(5[23])\s+(?:ISO-)?(?:Kalender)?[Ww]ochen\b/g))
      if (weeksInYear(+m[1]) !== +m[2]) issues.push(`${m[1]} hat ${weeksInYear(+m[1])} ISO-Kalenderwochen, nicht ${m[2]}`);
    // 8. Switzerland: only the Bundesfeier is a federal holiday
    if (/Schweiz/.test(line) && /(bundesweit|landesweit|national)\w*\s+Feiertag\w*\s+(wie|z\. ?B\.)\s+(Karfreitag|Ostermontag|Weihnacht|Neujahr|Auffahrt|Pfingst)/i.test(line))
      issues.push('Schweiz: einziger bundesweiter Feiertag ist die Bundesfeier (1. August); andere Feiertage regeln die Kantone');
  }
  return [...new Set(issues)];
}

/** Keywords pasted in verbatim instead of written naturally ("(brückentage 2027 nrw)", 'urlaub 2027 planen …'). */
export function keywordStuffing(body: string, keywords: string[]): string[] {
  const issues: string[] = [];
  for (const kw of keywords.filter((k) => k.includes(' '))) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const quoted = new RegExp(`[(„"'‚]\\s*${esc}\\s*[)“"'‘]`).test(body);
    // a German noun of the keyword written in lower case although the text capitalises it elsewhere
    const lowerNoun = kw.split(' ').some((w) => /^[a-zäöü]/.test(w) && body.includes(w[0].toUpperCase() + w.slice(1))) && new RegExp(`(^|[^\\wäöü])${esc}([^\\wäöü]|$)`).test(body);
    if (quoted || lowerNoun) issues.push(`Keyword „${kw}“ wörtlich/kleingeschrieben eingebaut – natürlich formulieren`);
  }
  return issues;
}
