/**
 * Mutterschutz-Fristen nach § 3 MuSchG (Germany).
 * - Before birth: the last 6 weeks before the calculated due date (ET).
 * - After birth: 8 weeks; 12 weeks for premature births, multiple births, or (on request) when a disability of the child
 *   is diagnosed within 8 weeks.
 * - If the child arrives BEFORE the due date, the protection after birth is extended by the days lost before birth.
 *   If it arrives later, the period before birth simply runs until the birth.
 * Counting: the birth (or ET) is the event day; a period of weeks ends on the same weekday (§§ 187, 188 BGB).
 */
import { type CalDate, addDays, diffDays, compare } from '../lib/dates';

export interface MaternityInput { due: CalDate; birth?: CalDate; extended?: boolean }
export interface MaternityResult {
  start: CalDate;          // first day of protection before birth
  lastWorkday: CalDate;    // day before start (calendar day)
  birth: CalDate;          // actual or expected birth used
  end: CalDate;            // last day of protection after birth
  weeksAfter: 8 | 12;
  extraDays: number;       // days added because the child came early
  totalDays: number;       // start … end inclusive
  parentalLeaveFrom: CalDate;
}

export function calcMaternity(i: MaternityInput): MaternityResult {
  const start = addDays(i.due, -42);
  const birth = i.birth ?? i.due;
  const weeksAfter = i.extended ? 12 : 8;
  const early = compare(birth, i.due) < 0 ? diffDays(birth, i.due) : 0;
  const end = addDays(birth, weeksAfter * 7 + early);
  return {
    start, lastWorkday: addDays(start, -1), birth, end, weeksAfter, extraDays: early,
    totalDays: diffDays(start, end) + 1, parentalLeaveFrom: addDays(end, 1),
  };
}
