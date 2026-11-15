import { describe, it, expect } from 'vitest';
import { easterSunday, nthWeekday, seasonStart, getHoliday, nextOccurrence, nextMonthDay, HOLIDAYS, usFederalHolidaySet } from '../src/lib/holidays';
import { date as d, toDayNum } from '../src/lib/dates';

describe('holiday rules', () => {
  it('Easter', () => {
    expect(easterSunday(2024)).toEqual(d(2024, 3, 31));
    expect(easterSunday(2025)).toEqual(d(2025, 4, 20));
    expect(easterSunday(2026)).toEqual(d(2026, 4, 5));
    expect(easterSunday(2027)).toEqual(d(2027, 3, 28));
    expect(easterSunday(2028)).toEqual(d(2028, 4, 16));
    expect(easterSunday(2038)).toEqual(d(2038, 4, 25));
  });
  it('nth weekday', () => {
    expect(nthWeekday(2026, 11, 4, 4)).toEqual(d(2026, 11, 26)); // Thanksgiving
    expect(nthWeekday(2027, 11, 4, 4)).toEqual(d(2027, 11, 25));
    expect(nthWeekday(2027, 5, 1, -1)).toEqual(d(2027, 5, 31)); // Memorial Day
    expect(nthWeekday(2027, 1, 1, 3)).toEqual(d(2027, 1, 18)); // MLK
    expect(nthWeekday(2027, 9, 1, 1)).toEqual(d(2027, 9, 6)); // Labor Day
  });
  it('Victoria Day', () => {
    expect(getHoliday('victoria-day')!.rule(2027)).toEqual(d(2027, 5, 24));
    expect(getHoliday('victoria-day')!.rule(2026)).toEqual(d(2026, 5, 18));
    expect(getHoliday('victoria-day')!.rule(2026 + 6)).toEqual(d(2032, 5, 24));
  });
  it('UK Mothering Sunday', () => {
    expect(getHoliday('mothers-day-uk')!.rule(2027)).toEqual(d(2027, 3, 7));
    expect(getHoliday('mothers-day-uk')!.rule(2026)).toEqual(d(2026, 3, 15));
  });
  it('equinoxes and solstices (US Eastern date)', () => {
    expect(seasonStart(2026, 0)).toEqual(d(2026, 3, 20));
    expect(seasonStart(2026, 1)).toEqual(d(2026, 6, 21));
    expect(seasonStart(2026, 2)).toEqual(d(2026, 9, 22));
    expect(seasonStart(2026, 3)).toEqual(d(2026, 12, 21));
    expect(seasonStart(2027, 0)).toEqual(d(2027, 3, 20));
    expect(seasonStart(2027, 1)).toEqual(d(2027, 6, 21));
    expect(seasonStart(2024, 1)).toEqual(d(2024, 6, 20));
  });
  it('next occurrence', () => {
    const today = d(2026, 11, 15);
    expect(nextOccurrence(getHoliday('christmas')!, today)).toEqual(d(2026, 12, 25));
    expect(nextOccurrence(getHoliday('easter')!, today)).toEqual(d(2027, 3, 28));
    expect(nextOccurrence(getHoliday('christmas')!, d(2026, 12, 25))).toEqual(d(2026, 12, 25));
    expect(nextMonthDay(2, 29, today)).toEqual(d(2028, 2, 29));
    expect(nextMonthDay(11, 15, today)).toEqual(today);
  });
  it('slugs are unique and lowercase', () => {
    const slugs = HOLIDAYS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9-]+$/));
    expect(HOLIDAYS.length).toBeGreaterThanOrEqual(40);
  });
  it('federal observed holidays', () => {
    const s = usFederalHolidaySet([2027]);
    // July 4 2027 is a Sunday → observed Monday July 5
    expect(s.has(toDayNum(d(2027, 7, 5)))).toBe(true);
    // Christmas 2027 is Saturday → observed Friday Dec 24
    expect(s.has(toDayNum(d(2027, 12, 24)))).toBe(true);
  });
});
