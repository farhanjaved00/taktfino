/**
 * Kündigungsfrist nach § 622 BGB (Germany).
 * - Grundfrist (Abs. 1): 4 Wochen zum 15. oder zum Ende eines Kalendermonats – for employees always, for employers in the first 2 years.
 * - Verlängerte Fristen (Abs. 2), only when the EMPLOYER terminates, by length of employment at receipt (Zugang):
 *   2 J → 1 Monat, 5 → 2, 8 → 3, 10 → 4, 12 → 5, 15 → 6, 20 → 7 Monate, each zum Ende eines Kalendermonats.
 *   (The old rule ignoring years before age 25 no longer applies.)
 * - Probezeit (Abs. 3, max. 6 Monate vereinbart): 2 Wochen, to any day.
 * - Counting (§§ 187, 188 BGB): the period starts the day after receipt; a period of weeks/months ends on the day that
 *   corresponds to the receipt day (weeks: same weekday; months: same date, or the month's last day if it doesn't exist).
 * Tarifverträge and contracts can differ; contracts may lengthen but not shorten the employer's period.
 */
import { type CalDate, addDays, addMonths, compare, daysInMonth, ymdBetween } from '../lib/dates';

export type Party = 'employer' | 'employee';

export const EXTENDED: [number, number][] = [[20, 7], [15, 6], [12, 5], [10, 4], [8, 3], [5, 2], [2, 1]];

export interface NoticeInput {
  party: Party;
  /** Date the notice is received (Zugang) */
  receipt: CalDate;
  /** Start of employment */
  start: CalDate;
  /** In an agreed probation period of up to 6 months */
  probation?: boolean;
  /** Contractual period in months (optional), ending … */
  contractMonths?: number;
  contractEnd?: 'month' | 'quarter';
  /** Contract applies the (longer) employer period to the employee as well */
  employeeSameAsEmployer?: boolean;
}

export interface NoticeResult {
  endDate: CalDate;
  rule: 'probation' | 'basic' | 'extended' | 'contract';
  /** Human-ish description key + values */
  months?: number;
  yearsEmployed: number;
  employed: { years: number; months: number; days: number };
  /** Latest receipt date to still reach the nearest possible end date under the same rule */
  latestReceiptForEnd: CalDate;
}

const monthEnd = (c: CalDate): CalDate => ({ y: c.y, m: c.m, d: daysInMonth(c.y, c.m) });
const quarterEnd = (c: CalDate): CalDate => { const m = Math.ceil(c.m / 3) * 3; return { y: c.y, m, d: daysInMonth(c.y, m) }; };

/** Earliest date ≥ min that is the 15th or a month's last day */
function next15OrMonthEnd(min: CalDate): CalDate {
  if (min.d <= 15) return { y: min.y, m: min.m, d: 15 };
  return monthEnd(min);
}

export function endBasic(receipt: CalDate): CalDate { return next15OrMonthEnd(addDays(receipt, 28)); }
export function endMonths(receipt: CalDate, months: number, to: 'month' | 'quarter' = 'month'): CalDate {
  const min = addMonths(receipt, months);
  return to === 'quarter' ? quarterEnd(min) : monthEnd(min);
}
export function endProbation(receipt: CalDate): CalDate { return addDays(receipt, 14); }

export function extendedMonths(yearsEmployed: number): number {
  for (const [y, m] of EXTENDED) if (yearsEmployed >= y) return m;
  return 0;
}

export function calcNotice(i: NoticeInput): NoticeResult {
  const employed = ymdBetween(i.start, i.receipt);
  const years = employed.years;
  let end: CalDate; let rule: NoticeResult['rule']; let months: number | undefined;
  let latest: CalDate;
  if (i.probation) {
    end = endProbation(i.receipt); rule = 'probation';
    latest = addDays(end, -14);
  } else {
    const ext = extendedMonths(years);
    const useExt = ext > 0 && (i.party === 'employer' || i.employeeSameAsEmployer);
    if (useExt) {
      end = endMonths(i.receipt, ext); rule = 'extended'; months = ext;
      // latest receipt for this end date: the day that is `ext` months before end (month end → last day of that month)
      const back = addMonths({ y: end.y, m: end.m, d: 1 }, -ext);
      latest = monthEnd(back);
    } else {
      end = endBasic(i.receipt); rule = 'basic';
      latest = addDays(end, -28);
    }
    if (i.contractMonths && i.contractMonths > 0) {
      const c = endMonths(i.receipt, i.contractMonths, i.contractEnd || 'month');
      if (compare(c, end) > 0) { end = c; rule = 'contract'; months = i.contractMonths; latest = i.receipt; }
    }
  }
  return { endDate: end, rule, months, yearsEmployed: years, employed, latestReceiptForEnd: latest };
}
