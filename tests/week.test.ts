import { describe, it, expect } from 'vitest';
import { weekStart, weeksInYear, weekOf, weekRange, allWeeks } from '../src/tools/week';
import { date as d, toDayNum } from '../src/lib/dates';

describe('Kalenderwoche (ISO 8601)', () => {
  it('weeks per year', () => {
    expect(weeksInYear(2026)).toBe(53); // Jan 1 2026 = Thursday
    expect(weeksInYear(2027)).toBe(52);
    expect(weeksInYear(2020)).toBe(53); // leap year starting Wednesday
    expect(weeksInYear(2032)).toBe(53); // leap year starting Thursday
    expect(weeksInYear(2028)).toBe(52);
  });
  it('week 1 start', () => {
    expect(weekStart(2026, 1)).toEqual(d(2025, 12, 29));
    expect(weekStart(2027, 1)).toEqual(d(2027, 1, 4));
    expect(weekStart(2028, 1)).toEqual(d(2028, 1, 3));
  });
  it('week of a date incl. year boundaries', () => {
    expect(weekOf(d(2026, 11, 18))).toMatchObject({ year: 2026, week: 47, start: d(2026, 11, 16), end: d(2026, 11, 22) });
    expect(weekOf(d(2027, 1, 1))).toMatchObject({ year: 2026, week: 53 });
    expect(weekOf(d(2027, 1, 3))).toMatchObject({ year: 2026, week: 53 });
    expect(weekOf(d(2027, 1, 4))).toMatchObject({ year: 2027, week: 1 });
    expect(weekOf(d(2025, 12, 29))).toMatchObject({ year: 2026, week: 1 });
  });
  it('ranges and validation', () => {
    expect(weekRange(2027, 52)).toMatchObject({ start: d(2027, 12, 27), end: d(2028, 1, 2) });
    expect(weekRange(2027, 53)).toBeNull();
    expect(weekRange(2026, 53)).toMatchObject({ start: d(2026, 12, 28), end: d(2027, 1, 3) });
    expect(weekRange(2026, 0)).toBeNull();
  });
  it('allWeeks is contiguous', () => {
    const w = allWeeks(2027);
    expect(w.length).toBe(52);
    for (let i = 1; i < w.length; i++) expect(toDayNum(w[i].start) - toDayNum(w[i - 1].end)).toBe(1);
    for (const x of w) expect(toDayNum(x.end) - toDayNum(x.start)).toBe(6);
  });
});
