/** Arbeitstage-Rechner logic: working days between two dates for a region, with holidays, half-days and vacation. */
import { type CalDate, formatISO, fromDayNum, parseISO, toDayNum, weekday } from '../lib/dates';
import type { HolidayEntry } from './holiday-rules';

export interface HolidayFile { region: string; year: number; holidays: HolidayEntry[] }

/** All holiday files bundled at build time (small JSON, ~18 regions × 3 years). */
const FILES = import.meta.glob<HolidayFile>('../data/holidays/*/*.json', { eager: true, import: 'default' });

export function holidaysFor(region: string, years: number[]): HolidayEntry[] {
  const out: HolidayEntry[] = [];
  for (const f of Object.values(FILES)) if (f.region === region && years.includes(f.year)) out.push(...f.holidays);
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
export function availableYears(region: string): number[] {
  return [...new Set(Object.values(FILES).filter((f) => f.region === region).map((f) => f.year))].sort();
}

export interface WorkdayOptions {
  region: string;
  /** Working weekdays, 1 = Monday … 6 = Saturday, 0 = Sunday. Default Mon–Fri. */
  weekdays?: number[];
  /** Keys of partial (regional) holidays to count, overrides their defaultOn */
  partialOn?: string[];
  /** Count 24.12. and 31.12. as half working days (if they are working weekdays) */
  halfDays?: boolean;
  /** Vacation days to subtract */
  vacation?: number;
}

export interface WorkdayResult {
  calendarDays: number;
  weekendDays: number;
  /** Holidays that fall on a working weekday (these reduce working days) */
  holidaysOnWorkdays: { date: string; name: string }[];
  /** Working days (half-days count as 0.5) */
  workdays: number;
  /** After subtracting vacation */
  netWorkdays: number;
  halfDays: number;
  missingYears: number[];
}

/** Counts from `from` to `to`, both days INCLUDED. */
export function countWorkdays(from: CalDate, to: CalDate, o: WorkdayOptions): WorkdayResult {
  let a = toDayNum(from), b = toDayNum(to);
  if (b < a) [a, b] = [b, a];
  const years: number[] = [];
  for (let y = fromDayNum(a).y; y <= fromDayNum(b).y; y++) years.push(y);
  const have = availableYears(o.region);
  const missingYears = years.filter((y) => !have.includes(y));
  const wds = new Set(o.weekdays ?? [1, 2, 3, 4, 5]);
  const hol = new Map<string, string>();
  for (const h of holidaysFor(o.region, years)) {
    const on = h.partial ? (o.partialOn ? o.partialOn.includes(h.key) : !!h.defaultOn) : true;
    if (on) hol.set(h.date, h.name);
  }
  let weekend = 0, work = 0, half = 0;
  const holidaysOnWorkdays: { date: string; name: string }[] = [];
  for (let n = a; n <= b; n++) {
    const c = fromDayNum(n), iso = formatISO(c), wd = weekday(c);
    if (!wds.has(wd)) { weekend++; continue; }
    if (hol.has(iso)) { holidaysOnWorkdays.push({ date: iso, name: hol.get(iso)! }); continue; }
    if (o.halfDays && c.m === 12 && (c.d === 24 || c.d === 31)) { work += 0.5; half++; continue; }
    work++;
  }
  return { calendarDays: b - a + 1, weekendDays: weekend, holidaysOnWorkdays, workdays: work, netWorkdays: Math.max(0, work - (o.vacation || 0)), halfDays: half, missingYears };
}

/** Working days per month for a whole year (for the region pages). */
export function monthlyWorkdays(region: string, year: number, o: Omit<WorkdayOptions, 'region'> = {}): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const last = new Date(Date.UTC(year, i + 1, 0)).getUTCDate();
    return countWorkdays({ y: year, m: i + 1, d: 1 }, { y: year, m: i + 1, d: last }, { ...o, region }).workdays;
  });
}

export const isoDate = (s: string) => parseISO(s);
