import { describe, it, expect } from 'vitest';
import { calcMaternity } from '../src/tools/maternity';
import { date as d } from '../src/lib/dates';

describe('Mutterschutz § 3 MuSchG', () => {
  it('on-time birth: 6 weeks before, 8 weeks after', () => {
    const r = calcMaternity({ due: d(2027, 6, 30) });
    expect(r.start).toEqual(d(2027, 5, 19));
    expect(r.lastWorkday).toEqual(d(2027, 5, 18));
    expect(r.end).toEqual(d(2027, 8, 25));
    expect(r.totalDays).toBe(99); // 42 before incl. start … 56 after
    expect(r.parentalLeaveFrom).toEqual(d(2027, 8, 26));
  });
  it('early birth adds the lost days after birth (≥ 14 weeks in total)', () => {
    const r = calcMaternity({ due: d(2027, 6, 30), birth: d(2027, 6, 20) });
    expect(r.extraDays).toBe(10);
    expect(r.end).toEqual(d(2027, 8, 25)); // 20.06. + 56 + 10
    expect(r.totalDays).toBe(99);
  });
  it('late birth: period before simply runs longer, 8 weeks after the real birth', () => {
    const r = calcMaternity({ due: d(2027, 6, 30), birth: d(2027, 7, 5) });
    expect(r.extraDays).toBe(0);
    expect(r.end).toEqual(d(2027, 8, 30));
    expect(r.totalDays).toBe(104);
  });
  it('12 weeks for premature or multiple births', () => {
    const r = calcMaternity({ due: d(2027, 6, 30), birth: d(2027, 6, 1), extended: true });
    expect(r.weeksAfter).toBe(12);
    expect(r.end).toEqual(d(2027, 9, 22)); // 01.06. + 84 + 29
  });
});
