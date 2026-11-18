import { describe, it, expect } from 'vitest';
import { calcParental } from '../src/tools/parental';
import { calcVacation, roundVacation } from '../src/tools/vacation';
import { date as d } from '../src/lib/dates';

describe('Elternzeit (BEEG)', () => {
  it('12 months after Mutterschutz', () => {
    const r = calcParental({ birth: d(2027, 6, 30), start: d(2027, 8, 26), months: 12 });
    expect(r.end).toEqual(d(2028, 8, 25));
    expect(r.noticeDeadline).toEqual(d(2027, 7, 8));   // 7 weeks before
    expect(r.protectionFrom).toEqual(d(2027, 7, 1));   // 8 weeks before
    expect(r.thirdBirthday).toEqual(d(2030, 6, 30));
    expect(r.beyondThird).toBe(false);
  });
  it('father from birth: notice 7 weeks before the due date', () => {
    const r = calcParental({ birth: d(2027, 6, 30), start: d(2027, 6, 30), months: 2 });
    expect(r.noticeDeadline).toEqual(d(2027, 5, 12));
    expect(r.end).toEqual(d(2027, 8, 29));
  });
  it('period after the 3rd birthday needs 13 weeks notice', () => {
    const r = calcParental({ birth: d(2027, 6, 30), start: d(2031, 1, 1), months: 6 });
    expect(r.noticeDeadline).toEqual(d(2030, 10, 2));
    expect(r.protectionFrom).toEqual(d(2030, 9, 25));
  });
  it('flags a period running past the 3rd birthday', () => {
    expect(calcParental({ birth: d(2027, 6, 30), start: d(2029, 1, 1), months: 24 }).beyondThird).toBe(true);
  });
});

describe('Urlaubsanspruch (BUrlG)', () => {
  it('part-time scaling and legal minimum', () => {
    const r = calcVacation({ contractDays: 30, contractWeekDays: 5, ownWeekDays: 3, year: 2027 });
    expect(r.fullYear).toBe(18);
    expect(r.legalMinimum).toBe(12);
    expect(r.entitlement).toBe(18);
  });
  it('start in the second half: 1/12 per full month', () => {
    const r = calcVacation({ contractDays: 30, contractWeekDays: 5, ownWeekDays: 5, year: 2027, start: d(2027, 7, 15) });
    expect(r.rule).toBe('partial-start');
    expect(r.months).toBe(5);            // 15.07.–14.12. are 5 full months
    expect(r.entitlement).toBe(13);      // 12,5 → rounded up
  });
  it('leaving in the first half: partial', () => {
    const r = calcVacation({ contractDays: 30, contractWeekDays: 5, ownWeekDays: 5, year: 2027, end: d(2027, 4, 30) });
    expect(r.rule).toBe('partial-leave-first-half');
    expect(r.months).toBe(4);
    expect(r.entitlement).toBe(10);
  });
  it('leaving in the second half keeps at least the legal minimum', () => {
    const r = calcVacation({ contractDays: 30, contractWeekDays: 5, ownWeekDays: 5, year: 2027, end: d(2027, 8, 31) });
    expect(r.rule).toBe('full-leave-second-half');
    expect(r.entitlement).toBe(20);      // 8/12 of 30 = 20 = legal minimum
    const r2 = calcVacation({ contractDays: 24, contractWeekDays: 5, ownWeekDays: 5, year: 2027, end: d(2027, 7, 31) });
    expect(r2.entitlement).toBe(20);     // 14 → raised to the legal 20
  });
  it('rounding per § 5 Abs. 2', () => {
    expect(roundVacation(12.5)).toBe(13);
    expect(roundVacation(12.4)).toBe(12.4);
    expect(roundVacation(7.75)).toBe(8);
  });
  it('severe disability +5 days scaled', () => {
    expect(calcVacation({ contractDays: 30, contractWeekDays: 5, ownWeekDays: 4, year: 2027, disabled: true }).entitlement).toBe(28);
  });
});
