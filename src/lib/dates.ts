/**
 * Shared date engine. Pure functions, no DOM, safe to run at build time (Node)
 * and in the browser. Calendar dates are plain {y, m, d} objects (m = 1–12) and
 * all arithmetic goes through a UTC "day number", so daylight-saving changes and
 * the visitor's time zone can never shift a result by a day.
 */

export interface CalDate {
  y: number;
  m: number; // 1–12
  d: number; // 1–31
}

const MS_DAY = 86_400_000;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/* ------------------------------------------------------------------ basics */

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

export function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365;
}

export function isValidDate(c: CalDate): boolean {
  return (
    Number.isInteger(c.y) && Number.isInteger(c.m) && Number.isInteger(c.d) &&
    c.m >= 1 && c.m <= 12 && c.d >= 1 && c.d <= daysInMonth(c.y, c.m)
  );
}

/** Days since 1970-01-01 (can be negative). */
export function toDayNum(c: CalDate): number {
  return Math.round(Date.UTC(c.y, c.m - 1, c.d) / MS_DAY);
}

export function fromDayNum(n: number): CalDate {
  const dt = new Date(n * MS_DAY);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function date(y: number, m: number, d: number): CalDate {
  return { y, m, d };
}

export function sameDate(a: CalDate, b: CalDate): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function compare(a: CalDate, b: CalDate): number {
  return toDayNum(a) - toDayNum(b);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(c: CalDate): number {
  return (((toDayNum(c) + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

export function isWeekend(c: CalDate): boolean {
  const w = weekday(c);
  return w === 0 || w === 6;
}

export function dayOfYear(c: CalDate): number {
  return toDayNum(c) - toDayNum({ y: c.y, m: 1, d: 1 }) + 1;
}

/** ISO-8601 week number (weeks start Monday, week 1 contains the first Thursday). */
export function isoWeek(c: CalDate): { year: number; week: number } {
  const n = toDayNum(c);
  const wd = (weekday(c) + 6) % 7; // Monday = 0
  const thursday = fromDayNum(n - wd + 3);
  const jan1 = toDayNum({ y: thursday.y, m: 1, d: 1 });
  return { year: thursday.y, week: Math.floor((toDayNum(thursday) - jan1) / 7) + 1 };
}

/* -------------------------------------------------------------- arithmetic */

export function addDays(c: CalDate, n: number): CalDate {
  return fromDayNum(toDayNum(c) + n);
}

export function addWeeks(c: CalDate, n: number): CalDate {
  return addDays(c, n * 7);
}

/** Adds calendar months; clamps to the last day when the target month is shorter (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(c: CalDate, n: number): CalDate {
  const total = c.y * 12 + (c.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total - y * 12) + 1;
  return { y, m, d: Math.min(c.d, daysInMonth(y, m)) };
}

export function addYears(c: CalDate, n: number): CalDate {
  return addMonths(c, n * 12);
}

export type HolidaySet = Set<number> | undefined; // set of day numbers to skip

/**
 * Adds (or subtracts, for negative n) business days: Monday–Friday, optionally
 * skipping holidays. The start date itself is never counted; n = 0 returns the start.
 */
export function addBusinessDays(c: CalDate, n: number, holidays?: HolidaySet): CalDate {
  let num = toDayNum(c);
  const step = n < 0 ? -1 : 1;
  let left = Math.abs(n);
  while (left > 0) {
    num += step;
    const wd = (((num + 4) % 7) + 7) % 7;
    if (wd !== 0 && wd !== 6 && !(holidays && holidays.has(num))) left--;
  }
  return fromDayNum(num);
}

/** Signed whole days from a to b (b − a). */
export function diffDays(a: CalDate, b: CalDate): number {
  return toDayNum(b) - toDayNum(a);
}

/**
 * Business days between a and b: counts weekdays after a up to and including b
 * (same convention as addBusinessDays, so addBusinessDays(a, businessDaysBetween(a, b)) lands on b when b is a weekday).
 */
export function businessDaysBetween(a: CalDate, b: CalDate, holidays?: HolidaySet): number {
  let start = toDayNum(a);
  let end = toDayNum(b);
  let sign = 1;
  if (end < start) { [start, end] = [end, start]; sign = -1; }
  const total = end - start;
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  for (let num = start + fullWeeks * 7 + 1; num <= end; num++) {
    const wd = (((num + 4) % 7) + 7) % 7;
    if (wd !== 0 && wd !== 6) count++;
  }
  if (holidays) {
    for (const h of holidays) {
      if (h > start && h <= end) {
        const wd = (((h + 4) % 7) + 7) % 7;
        if (wd !== 0 && wd !== 6) count--;
      }
    }
  }
  return count * sign;
}

/** Years, months and days between two dates (a ≤ b), counted the way people state ages. */
export function ymdBetween(a: CalDate, b: CalDate): { years: number; months: number; days: number } {
  let sign = 1;
  if (compare(b, a) < 0) { [a, b] = [b, a]; sign = -1; }
  // largest whole number of months that fits (using the same clamping as addMonths), then leftover days
  let total = (b.y - a.y) * 12 + (b.m - a.m);
  if (compare(addMonths(a, total), b) > 0) total -= 1;
  const days = diffDays(addMonths(a, total), b);
  const years = Math.floor(total / 12);
  const months = total - years * 12;
  return { years: years * sign, months: months * sign, days: days * sign };
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  nextBirthday: CalDate;
  daysToNextBirthday: number;
  bornOn: number; // weekday
}

/** Exact age. Feb-29 birthdays are celebrated on Feb 28 in common years. */
export function age(birth: CalDate, on: CalDate): AgeResult {
  const { years, months, days } = ymdBetween(birth, on);
  const totalDays = diffDays(birth, on);
  const bdayIn = (y: number): CalDate => ({ y, m: birth.m, d: Math.min(birth.d, daysInMonth(y, birth.m)) });
  let next = bdayIn(on.y);
  if (compare(next, on) <= 0) next = bdayIn(on.y + 1);
  if (sameDate(bdayIn(on.y), on)) next = on;
  return {
    years, months, days, totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    nextBirthday: next,
    daysToNextBirthday: diffDays(on, next),
    bornOn: weekday(birth),
  };
}

/* ------------------------------------------------------- time zones / now */

/** The calendar date "now" in a given IANA time zone (e.g. 'America/New_York'). */
export function todayIn(timeZone: string, now: Date = new Date()): CalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

/** Wall-clock parts in a time zone. */
export function zonedParts(timeZone: string, at: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute'), s: get('second') };
}

/** Offset of a time zone from UTC in minutes at a given instant (e.g. New York in winter = -300). */
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const p = zonedParts(timeZone, at);
  const asUTC = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return Math.round((asUTC - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** Converts a wall-clock time in one zone to the same instant's wall clock in another zone. */
export function convertTime(
  wall: { y: number; m: number; d: number; h: number; min: number },
  fromZone: string,
  toZone: string,
) {
  // first guess: treat wall clock as UTC, then correct by the source offset (twice, to settle DST edges)
  let guess = Date.UTC(wall.y, wall.m - 1, wall.d, wall.h, wall.min);
  for (let i = 0; i < 2; i++) {
    const off = tzOffsetMinutes(fromZone, new Date(guess));
    guess = Date.UTC(wall.y, wall.m - 1, wall.d, wall.h, wall.min) - off * 60000;
  }
  return zonedParts(toZone, new Date(guess));
}

/** Adds hours to an instant and returns the new Date. */
export function addHours(at: Date, hours: number): Date {
  return new Date(at.getTime() + hours * 3_600_000);
}

/* -------------------------------------------------------------- formatting */

const pad = (n: number) => String(n).padStart(2, '0');

export function formatISO(c: CalDate): string {
  return `${c.y}-${pad(c.m)}-${pad(c.d)}`;
}
export function parseISO(s: string | null | undefined): CalDate | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const c = { y: +m[1], m: +m[2], d: +m[3] };
  return isValidDate(c) ? c : null;
}
/** MM/DD/YYYY */
export function formatUS(c: CalDate): string {
  return `${pad(c.m)}/${pad(c.d)}/${c.y}`;
}
/** DD/MM/YYYY */
export function formatUK(c: CalDate): string {
  return `${pad(c.d)}/${pad(c.m)}/${c.y}`;
}
/** Sunday, November 29, 2026 */
export function formatLong(c: CalDate): string {
  return `${WEEKDAYS[weekday(c)]}, ${MONTHS[c.m - 1]} ${c.d}, ${c.y}`;
}
/** November 29, 2026 */
export function formatMedium(c: CalDate): string {
  return `${MONTHS[c.m - 1]} ${c.d}, ${c.y}`;
}
/** Nov 29 */
export function formatShort(c: CalDate): string {
  return `${MONTHS[c.m - 1].slice(0, 3)} ${c.d}`;
}
/** Sun, Nov 29, 2026 */
export function formatCompact(c: CalDate): string {
  return `${WEEKDAYS[weekday(c)].slice(0, 3)}, ${MONTHS[c.m - 1].slice(0, 3)} ${c.d}, ${c.y}`;
}
export function weekdayName(c: CalDate): string {
  return WEEKDAYS[weekday(c)];
}
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
/** 3:05 PM */
export function formatTime12(h: number, min: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(min)} ${ampm}`;
}

/* ---------------------------------------------------------- month calendar */

export interface CalendarCell {
  date: CalDate | null;
  isToday: boolean;
  isResult: boolean;
  isWeekend: boolean;
}

/** A Sunday-first month grid with leading blanks. */
export function monthGrid(y: number, m: number, today?: CalDate, result?: CalDate): CalendarCell[] {
  const first = weekday({ y, m, d: 1 });
  const cells: CalendarCell[] = [];
  for (let i = 0; i < first; i++) cells.push({ date: null, isToday: false, isResult: false, isWeekend: false });
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const c = { y, m, d };
    cells.push({
      date: c,
      isToday: !!today && sameDate(c, today),
      isResult: !!result && sameDate(c, result),
      isWeekend: isWeekend(c),
    });
  }
  return cells;
}

/* ------------------------------------------------------- summary helpers */

/** Stats shown on every "from today" page. */
export function spanStats(from: CalDate, to: CalDate, holidays?: HolidaySet) {
  const days = Math.abs(diffDays(from, to));
  return {
    days,
    weeks: days / 7,
    months: days / 30.436875, // average Gregorian month
    hours: days * 24,
    minutes: days * 1440,
    businessDays: Math.abs(businessDaysBetween(from, to, holidays)),
    weekendDays: days - Math.abs(businessDaysBetween(from, to)),
  };
}

/** "2 weeks" / "6 weeks and 3 days" */
export function weeksAndDays(days: number): string {
  const w = Math.floor(days / 7);
  const d = days % 7;
  const ws = w === 1 ? '1 week' : `${w} weeks`;
  const ds = d === 1 ? '1 day' : `${d} days`;
  if (w === 0) return ds;
  if (d === 0) return ws;
  return `${ws} and ${ds}`;
}
