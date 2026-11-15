/** One function for "n days/weeks from a date / ago", shared by the build and the browser. */
import { type CalDate, addDays, addBusinessDays } from './dates';

export type SpanFamily = 'days-from-today' | 'weeks-from-today' | 'days-ago';

export function spanResult(family: SpanFamily, n: number, start: CalDate, biz: boolean): CalDate {
  if (family === 'weeks-from-today') return addDays(start, n * 7);
  const sign = family === 'days-ago' ? -1 : 1;
  return biz ? addBusinessDays(start, sign * n) : addDays(start, sign * n);
}

export const SPAN_LIMITS = { min: 1, max: 100000 };
