import { describe, it, expect } from 'vitest';
import plan from '../src/data/release-plan.json';
import release from '../src/data/release.json';
import { expand, UNIVERSE, MONTH_DAY_SLUGS } from '../src/lib/release';
import { HOLIDAYS } from '../src/lib/holidays';

describe('release plan', () => {
  it('every batch is valid when merged into release.json', () => {
    const merged: Record<string, (string | number)[]> = JSON.parse(JSON.stringify(release));
    for (const b of plan.batches) {
      for (const [f, items] of Object.entries(b.add)) merged[f] = [...(merged[f] || []), ...(items as (string | number)[])];
    }
    for (const f of Object.keys(UNIVERSE) as (keyof typeof UNIVERSE)[]) {
      const allowed = new Set(UNIVERSE[f]);
      expect(expand(merged[f]).filter((n) => !allowed.has(n))).toEqual([]);
    }
    const okSlugs = new Set(['all-dates', 'all-holidays', ...HOLIDAYS.map((h) => h.slug), ...MONTH_DAY_SLUGS.map((m) => m.slug)]);
    for (const s of merged['days-until']) expect(okSlugs.has(String(s))).toBe(true);
  });
  it('the full plan reaches the whole universe', () => {
    const merged: Record<string, (string | number)[]> = JSON.parse(JSON.stringify(release));
    for (const b of plan.batches) for (const [f, items] of Object.entries(b.add)) merged[f] = [...(merged[f] || []), ...(items as (string | number)[])];
    for (const f of Object.keys(UNIVERSE) as (keyof typeof UNIVERSE)[]) expect(expand(merged[f]).length).toBe(UNIVERSE[f].length);
  });
});
