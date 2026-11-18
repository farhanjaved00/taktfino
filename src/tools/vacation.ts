/**
 * Urlaubsanspruch nach BUrlG (Germany).
 * - Legal minimum: 24 Werktage (Mon–Sat) = 20 days at a 5-day week, i.e. 24 × workdays ÷ 6 (§ 3).
 * - Part-time: contract days × own workdays ÷ the workdays the contract days refer to.
 * - Partial year (§ 5): 1/12 for each FULL month of employment when the 6-month waiting period can't be met in the year
 *   (start after 30 June), or when leaving in the first half of the year. Leaving after 30 June with the waiting period
 *   met keeps at least the full LEGAL minimum.
 * - Rounding (§ 5 Abs. 2): fractions of at least half a day are rounded up; smaller fractions stay.
 * - Severe disability: +5 days at a 5-day week (§ 208 SGB IX), scaled to the workdays.
 */
import { type CalDate, addDays, compare, ymdBetween } from '../lib/dates';

export interface VacationInput {
  contractDays: number;     // annual vacation in the contract (full-time)
  contractWeekDays: number; // workdays the contract days refer to (usually 5)
  ownWeekDays: number;      // own workdays per week
  year: number;
  start?: CalDate;          // employment start (if within the year)
  end?: CalDate;            // employment end (if within the year)
  disabled?: boolean;
}
export interface VacationResult {
  fullYear: number;          // own entitlement for a full year (part-time adjusted, before rounding)
  legalMinimum: number;      // own legal minimum for a full year
  months: number | null;     // full months counted for partial entitlement (null = full year)
  rule: 'full' | 'partial-start' | 'partial-leave-first-half' | 'full-leave-second-half';
  entitlement: number;       // final, rounded per § 5 Abs. 2
  extraDisabled: number;
}

export const roundVacation = (x: number) => { const f = x - Math.floor(x); return f >= 0.5 - 1e-9 ? Math.ceil(x) : Math.round(x * 100) / 100; };

export function calcVacation(i: VacationInput): VacationResult {
  const fullYear = (i.contractDays * i.ownWeekDays) / i.contractWeekDays;
  const legalMinimum = (24 * i.ownWeekDays) / 6;
  const extraDisabled = i.disabled ? (5 * i.ownWeekDays) / 5 : 0;
  const y0: CalDate = { y: i.year, m: 1, d: 1 }, y1: CalDate = { y: i.year, m: 12, d: 31 };
  const s = i.start && compare(i.start, y0) > 0 ? i.start : null;
  const e = i.end && compare(i.end, y1) < 0 ? i.end : null;
  const july1: CalDate = { y: i.year, m: 7, d: 1 }, june30: CalDate = { y: i.year, m: 6, d: 30 };
  const fullMonths = (from: CalDate, to: CalDate) => { const r = ymdBetween(from, addDays(to, 1)); return r.years * 12 + r.months; };
  let rule: VacationResult['rule'] = 'full', months: number | null = null, base = fullYear;
  if (s && compare(s, july1) > 0) { rule = 'partial-start'; months = fullMonths(s, e ?? y1); base = (fullYear * months) / 12; }
  else if (e && compare(e, june30) <= 0) { rule = 'partial-leave-first-half'; months = fullMonths(s ?? y0, e); base = (fullYear * months) / 12; }
  else if (e) { rule = 'full-leave-second-half'; base = Math.max(legalMinimum, s ? (fullYear * fullMonths(s, e)) / 12 : (fullYear * fullMonths(y0, e)) / 12); }
  else if (s) { months = null; }
  return { fullYear, legalMinimum, months, rule, entitlement: roundVacation(base + extraDisabled), extraDisabled };
}
