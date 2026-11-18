/**
 * Public-holiday RULES for Germany (16 Länder), Austria and Switzerland (Kanton Zürich).
 * These rules generate the reviewed data files in src/data/holidays/ (npm run holidays -- 2029).
 * The tools read the JSON files, never these rules directly, so every year's data can be checked by a person.
 *
 * Sources: Feiertagsgesetze der Länder; Feiertagsruhegesetz (AT); Ruhetags- und Ladenöffnungsgesetz (ZH).
 */
import { type CalDate, addDays, formatISO } from '../lib/dates';

export function easterSunday(y: number): CalDate {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return { y, m: Math.floor((h + l - 7 * m + 114) / 31), d: ((h + l - 7 * m + 114) % 31) + 1 };
}

/** Buß- und Bettag: the Wednesday before November 23 (Nov 16–22). */
export function bussUndBettag(y: number): CalDate {
  const nov23 = { y, m: 11, d: 23 };
  const wd = new Date(Date.UTC(y, 10, 23)).getUTCDay(); // 0 Sun..6 Sat
  const back = ((wd - 3 + 7) % 7) || 7; // days back to previous Wednesday
  return addDays(nov23, -back);
}

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  /** German name (the data is shown on German pages; other languages translate by key) */
  name: string;
  key: string;
  /** Only in some municipalities/areas of the region */
  partial?: boolean;
  /** For partial holidays: counted by default? */
  defaultOn?: boolean;
  note?: string;
  /** Falls on a Sunday anyway (e.g. Ostersonntag in Brandenburg) */
}

type Rule = { key: string; name: string; date: (y: number) => CalDate; partial?: boolean; defaultOn?: boolean; note?: string; since?: number };
const fixed = (m: number, d: number) => (y: number): CalDate => ({ y, m, d });
const easter = (offset: number) => (y: number) => addDays(easterSunday(y), offset);

const R = {
  neujahr: { key: 'neujahr', name: 'Neujahr', date: fixed(1, 1) },
  dreikoenige: { key: 'heilige-drei-koenige', name: 'Heilige Drei Könige', date: fixed(1, 6) },
  frauentag: { key: 'frauentag', name: 'Internationaler Frauentag', date: fixed(3, 8) },
  karfreitag: { key: 'karfreitag', name: 'Karfreitag', date: easter(-2) },
  ostersonntag: { key: 'ostersonntag', name: 'Ostersonntag', date: easter(0) },
  ostermontag: { key: 'ostermontag', name: 'Ostermontag', date: easter(1) },
  maifeiertag: { key: 'tag-der-arbeit', name: 'Tag der Arbeit', date: fixed(5, 1) },
  himmelfahrt: { key: 'christi-himmelfahrt', name: 'Christi Himmelfahrt', date: easter(39) },
  pfingstsonntag: { key: 'pfingstsonntag', name: 'Pfingstsonntag', date: easter(49) },
  pfingstmontag: { key: 'pfingstmontag', name: 'Pfingstmontag', date: easter(50) },
  fronleichnam: { key: 'fronleichnam', name: 'Fronleichnam', date: easter(60) },
  mariaehimmelfahrt: { key: 'mariae-himmelfahrt', name: 'Mariä Himmelfahrt', date: fixed(8, 15) },
  weltkindertag: { key: 'weltkindertag', name: 'Weltkindertag', date: fixed(9, 20) },
  einheit: { key: 'tag-der-deutschen-einheit', name: 'Tag der Deutschen Einheit', date: fixed(10, 3) },
  reformationstag: { key: 'reformationstag', name: 'Reformationstag', date: fixed(10, 31) },
  allerheiligen: { key: 'allerheiligen', name: 'Allerheiligen', date: fixed(11, 1) },
  busstag: { key: 'buss-und-bettag', name: 'Buß- und Bettag', date: bussUndBettag },
  weihnacht1: { key: 'weihnachten-1', name: '1. Weihnachtstag', date: fixed(12, 25) },
  weihnacht2: { key: 'weihnachten-2', name: '2. Weihnachtstag', date: fixed(12, 26) },
} satisfies Record<string, Rule>;

const DE_ALL: Rule[] = [R.neujahr, R.karfreitag, R.ostermontag, R.maifeiertag, R.himmelfahrt, R.pfingstmontag, R.einheit, R.weihnacht1, R.weihnacht2];

/** Extra holidays per Land (on top of the 9 nationwide ones). */
const DE_EXTRA: Record<string, Rule[]> = {
  bw: [R.dreikoenige, R.fronleichnam, R.allerheiligen],
  by: [R.dreikoenige, R.fronleichnam, R.allerheiligen,
    { ...R.mariaehimmelfahrt, partial: true, defaultOn: true, note: 'Nur in Gemeinden mit überwiegend katholischer Bevölkerung (die Mehrheit der bayerischen Gemeinden).' },
    { key: 'augsburger-friedensfest', name: 'Augsburger Friedensfest', date: fixed(8, 8), partial: true, defaultOn: false, note: 'Nur im Stadtgebiet Augsburg.' }],
  be: [{ ...R.frauentag, since: 2019 }],
  bb: [R.ostersonntag, R.pfingstsonntag, R.reformationstag],
  hb: [{ ...R.reformationstag, since: 2018 }],
  hh: [{ ...R.reformationstag, since: 2018 }],
  he: [R.fronleichnam],
  mv: [{ ...R.frauentag, since: 2023 }, R.reformationstag],
  ni: [{ ...R.reformationstag, since: 2018 }],
  nw: [R.fronleichnam, R.allerheiligen],
  rp: [R.fronleichnam, R.allerheiligen],
  sl: [R.fronleichnam, R.mariaehimmelfahrt, R.allerheiligen],
  sn: [R.reformationstag, R.busstag, { ...R.fronleichnam, partial: true, defaultOn: false, note: 'Nur in einigen überwiegend katholischen Gemeinden im Landkreis Bautzen.' }],
  st: [R.dreikoenige, R.reformationstag],
  sh: [{ ...R.reformationstag, since: 2018 }],
  th: [{ ...R.weltkindertag, since: 2019 }, R.reformationstag, { ...R.fronleichnam, partial: true, defaultOn: false, note: 'Nur in Teilen des Eichsfelds und des Unstrut-Hainich-Kreises / Wartburgkreises.' }],
};

/** Austria — nationwide public holidays (Feiertagsruhegesetz). Karfreitag is no longer a general holiday since 2019. */
const AT: Rule[] = [
  R.neujahr, { ...R.dreikoenige, name: 'Heilige Drei Könige' }, R.ostermontag, { ...R.maifeiertag, name: 'Staatsfeiertag' },
  R.himmelfahrt, R.pfingstmontag, R.fronleichnam, R.mariaehimmelfahrt,
  { key: 'nationalfeiertag', name: 'Nationalfeiertag', date: fixed(10, 26) }, R.allerheiligen,
  { key: 'mariae-empfaengnis', name: 'Mariä Empfängnis', date: fixed(12, 8) },
  { ...R.weihnacht1, name: 'Christtag' }, { ...R.weihnacht2, name: 'Stefanitag' },
];

/** Switzerland, Kanton Zürich (holidays differ by canton). */
const CH_ZH: Rule[] = [
  R.neujahr, { key: 'berchtoldstag', name: 'Berchtoldstag', date: fixed(1, 2) }, R.karfreitag, R.ostermontag,
  R.maifeiertag, { ...R.himmelfahrt, name: 'Auffahrt' }, R.pfingstmontag,
  { key: 'bundesfeier', name: 'Bundesfeier (Nationalfeiertag)', date: fixed(8, 1) },
  { ...R.weihnacht1, name: 'Weihnachtstag' }, { ...R.weihnacht2, name: 'Stephanstag' },
];

export const DE_REGIONS = Object.keys(DE_EXTRA);

export function rulesFor(region: string): Rule[] {
  if (region === 'at') return AT;
  if (region === 'ch-zh') return CH_ZH;
  if (!DE_EXTRA[region]) throw new Error(`Unknown region ${region}`);
  return [...DE_ALL, ...DE_EXTRA[region]];
}

export function holidaysFor(region: string, year: number): HolidayEntry[] {
  return rulesFor(region)
    .filter((r) => !r.since || year >= r.since)
    .map((r) => {
      const e: HolidayEntry = { date: formatISO(r.date(year)), name: r.name, key: r.key };
      if (r.partial) { e.partial = true; e.defaultOn = !!r.defaultOn; }
      if (r.note) e.note = r.note;
      return e;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const ALL_REGIONS = [...DE_REGIONS, 'at', 'ch-zh'];
