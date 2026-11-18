/** Kalenderwoche (ISO 8601): week 1 contains the year's first Thursday; weeks start on Monday. Used in DE, AT, CH. */
import { type CalDate, addDays, isoWeek, toDayNum, weekday } from '../lib/dates';

/** Monday of ISO week `week` in ISO year `year`. */
export function weekStart(year: number, week: number): CalDate {
  const jan4: CalDate = { y: year, m: 1, d: 4 }; // always in week 1
  const monday1 = addDays(jan4, -((weekday(jan4) + 6) % 7));
  return addDays(monday1, (week - 1) * 7);
}

/** 52 or 53. A year has 53 ISO weeks if Jan 1 is a Thursday, or a Wednesday in a leap year. */
export function weeksInYear(year: number): number {
  return isoWeek({ y: year, m: 12, d: 28 }).week; // Dec 28 is always in the last week
}

export interface WeekInfo { year: number; week: number; start: CalDate; end: CalDate }

export function weekOf(c: CalDate): WeekInfo {
  const { year, week } = isoWeek(c);
  const start = weekStart(year, week);
  return { year, week, start, end: addDays(start, 6) };
}

export function weekRange(year: number, week: number): WeekInfo | null {
  if (!Number.isInteger(week) || week < 1 || week > weeksInYear(year)) return null;
  const start = weekStart(year, week);
  return { year, week, start, end: addDays(start, 6) };
}

/** All weeks of an ISO year. */
export function allWeeks(year: number): WeekInfo[] {
  return Array.from({ length: weeksInYear(year) }, (_, i) => weekRange(year, i + 1)!);
}

/** Days from `today` until the Monday of a given week (negative if in the past). */
export const daysUntilWeek = (today: CalDate, year: number, week: number) => toDayNum(weekStart(year, week)) - toDayNum(today);
