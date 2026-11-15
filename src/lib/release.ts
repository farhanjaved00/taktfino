import release from '../data/release.json';
import { HOLIDAYS } from './holidays';
import { MONTHS, daysInMonth } from './dates';

export type Family = 'days-from-today' | 'weeks-from-today' | 'hours-from-now' | 'days-ago' | 'days-until';
export const FAMILIES: Family[] = ['days-from-today', 'weeks-from-today', 'hours-from-now', 'days-ago', 'days-until'];

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Every page that COULD exist per family (the full plan). Release picks from these. */
export const UNIVERSE: Record<Exclude<Family, 'days-until'>, number[]> = {
  'days-from-today': [...range(1, 365), 400, 500, 1000],
  'weeks-from-today': range(1, 104),
  'hours-from-now': range(1, 168),
  'days-ago': range(1, 365),
};

/** "december-25" style slugs for every calendar day (366 incl. february-29). */
export const MONTH_DAY_SLUGS: { slug: string; m: number; d: number }[] = MONTHS.flatMap((name, i) =>
  range(1, daysInMonth(2028, i + 1)).map((d) => ({ slug: `${name.toLowerCase()}-${d}`, m: i + 1, d })),
);

export function expand(spec: (string | number)[]): number[] {
  const out = new Set<number>();
  for (const item of spec) {
    if (typeof item === 'number') out.add(item);
    else {
      const m = /^(\d+)-(\d+)$/.exec(item);
      if (m) range(+m[1], +m[2]).forEach((n) => out.add(n));
      else if (/^\d+$/.test(item)) out.add(+item);
      else throw new Error(`release.json: cannot read "${item}"`);
    }
  }
  return [...out].sort((a, b) => a - b);
}

type ReleaseFile = Record<string, unknown>;
const R = release as ReleaseFile;

/** Released numbers for a numeric family, validated against the universe. */
export function releasedNumbers(f: Exclude<Family, 'days-until'>): number[] {
  const nums = expand((R[f] as (string | number)[]) || []);
  const allowed = new Set(UNIVERSE[f]);
  const bad = nums.filter((n) => !allowed.has(n));
  if (bad.length) throw new Error(`release.json: ${f} has numbers outside the plan: ${bad.join(', ')}`);
  return nums;
}

export function isReleased(f: Exclude<Family, 'days-until'>, n: number): boolean {
  return releasedNumbers(f).includes(n);
}

export interface DaysUntilTarget {
  slug: string;
  kind: 'holiday' | 'date';
  m?: number;
  d?: number;
}

export function releasedDaysUntil(): DaysUntilTarget[] {
  const spec = ((R['days-until'] as string[]) || []).map(String);
  const out: DaysUntilTarget[] = [];
  const seen = new Set<string>();
  const add = (t: DaysUntilTarget) => { if (!seen.has(t.slug)) { seen.add(t.slug); out.push(t); } };
  for (const s of spec) {
    if (s === 'all-dates') { MONTH_DAY_SLUGS.forEach((x) => add({ slug: x.slug, kind: 'date', m: x.m, d: x.d })); continue; }
    if (s === 'all-holidays') { HOLIDAYS.forEach((h) => add({ slug: h.slug, kind: 'holiday' })); continue; }
    const h = HOLIDAYS.find((x) => x.slug === s);
    if (h) { add({ slug: s, kind: 'holiday' }); continue; }
    const md = MONTH_DAY_SLUGS.find((x) => x.slug === s);
    if (md) { add({ slug: s, kind: 'date', m: md.m, d: md.d }); continue; }
    throw new Error(`release.json: days-until has unknown slug "${s}"`);
  }
  return out;
}

export function releasedCount(): Record<Family, number> {
  return {
    'days-from-today': releasedNumbers('days-from-today').length,
    'weeks-from-today': releasedNumbers('weeks-from-today').length,
    'hours-from-now': releasedNumbers('hours-from-now').length,
    'days-ago': releasedNumbers('days-ago').length,
    'days-until': releasedDaysUntil().length,
  };
}
