/** Stundenzettel (monthly timesheet) logic: days of a month, Soll from working days, totals via the worktime engine. */
import { daysInMonth, formatISO, weekday } from '../lib/dates';
import { calcSheet, type Country, type DayInput } from './worktime';
import { countWorkdays, holidaysFor } from './workdays';

export interface SheetDay { iso: string; weekday: number; weekend: boolean; holiday?: string }

export function monthDays(year: number, month: number, region?: string): SheetDay[] {
  const hol = new Map<string, string>();
  if (region) for (const h of holidaysFor(region, [year])) if (!h.partial || h.defaultOn) hol.set(h.date, h.name);
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => {
    const c = { y: year, m: month, d: i + 1 };
    const wd = weekday(c);
    const iso = formatISO(c);
    return { iso, weekday: wd, weekend: wd === 0 || wd === 6, holiday: hol.get(iso) };
  });
}

export interface SheetRow { iso: string; start: string; end: string; breakMin: number; note?: string }

export interface MonthTotals {
  workedMin: number;
  breakMin: number;
  nightMin: number;
  sundayMin: number;
  holidayMin: number;
  daysWorked: number;
  /** Target minutes = working days (Mon–Fri minus holidays) × daily target; null without weekly hours */
  targetMin: number | null;
  diffMin: number | null;
  warnings: number;
}

/** Only rows with both start and end are counted. */
export function monthTotals(rows: SheetRow[], o: { year: number; month: number; country: Country; region?: string; weeklyHours?: number; daysPerWeek?: number }): MonthTotals & { sheet: ReturnType<typeof calcSheet> } {
  const filled: DayInput[] = rows.filter((r) => r.start && r.end).map((r) => ({ date: r.iso, start: r.start, end: r.end, breakMin: r.breakMin }));
  const hol = new Map<string, string>();
  if (o.region) for (const h of holidaysFor(o.region, [o.year])) if (!h.partial || h.defaultOn) hol.set(h.date, h.name);
  const sheet = calcSheet(filled, { country: o.country, holidays: hol });
  let targetMin: number | null = null;
  if (o.weeklyHours && o.weeklyHours > 0) {
    const days = o.daysPerWeek || 5;
    const wd = countWorkdays({ y: o.year, m: o.month, d: 1 }, { y: o.year, m: o.month, d: daysInMonth(o.year, o.month) }, { region: o.region || '' }).workdays;
    targetMin = Math.round(wd * ((o.weeklyHours * 60) / days));
  }
  const workedMin = sheet.totalNetMin;
  return {
    sheet, workedMin, breakMin: sheet.totalBreakMin, nightMin: sheet.totalNightMin, sundayMin: sheet.totalSundayMin, holidayMin: sheet.totalHolidayMin,
    daysWorked: sheet.days.filter((d) => d.valid && d.netMin > 0).length,
    targetMin, diffMin: targetMin === null ? null : workedMin - targetMin,
    warnings: sheet.days.reduce((n, d) => n + d.warnings.filter((w) => w.code !== 'sunday' && w.code !== 'holiday').length, 0),
  };
}
