import { describe, it, expect } from 'vitest';
import { calcNotice, endBasic, endMonths, endProbation, extendedMonths } from '../src/tools/notice';
import { date as d } from '../src/lib/dates';

describe('Kündigungsfrist § 622 BGB', () => {
  it('basic period: 4 weeks to the 15th or month end', () => {
    expect(endBasic(d(2027, 1, 3))).toEqual(d(2027, 1, 31));   // latest receipt for end of January
    expect(endBasic(d(2027, 1, 4))).toEqual(d(2027, 2, 15));
    expect(endBasic(d(2027, 1, 18))).toEqual(d(2027, 2, 15));  // latest receipt for Feb 15
    expect(endBasic(d(2027, 1, 19))).toEqual(d(2027, 2, 28));
    expect(endBasic(d(2028, 2, 1))).toEqual(d(2028, 2, 29));   // leap year month end
  });
  it('month periods to the end of a calendar month', () => {
    expect(endMonths(d(2027, 3, 31), 1)).toEqual(d(2027, 4, 30));
    expect(endMonths(d(2027, 4, 1), 1)).toEqual(d(2027, 5, 31));
    expect(endMonths(d(2027, 3, 15), 3)).toEqual(d(2027, 6, 30));
    expect(endMonths(d(2027, 2, 10), 3, 'quarter')).toEqual(d(2027, 6, 30));
  });
  it('probation: 2 weeks to any day', () => {
    expect(endProbation(d(2027, 1, 4))).toEqual(d(2027, 1, 18));
  });
  it('extended periods by years employed', () => {
    expect(extendedMonths(1)).toBe(0);
    expect(extendedMonths(2)).toBe(1);
    expect(extendedMonths(7)).toBe(2);
    expect(extendedMonths(9)).toBe(3);
    expect(extendedMonths(11)).toBe(4);
    expect(extendedMonths(14)).toBe(5);
    expect(extendedMonths(19)).toBe(6);
    expect(extendedMonths(25)).toBe(7);
  });
  it('employer vs employee', () => {
    const base = { receipt: d(2027, 3, 10), start: d(2017, 1, 1) }; // 10 years → 4 months
    expect(calcNotice({ ...base, party: 'employer' })).toMatchObject({ rule: 'extended', months: 4, endDate: d(2027, 7, 31) });
    expect(calcNotice({ ...base, party: 'employee' })).toMatchObject({ rule: 'basic', endDate: d(2027, 4, 15) });
    expect(calcNotice({ ...base, party: 'employee', employeeSameAsEmployer: true })).toMatchObject({ rule: 'extended', endDate: d(2027, 7, 31) });
  });
  it('years counted at receipt', () => {
    expect(calcNotice({ party: 'employer', receipt: d(2027, 2, 28), start: d(2025, 3, 1) })).toMatchObject({ rule: 'basic', yearsEmployed: 1 });
    expect(calcNotice({ party: 'employer', receipt: d(2027, 3, 1), start: d(2025, 3, 1) })).toMatchObject({ rule: 'extended', months: 1, endDate: d(2027, 4, 30) });
  });
  it('contract longer than the law wins', () => {
    const r = calcNotice({ party: 'employee', receipt: d(2027, 3, 10), start: d(2024, 1, 1), contractMonths: 3, contractEnd: 'quarter' });
    expect(r).toMatchObject({ rule: 'contract', endDate: d(2027, 6, 30) });
    const r2 = calcNotice({ party: 'employer', receipt: d(2027, 3, 10), start: d(2007, 1, 1), contractMonths: 1 });
    expect(r2.rule).toBe('extended'); // 20 years → 7 months beats 1 month
  });
  it('probation overrides', () => {
    expect(calcNotice({ party: 'employer', receipt: d(2027, 3, 10), start: d(2027, 1, 1), probation: true })).toMatchObject({ rule: 'probation', endDate: d(2027, 3, 24) });
  });
  it('latest receipt date for the nearest end', () => {
    expect(calcNotice({ party: 'employee', receipt: d(2027, 1, 10), start: d(2020, 1, 1) }).latestReceiptForEnd).toEqual(d(2027, 1, 18));
    expect(calcNotice({ party: 'employer', receipt: d(2027, 3, 10), start: d(2022, 1, 1) }).latestReceiptForEnd).toEqual(d(2027, 3, 31)); // 5y → 2 months → May 31 needs receipt by Mar 31
  });
});
