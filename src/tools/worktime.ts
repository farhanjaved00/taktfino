/**
 * Arbeitszeitrechner logic — multi-day timesheet with legal break/rest checks for DE, AT and CH.
 * Language-free: returns numbers and warning codes; pages translate them.
 */
import { parseClock, spanMinutes, overlap } from './time';
import { parseISO, toDayNum, weekday } from '../lib/dates';

export type Country = 'DE' | 'AT' | 'CH';

export interface CountryRules {
  /** [net working minutes MORE than which, minimum break minutes] in ascending order */
  breaks: [number, number][];
  /** Maximum daily working time in minutes (null = no simple daily cap) */
  maxDaily: number | null;
  /** Minimum uninterrupted rest between two working days, minutes */
  minRest: number;
  /** Night window [start, end) in minutes from midnight (end on next day) */
  night: [number, number];
  source: { label: string; url: string };
}

export const RULES: Record<Country, CountryRules> = {
  // ArbZG § 4 (Pausen), § 3 (max. 10 h), § 5 (11 h Ruhezeit), § 2 Abs. 3 (Nachtzeit 23–6 Uhr)
  DE: { breaks: [[360, 30], [540, 45]], maxDaily: 600, minRest: 660, night: [23 * 60, 6 * 60], source: { label: 'Arbeitszeitgesetz (ArbZG)', url: 'https://www.gesetze-im-internet.de/arbzg/' } },
  // AZG § 11 (30 min ab mehr als 6 h), § 9 (max. 12 h), § 12 (11 h Ruhezeit), Nachtzeit 22–5 Uhr
  AT: { breaks: [[360, 30]], maxDaily: 720, minRest: 660, night: [22 * 60, 5 * 60], source: { label: 'Arbeitszeitgesetz (AZG)', url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008238' } },
  // ArG Art. 15 (15/30/60 min ab 5½/7/9 h), Art. 15a (11 h Ruhezeit), Art. 10 (Nachtarbeit 23–6 Uhr)
  CH: { breaks: [[330, 15], [420, 30], [540, 60]], maxDaily: null, minRest: 660, night: [23 * 60, 6 * 60], source: { label: 'Arbeitsgesetz (ArG)', url: 'https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de' } },
};

export interface DayInput { date: string; start: string; end: string; breakMin: number }

export type WorkWarning =
  | { code: 'invalid' }
  | { code: 'break_short'; required: number; actual: number }
  | { code: 'over_max'; max: number }
  | { code: 'rest_short'; rest: number; min: number }
  | { code: 'sunday' }
  | { code: 'holiday'; name: string };

export interface DayResult {
  date: string;
  valid: boolean;
  grossMin: number;
  breakMin: number;
  netMin: number;
  requiredBreakMin: number;
  nightMin: number;
  sundayMin: number;
  holidayMin: number;
  crossesMidnight: boolean;
  warnings: WorkWarning[];
}

export const rulesFor = (country: string): CountryRules => (RULES as Record<string, CountryRules>)[country] ?? { breaks: [], maxDaily: null, minRest: 0, night: [22 * 60, 6 * 60], source: { label: '', url: '' } };

export function requiredBreak(netMin: number, country: Country): number {
  let req = 0;
  for (const [over, b] of rulesFor(country).breaks) if (netMin > over) req = b;
  return req;
}

export interface WorktimeOptions { country: Country; holidays?: Map<string, string> }

export function calcDay(d: DayInput, opts: WorktimeOptions): DayResult {
  const s = parseClock(d.start), e = parseClock(d.end), date = parseISO(d.date);
  const empty: DayResult = { date: d.date, valid: false, grossMin: 0, breakMin: 0, netMin: 0, requiredBreakMin: 0, nightMin: 0, sundayMin: 0, holidayMin: 0, crossesMidnight: false, warnings: [{ code: 'invalid' }] };
  if (s === null || e === null || !date || s === e) return empty;
  const rules = rulesFor(opts.country);
  const gross = spanMinutes(s, e);
  const brk = Math.max(0, Math.min(Math.round(d.breakMin || 0), gross));
  const net = gross - brk;
  const crosses = e <= s;
  const end = s + gross; // may exceed 1440
  // night minutes: windows [night0 of previous day..], [night0 today .. night1 next day]
  const [n0, n1] = rules.night;
  const windows: [number, number][] = [[n0 - 1440, n1], [n0, n1 + 1440], [n0 + 1440, n1 + 2880]];
  const nightMin = windows.reduce((sum, [a, b]) => sum + overlap(s, end, a, b), 0);
  // Sunday / holiday minutes for day 0 and (if crossing midnight) day 1
  const dn = toDayNum(date);
  const day0Sunday = weekday(date) === 0, day1Sunday = weekday(date) === 6;
  const nextIso = new Date((dn + 1) * 86_400_000).toISOString().slice(0, 10);
  const part0 = overlap(s, end, 0, 1440), part1 = overlap(s, end, 1440, 2880);
  const sundayMin = (day0Sunday ? part0 : 0) + (day1Sunday ? part1 : 0);
  const hol0 = opts.holidays?.get(d.date), hol1 = opts.holidays?.get(nextIso);
  const holidayMin = (hol0 ? part0 : 0) + (hol1 ? part1 : 0);
  const req = requiredBreak(net, opts.country);
  const warnings: WorkWarning[] = [];
  if (brk < req) warnings.push({ code: 'break_short', required: req, actual: brk });
  if (rules.maxDaily && net > rules.maxDaily) warnings.push({ code: 'over_max', max: rules.maxDaily });
  if (sundayMin > 0) warnings.push({ code: 'sunday' });
  if (hol0 || hol1) warnings.push({ code: 'holiday', name: (hol0 || hol1)! });
  return { date: d.date, valid: true, grossMin: gross, breakMin: brk, netMin: net, requiredBreakMin: req, nightMin, sundayMin, holidayMin, crossesMidnight: crosses, warnings };
}

export interface SheetResult {
  days: DayResult[];
  totalNetMin: number;
  totalBreakMin: number;
  totalNightMin: number;
  totalSundayMin: number;
  totalHolidayMin: number;
  /** net minutes per ISO week key "2026-W47" */
  weeks: Record<string, number>;
}

function isoWeekKey(iso: string): string {
  const c = parseISO(iso)!;
  const n = toDayNum(c), wd = (weekday(c) + 6) % 7;
  const thu = new Date((n - wd + 3) * 86_400_000);
  const y = thu.getUTCFullYear();
  const week = Math.floor((thu.getTime() / 86_400_000 - Date.UTC(y, 0, 1) / 86_400_000) / 7) + 1;
  return `${y}-W${String(week).padStart(2, '0')}`;
}

export function calcSheet(entries: DayInput[], opts: WorktimeOptions): SheetResult {
  const days = entries.map((d) => calcDay(d, opts));
  // rest periods between consecutive valid entries (sorted by date + start)
  const order = days.map((r, i) => ({ r, i })).filter((x) => x.r.valid)
    .sort((a, b) => a.r.date.localeCompare(b.r.date) || parseClock(entries[a.i].start)! - parseClock(entries[b.i].start)!);
  for (let k = 1; k < order.length; k++) {
    const prev = order[k - 1], cur = order[k];
    const pEnd = toDayNum(parseISO(prev.r.date)!) * 1440 + parseClock(entries[prev.i].start)! + prev.r.grossMin;
    const cStart = toDayNum(parseISO(cur.r.date)!) * 1440 + parseClock(entries[cur.i].start)!;
    const rest = cStart - pEnd;
    const minRest = rulesFor(opts.country).minRest;
    if (rest >= 0 && rest < minRest) cur.r.warnings.push({ code: 'rest_short', rest, min: minRest });
  }
  const weeks: Record<string, number> = {};
  for (const d of days) if (d.valid) weeks[isoWeekKey(d.date)] = (weeks[isoWeekKey(d.date)] || 0) + d.netMin;
  const sum = (k: keyof DayResult) => days.reduce((s, d) => s + (d.valid ? (d[k] as number) : 0), 0);
  return { days, totalNetMin: sum('netMin'), totalBreakMin: sum('breakMin'), totalNightMin: sum('nightMin'), totalSundayMin: sum('sundayMin'), totalHolidayMin: sum('holidayMin'), weeks };
}
