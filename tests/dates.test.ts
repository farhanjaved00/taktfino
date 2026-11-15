import { describe, it, expect } from 'vitest';
import * as D from '../src/lib/dates';

const d = D.date;

describe('basics', () => {
  it('leap years', () => {
    expect(D.isLeapYear(2024)).toBe(true);
    expect(D.isLeapYear(2026)).toBe(false);
    expect(D.isLeapYear(1900)).toBe(false);
    expect(D.isLeapYear(2000)).toBe(true);
    expect(D.daysInMonth(2028, 2)).toBe(29);
    expect(D.daysInMonth(2027, 2)).toBe(28);
    expect(D.daysInYear(2028)).toBe(366);
  });
  it('weekday', () => {
    expect(D.weekday(d(1970, 1, 1))).toBe(4);
    expect(D.weekday(d(2026, 11, 15))).toBe(0); // Sunday
    expect(D.weekday(d(2000, 2, 29))).toBe(2); // Tuesday
    expect(D.weekday(d(1969, 12, 31))).toBe(3); // negative day numbers
  });
  it('day of year', () => {
    expect(D.dayOfYear(d(2026, 1, 1))).toBe(1);
    expect(D.dayOfYear(d(2026, 12, 31))).toBe(365);
    expect(D.dayOfYear(d(2028, 12, 31))).toBe(366);
    expect(D.dayOfYear(d(2028, 3, 1))).toBe(61);
  });
  it('ISO week', () => {
    expect(D.isoWeek(d(2026, 1, 1))).toEqual({ year: 2026, week: 1 });
    expect(D.isoWeek(d(2027, 1, 1))).toEqual({ year: 2026, week: 53 });
    expect(D.isoWeek(d(2024, 12, 30))).toEqual({ year: 2025, week: 1 });
  });
  it('validation and parsing', () => {
    expect(D.isValidDate(d(2027, 2, 29))).toBe(false);
    expect(D.parseISO('2028-02-29')).toEqual(d(2028, 2, 29));
    expect(D.parseISO('2027-02-29')).toBeNull();
    expect(D.parseISO('nope')).toBeNull();
    expect(D.formatISO(d(2026, 3, 5))).toBe('2026-03-05');
  });
});

describe('day math', () => {
  it('adds days across months and years', () => {
    expect(D.addDays(d(2026, 11, 15), 14)).toEqual(d(2026, 11, 29));
    expect(D.addDays(d(2026, 12, 25), 10)).toEqual(d(2027, 1, 4));
    expect(D.addDays(d(2026, 11, 15), 180)).toEqual(d(2027, 5, 14));
    expect(D.addDays(d(2026, 11, 15), -30)).toEqual(d(2026, 10, 16));
    expect(D.addDays(d(2028, 2, 28), 1)).toEqual(d(2028, 2, 29));
    expect(D.addDays(d(2027, 2, 28), 1)).toEqual(d(2027, 3, 1));
    expect(D.addDays(d(2026, 1, 1), 365)).toEqual(d(2027, 1, 1));
    expect(D.addDays(d(2028, 1, 1), 365)).toEqual(d(2028, 12, 31));
  });
  it('is not affected by DST transitions', () => {
    // US DST starts 2027-03-14; UK 2027-03-28
    expect(D.addDays(d(2027, 3, 13), 1)).toEqual(d(2027, 3, 14));
    expect(D.addDays(d(2027, 3, 13), 2)).toEqual(d(2027, 3, 15));
    expect(D.diffDays(d(2027, 3, 1), d(2027, 4, 1))).toBe(31);
    expect(D.diffDays(d(2026, 10, 31), d(2026, 11, 2))).toBe(2);
  });
  it('adds weeks', () => {
    expect(D.addWeeks(d(2026, 11, 15), 6)).toEqual(d(2026, 12, 27));
  });
  it('adds months with month-end clamping', () => {
    expect(D.addMonths(d(2027, 1, 31), 1)).toEqual(d(2027, 2, 28));
    expect(D.addMonths(d(2028, 1, 31), 1)).toEqual(d(2028, 2, 29));
    expect(D.addMonths(d(2026, 11, 15), 3)).toEqual(d(2027, 2, 15));
    expect(D.addMonths(d(2026, 3, 31), -1)).toEqual(d(2026, 2, 28));
    expect(D.addMonths(d(2026, 1, 15), -13)).toEqual(d(2024, 12, 15));
    expect(D.addYears(d(2028, 2, 29), 1)).toEqual(d(2029, 2, 28));
  });
  it('diffDays', () => {
    expect(D.diffDays(d(2026, 11, 15), d(2026, 12, 25))).toBe(40);
    expect(D.diffDays(d(2026, 12, 25), d(2026, 11, 15))).toBe(-40);
  });
});

describe('business days', () => {
  it('adds business days skipping weekends', () => {
    // Fri 2026-11-13 + 1 → Mon 16
    expect(D.addBusinessDays(d(2026, 11, 13), 1)).toEqual(d(2026, 11, 16));
    // Sun 2026-11-15 + 5 → Fri 20
    expect(D.addBusinessDays(d(2026, 11, 15), 5)).toEqual(d(2026, 11, 20));
    expect(D.addBusinessDays(d(2026, 11, 16), 10)).toEqual(d(2026, 11, 30));
    expect(D.addBusinessDays(d(2026, 11, 16), 0)).toEqual(d(2026, 11, 16));
  });
  it('subtracts business days', () => {
    expect(D.addBusinessDays(d(2026, 11, 16), -1)).toEqual(d(2026, 11, 13));
  });
  it('skips holidays', () => {
    const h = new Set([D.toDayNum(d(2026, 11, 26))]);
    expect(D.addBusinessDays(d(2026, 11, 25), 1, h)).toEqual(d(2026, 11, 27));
  });
  it('counts business days between', () => {
    expect(D.businessDaysBetween(d(2026, 11, 13), d(2026, 11, 16))).toBe(1);
    expect(D.businessDaysBetween(d(2026, 11, 15), d(2026, 11, 29))).toBe(10);
    expect(D.businessDaysBetween(d(2026, 11, 29), d(2026, 11, 15))).toBe(-10);
    expect(D.businessDaysBetween(d(2026, 1, 1), d(2026, 12, 31))).toBe(260);
    for (let n = 1; n < 60; n++) {
      const start = d(2026, 11, 10);
      const end = D.addBusinessDays(start, n);
      expect(D.businessDaysBetween(start, end)).toBe(n);
    }
  });
  it('holiday-aware count', () => {
    const h = new Set([D.toDayNum(d(2026, 11, 26)), D.toDayNum(d(2026, 11, 28))]); // Thu + Sat
    expect(D.businessDaysBetween(d(2026, 11, 22), d(2026, 11, 29), h)).toBe(4);
  });
});

describe('age and durations', () => {
  it('exact age', () => {
    const a = D.age(d(1990, 5, 20), d(2026, 11, 15));
    expect([a.years, a.months, a.days]).toEqual([36, 5, 26]);
    expect(a.nextBirthday).toEqual(d(2027, 5, 20));
    expect(a.totalDays).toBe(D.diffDays(d(1990, 5, 20), d(2026, 11, 15)));
  });
  it('birthday today', () => {
    const a = D.age(d(2000, 11, 15), d(2026, 11, 15));
    expect([a.years, a.months, a.days]).toEqual([26, 0, 0]);
    expect(a.daysToNextBirthday).toBe(0);
  });
  it('leap-day birthday', () => {
    const a = D.age(d(2000, 2, 29), d(2027, 2, 28));
    expect(a.years).toBe(27); // celebrated on Feb 28 in common years
    expect(D.age(d(2000, 2, 29), d(2027, 2, 27)).years).toBe(26);
    expect(D.age(d(2000, 2, 29), d(2027, 3, 1)).nextBirthday).toEqual(d(2028, 2, 29));
  });
  it('month-end borrow', () => {
    expect(D.ymdBetween(d(2026, 1, 31), d(2026, 3, 1))).toEqual({ years: 0, months: 1, days: 1 });
    expect(D.ymdBetween(d(2026, 11, 15), d(2027, 2, 14))).toEqual({ years: 0, months: 2, days: 30 });
  });
  it('span stats', () => {
    const s = D.spanStats(d(2026, 11, 15), d(2026, 11, 29));
    expect(s.days).toBe(14);
    expect(s.weeks).toBe(2);
    expect(s.hours).toBe(336);
    expect(s.businessDays).toBe(10);
    expect(s.weekendDays).toBe(4);
  });
  it('weeksAndDays', () => {
    expect(D.weeksAndDays(14)).toBe('2 weeks');
    expect(D.weeksAndDays(45)).toBe('6 weeks and 3 days');
    expect(D.weeksAndDays(1)).toBe('1 day');
  });
});

describe('time zones', () => {
  const at = new Date(Date.UTC(2026, 10, 15, 3, 30)); // 03:30 UTC Nov 15
  it('today differs by zone', () => {
    expect(D.todayIn('UTC', at)).toEqual(d(2026, 11, 15));
    expect(D.todayIn('America/Los_Angeles', at)).toEqual(d(2026, 11, 14));
    expect(D.todayIn('Europe/London', at)).toEqual(d(2026, 11, 15));
  });
  it('offsets incl. DST', () => {
    expect(D.tzOffsetMinutes('America/New_York', at)).toBe(-300);
    expect(D.tzOffsetMinutes('America/New_York', new Date(Date.UTC(2026, 6, 1)))).toBe(-240);
    expect(D.tzOffsetMinutes('Europe/London', new Date(Date.UTC(2026, 6, 1)))).toBe(60);
  });
  it('converts PST to EST', () => {
    const r = D.convertTime({ y: 2026, m: 11, d: 15, h: 9, min: 0 }, 'America/Los_Angeles', 'America/New_York');
    expect([r.h, r.min, r.d]).toEqual([12, 0, 15]);
    const r2 = D.convertTime({ y: 2026, m: 11, d: 15, h: 22, min: 15 }, 'America/New_York', 'Europe/London');
    expect([r2.d, r2.h, r2.min]).toEqual([16, 3, 15]);
  });
  it('addHours', () => {
    expect(D.addHours(at, 72).toISOString()).toBe('2026-11-18T03:30:00.000Z');
  });
});

describe('formatting & calendar', () => {
  const c = d(2026, 11, 29);
  it('formats', () => {
    expect(D.formatLong(c)).toBe('Sunday, November 29, 2026');
    expect(D.formatUS(c)).toBe('11/29/2026');
    expect(D.formatUK(c)).toBe('29/11/2026');
    expect(D.formatCompact(c)).toBe('Sun, Nov 29, 2026');
    expect(D.ordinal(1)).toBe('1st');
    expect(D.ordinal(12)).toBe('12th');
    expect(D.ordinal(23)).toBe('23rd');
    expect(D.ordinal(111)).toBe('111th');
    expect(D.formatTime12(0, 5)).toBe('12:05 AM');
    expect(D.formatTime12(15, 0)).toBe('3:00 PM');
  });
  it('month grid', () => {
    const g = D.monthGrid(2026, 11, d(2026, 11, 15), c);
    expect(g.filter((x) => x.date).length).toBe(30);
    expect(g[0].date).toEqual(d(2026, 11, 1)); // Nov 1 2026 is a Sunday
    expect(g.find((x) => x.isResult)!.date).toEqual(c);
    expect(g.find((x) => x.isToday)!.date).toEqual(d(2026, 11, 15));
    const feb = D.monthGrid(2027, 2);
    expect(feb.filter((x) => !x.date).length).toBe(1); // Feb 1 2027 is Monday
  });
});
