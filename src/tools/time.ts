/** Clock-time and duration helpers (minutes as the base unit). Language-free. */

/** "8:05", "08:05", "8.05" (as clock), "805" → minutes since midnight; null if invalid. */
export function parseClock(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  let m = /^(\d{1,2})[:.](\d{2})$/.exec(t);
  if (!m) { const n = /^(\d{3,4})$/.exec(t); if (n) m = [t, t.slice(0, -2), t.slice(-2)] as unknown as RegExpExecArray; }
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return h * 60 + min;
}

/**
 * Duration input: "7:30" (h:mm), "7,5" or "7.5" (decimal hours), "45m", "2h", "2h 15m" → minutes.
 * Negative allowed with a leading "-".
 */
export function parseDuration(s: string): number | null {
  const t = s.trim().toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  const neg = t.startsWith('-');
  const u = neg ? t.slice(1) : t;
  let r: number | null = null;
  let m: RegExpExecArray | null;
  if ((m = /^(\d+):(\d{1,2})$/.exec(u)) && Number(m[2]) < 60) r = Number(m[1]) * 60 + Number(m[2]);
  else if ((m = /^(?:(\d+(?:[.,]\d+)?)h)?(?:(\d+)m(?:in)?)?$/.exec(u)) && (m[1] || m[2])) r = Math.round(Number((m[1] || '0').replace(',', '.')) * 60) + Number(m[2] || 0);
  else if ((m = /^(\d+(?:[.,]\d+)?)$/.exec(u))) r = Math.round(Number(m[1].replace(',', '.')) * 60);
  return r === null ? null : neg ? -r : r;
}

/** 450 → "7:30", -75 → "-1:15" */
export function formatHM(min: number): string {
  const sign = min < 0 ? '-' : '';
  const a = Math.abs(Math.round(min));
  return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
}

/** 450 → 7.5 (decimal hours, "Industriestunden") rounded to 2 places */
export const toDecimalHours = (min: number) => Math.round((min / 60) * 100) / 100;

/** Industrieminuten: 1 minute = 1/60 hour; returns the 100ths of an hour for 0–59 minutes */
export const industrialMinutes = (min: number) => Math.round((min / 60) * 100);

/** Minutes between two clock times; if end <= start the end is on the next day (night shift). */
export function spanMinutes(start: number, end: number): number {
  return end > start ? end - start : end + 1440 - start;
}

/** Overlap in minutes between [a1,a2) and [b1,b2) */
export const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

/** Minuten → { hours, minutes, decimal hours, days }; e.g. 135 → 2 h 15 min = 2,25 h */
export function splitMinutes(total: number) {
  const neg = total < 0;
  const a = Math.abs(total);
  const h = Math.floor(a / 60);
  const m = Math.round((a - h * 60) * 1000) / 1000; // allow fractional minutes (e.g. 90,5)
  return { neg, hours: h, minutes: m, decimalHours: total / 60, days: total / 1440, seconds: total * 60 };
}

/** Parses a minute count: "135", "135,5", "1.234" (thousands) → number, or null */
export function parseMinutes(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+([.,]\d+)?$/.test(t)) return null;
  const v = /\.\d{3}(,|$)/.test(t) ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}
