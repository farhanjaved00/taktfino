/**
 * Builds a short, page-specific explanation for each long-tail page.
 * Two layers: (1) curated notes for numbers people search with a purpose
 * (refund windows, payment terms, visas…) and (2) computed facts about the
 * actual span from today (weekends crossed, holidays passed, season, year change),
 * so no two pages share the same paragraph. No invented statistics.
 */
import {
  type CalDate, MONTHS, addDays, compare, diffDays, formatMedium, isLeapYear, weekday, weekdayName,
  weeksAndDays, formatNumber, spanStats,
} from './dates';
import { HOLIDAYS } from './holidays';

/** Curated, factual notes for "n days" searches. Keep these general and verifiable. */
const DAY_NOTES: Record<number, string> = {
  1: '1 day from today is simply tomorrow.',
  2: '2 days from today is the day after tomorrow.',
  3: 'A 3-day window is common for short trial periods and for "respond within three days" requests.',
  5: '5 days is one working week if you count business days only.',
  7: 'Exactly one week, so the answer always falls on the same weekday as today.',
  10: '10 days is a common processing time; check whether your deadline means calendar days or business days.',
  14: 'Two weeks — a fortnight. In the UK, most online purchases come with a 14-day cancellation period, and many stores use 14-day return windows.',
  15: 'About half a month. Some employers and lenders use 15-day intervals for pay and payment schedules.',
  21: 'Exactly three weeks, so the result lands on the same weekday as today.',
  28: 'Exactly four weeks — the same weekday as today, and the length of February in a common year.',
  30: 'Roughly one month. "Net 30" payment terms and many 30-day return policies use this count, usually in calendar days.',
  35: 'Five full weeks, so it lands on today’s weekday.',
  40: 'Just under six weeks (5 weeks and 5 days).',
  45: 'About a month and a half. "Net 45" invoice terms and some notice periods use this number.',
  60: 'Roughly two months. Net 60 invoice terms and 60-day notice periods use this count.',
  75: 'About two and a half months.',
  90: 'About three months, or one quarter. Many probation periods last 90 days, and the US Visa Waiver Program and the Schengen short-stay rule both use 90-day limits.',
  100: 'A round-number milestone often used for "first 100 days" goals — a little over three months.',
  120: 'About four months.',
  150: 'About five months.',
  180: 'About six months — half a year. The Schengen area counts short stays within a rolling 180-day window, and many contracts use 6-month review points.',
  270: 'About nine months.',
  365: 'One year in a common year. If the span includes February 29, the result lands one day earlier than the same date next year.',
  400: 'A little over a year and a month.',
  500: 'About 16 and a half months.',
  1000: 'About 2 years and 9 months — a popular milestone for relationships and streaks.',
};

const WEEK_NOTES: Record<number, string> = {
  1: 'One week — the same weekday next week.',
  2: 'Two weeks, often called a fortnight; a common notice period in the US.',
  4: 'Four weeks is 28 days — slightly shorter than most calendar months.',
  6: 'Six weeks is a common recovery and review period, and roughly a month and a half.',
  8: 'Eight weeks is 56 days, just under two months.',
  10: 'Ten weeks is 70 days — about two and a third months.',
  12: 'Twelve weeks is 84 days, close to three months; it is also the end of the first trimester in pregnancy dating.',
  13: 'Thirteen weeks is 91 days — one quarter of a 52-week year.',
  16: 'Sixteen weeks is 112 days, just under four months.',
  20: 'Twenty weeks is 140 days — the halfway point of a 40-week pregnancy.',
  26: 'Twenty-six weeks is half of a 52-week year (182 days).',
  40: 'Forty weeks (280 days) is the standard length of a pregnancy counted from the last menstrual period.',
  52: 'Fifty-two weeks is 364 days — one day short of a common year.',
};

const HOUR_NOTES: Record<number, string> = {
  1: 'One hour from now — handy for timers and short reminders.',
  8: 'Eight hours is a standard work shift or a full night’s sleep.',
  12: 'Twelve hours from now is the same clock time with AM and PM swapped.',
  24: '24 hours from now is the same time tomorrow.',
  36: '36 hours is a day and a half.',
  48: '48 hours is two full days — a common turnaround time for orders and replies.',
  72: '72 hours is three days — often used for return-to-work, refund and response windows.',
  168: '168 hours is exactly one week.',
};

function season(c: CalDate): string {
  const m = c.m;
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 8) return 'summer';
  return 'fall (autumn)';
}

/** Holidays that fall strictly between two dates (max 3, nearest first). */
export function holidaysBetween(from: CalDate, to: CalDate, limit = 3): { name: string; date: CalDate }[] {
  const [a, b] = compare(from, to) <= 0 ? [from, to] : [to, from];
  const out: { name: string; date: CalDate }[] = [];
  for (let y = a.y; y <= b.y; y++) {
    for (const h of HOLIDAYS) {
      if (!h.publicHoliday) continue;
      const c = h.rule(y);
      if (compare(c, a) > 0 && compare(c, b) < 0) out.push({ name: h.name, date: c });
    }
  }
  out.sort((x, y) => compare(x.date, y.date));
  if (compare(from, to) > 0) out.reverse();
  // de-duplicate same-day entries (e.g. Memorial Day / Spring Bank Holiday)
  const seen = new Set<string>();
  return out.filter((x) => { const k = `${x.date.y}-${x.date.m}-${x.date.d}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
}

function leapNote(from: CalDate, to: CalDate): string {
  const [a, b] = compare(from, to) <= 0 ? [from, to] : [to, from];
  for (let y = a.y; y <= b.y; y++) {
    if (!isLeapYear(y)) continue;
    const feb29 = { y, m: 2, d: 29 };
    if (compare(feb29, a) > 0 && compare(feb29, b) <= 0) return ` The span includes the leap day, February 29, ${y}.`;
  }
  return '';
}

/** Explanation paragraph(s) for a "n days/weeks from today / ago" page. */
export function explainSpan(opts: {
  family: 'days-from-today' | 'weeks-from-today' | 'days-ago';
  n: number;
  today: CalDate;
  result: CalDate;
}): string[] {
  const { family, n, today, result } = opts;
  const days = Math.abs(diffDays(today, result));
  const s = spanStats(today, result);
  const past = family === 'days-ago';
  const unit = family === 'weeks-from-today' ? (n === 1 ? 'week' : 'weeks') : (n === 1 ? 'day' : 'days');
  const lead = family === 'weeks-from-today' ? WEEK_NOTES[n] : DAY_NOTES[n];

  const p1: string[] = [];
  if (lead) p1.push(lead);
  if (family === 'weeks-from-today') {
    p1.push(`${n} ${unit} is ${formatNumber(days)} days, or about ${s.months.toFixed(1)} months.`);
  } else if (days >= 7) {
    p1.push(`${n} days is ${weeksAndDays(days)}${days >= 28 ? `, about ${s.months.toFixed(1)} months` : ''}.`);
  }
  const sameWd = days % 7 === 0;
  p1.push(
    sameWd
      ? `Because ${formatNumber(days)} is a multiple of 7, the date is a ${weekdayName(result)} — the same weekday as today.`
      : `It lands on a ${weekdayName(result)} — ${past ? `${days % 7} day${days % 7 === 1 ? '' : 's'} earlier in the week` : `${days % 7} day${days % 7 === 1 ? '' : 's'} later in the week`} than today’s ${weekdayName(today)}.`,
  );

  const p2: string[] = [];
  p2.push(`Counting only Monday to Friday, the span ${past ? 'back to' : 'to'} ${formatMedium(result)} contains ${formatNumber(s.businessDays)} business day${s.businessDays === 1 ? '' : 's'} and ${formatNumber(s.weekendDays)} weekend day${s.weekendDays === 1 ? '' : 's'}.`);
  const wd = weekday(result);
  if (wd === 0 || wd === 6) p2.push(`It lands on a weekend, so if you need a working day, the nearest is ${past ? 'the Friday before' : 'the following Monday'}.`);
  if (result.y !== today.y) p2.push(`The count crosses into ${result.y}${past ? ' (going back)' : ''}.`);
  const hol = holidaysBetween(today, result);
  if (hol.length) p2.push(`Public holidays in between include ${hol.map((h) => `${h.name} (${MONTHS[h.date.m - 1].slice(0, 3)} ${h.date.d})`).join(', ')}.`);
  if (season(result) !== season(today)) p2.push(`The season changes from ${season(today)} to ${season(result)} in the Northern Hemisphere.`);
  const leap = leapNote(today, result);

  return [p1.join(' '), p2.join(' ') + leap];
}

export function explainHours(n: number): string {
  const days = Math.floor(n / 24);
  const rest = n % 24;
  const parts: string[] = [];
  if (HOUR_NOTES[n]) parts.push(HOUR_NOTES[n]);
  if (n >= 24) parts.push(`${n} hours is ${days} day${days === 1 ? '' : 's'}${rest ? ` and ${rest} hour${rest === 1 ? '' : 's'}` : ''}${n % 24 === 0 ? ', so the clock time stays the same' : ''}.`);
  else if (n !== 12) parts.push(`${n} hours is ${formatNumber(n * 60)} minutes, or ${formatNumber(n * 3600)} seconds.`);
  if (n < 24) parts.push(`Depending on the current time, ${n} hours from now may already be tomorrow — the calculator above shows the exact clock time where you are.`);
  parts.push('Daylight saving changes do not affect the result: the calculator counts real elapsed hours.');
  return parts.join(' ');
}

export function explainDaysUntil(opts: { name: string; target: CalDate; today: CalDate; about?: string; ruleText?: string }): string[] {
  const { name, target, today, about, ruleText } = opts;
  const days = diffDays(today, target);
  const s = spanStats(today, target);
  const p1: string[] = [];
  if (about) p1.push(about);
  if (ruleText) p1.push(`Date rule: ${ruleText.charAt(0).toLowerCase()}${ruleText.slice(1)}.`);
  const p2: string[] = [];
  if (days === 0) p2.push(`${name} is today.`);
  else {
    p2.push(`From today there are ${formatNumber(days)} days to go — ${weeksAndDays(days)} — including ${formatNumber(s.businessDays)} business days and ${formatNumber(s.weekendDays)} weekend days.`);
    p2.push(`This year it falls on a ${weekdayName(target)}.`);
    const hol = holidaysBetween(today, target, 2).filter((h) => h.name !== name);
    if (hol.length) p2.push(`Before then you’ll pass ${hol.map((h) => h.name).join(' and ')}.`);
  }
  return [p1.join(' '), p2.join(' ')].filter(Boolean);
}

/** Day after a date, used for "tomorrow" phrasing etc. */
export const nextDay = (c: CalDate) => addDays(c, 1);
