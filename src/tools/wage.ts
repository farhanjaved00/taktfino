/** Stundenlohnrechner logic. */
import mw from '../data/minimum-wage.json';

/** Average weeks per month: 52 weeks / 12 months = 4.333… (the usual German payroll factor 4,33) */
export const WEEKS_PER_MONTH = 52 / 12;

export const monthlyToHourly = (monthly: number, weeklyHours: number) => (weeklyHours > 0 ? monthly / (weeklyHours * WEEKS_PER_MONTH) : 0);
export const hourlyToMonthly = (hourly: number, weeklyHours: number) => hourly * weeklyHours * WEEKS_PER_MONTH;
export const monthlyHours = (weeklyHours: number) => weeklyHours * WEEKS_PER_MONTH;

type Country = 'DE' | 'AT' | 'CH';
export interface MinWage { hourly: number; from: string; source: { label: string; url: string } }

/** The statutory minimum wage in force on a date (ISO), or null if the country has none. */
export function minimumWage(country: Country, onIso: string): MinWage | null {
  const c = (mw as Record<string, { none?: boolean; rates?: { from: string; hourly: number }[]; source?: { label: string; url: string } }>)[country];
  if (!c || c.none || !c.rates) return null;
  const r = [...c.rates].reverse().find((x) => x.from <= onIso);
  return r ? { hourly: r.hourly, from: r.from, source: c.source! } : null;
}
export const minimumWageNote = (country: Country) => (mw as Record<string, { note?: string }>)[country]?.note || '';
export const upcomingMinimumWage = (country: Country, onIso: string) => {
  const c = (mw as Record<string, { rates?: { from: string; hourly: number }[] }>)[country];
  return c?.rates?.find((x) => x.from > onIso) || null;
};
