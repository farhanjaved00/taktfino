import { describe, it, expect } from 'vitest';
import { expand, releasedNumbers, releasedDaysUntil, MONTH_DAY_SLUGS, UNIVERSE } from '../src/lib/release';

describe('release config', () => {
  it('expands ranges', () => {
    expect(expand(['1-3', 5, '7'])).toEqual([1, 2, 3, 5, 7]);
    expect(expand([3, '1-3'])).toEqual([1, 2, 3]);
    expect(() => expand(['abc'])).toThrow();
  });
  it('current release is valid', () => {
    for (const f of Object.keys(UNIVERSE) as (keyof typeof UNIVERSE)[]) expect(releasedNumbers(f).length).toBeGreaterThan(0);
    expect(releasedDaysUntil().length).toBeGreaterThan(0);
  });
  it('has 366 month-day slugs', () => {
    expect(MONTH_DAY_SLUGS.length).toBe(366);
    expect(MONTH_DAY_SLUGS.find((x) => x.slug === 'february-29')).toBeTruthy();
  });
  it('universe sizes match the plan', () => {
    expect(UNIVERSE['days-from-today'].length).toBe(368);
    expect(UNIVERSE['weeks-from-today'].length).toBe(104);
    expect(UNIVERSE['hours-from-now'].length).toBe(168);
    expect(UNIVERSE['days-ago'].length).toBe(365);
  });
});
