/**
 * Zuschläge für Sonntags-, Feiertags- und Nachtarbeit – steuerfreie Höchstsätze nach § 3b EStG (Germany).
 *  Nacht 20–6 Uhr: 25 %; 0–4 Uhr: 40 %, wenn die Arbeit vor 0 Uhr aufgenommen wurde
 *  Sonntag: 50 %; gesetzlicher Feiertag und 31.12. ab 14 Uhr: 125 %
 *  24.12. ab 14 Uhr, 25./26.12., 1. Mai: 150 %
 *  0–4 Uhr des Folgetags zählt noch zum Sonntag/Feiertag, wenn die Arbeit vor 0 Uhr begann (§ 3b Abs. 3 Nr. 2).
 *  Nacht- und Sonntags-/Feiertagszuschläge sind nebeneinander steuerfrei; an einem Feiertag, der auf einen Sonntag fällt,
 *  gilt nur der (höhere) Feiertagssatz. Steuerfrei nur auf einen Grundlohn bis 50 €/Std. (§ 3b Abs. 2).
 * Whether a surcharge is PAID at all depends on the contract/Tarifvertrag; this module only calculates.
 */
import { addDays, parseISO, formatISO, weekday, toDayNum } from '../lib/dates';
import { parseClock, spanMinutes } from './time';

export const TAXFREE = { night: 25, nightEarly: 40, sunday: 50, holiday: 125, special: 150, maxBase: 50 } as const;
export type DayKind = 'normal' | 'sunday' | 'holiday' | 'special';

export interface SurchargeRates { night: number; sunday: number; holiday: number; special: number } // paid, in %
export interface Shift { date: string; start: string; end: string }
export interface Bucket { minutes: number; paid: number; taxFree: number }
export interface SurchargeResult {
  totalMinutes: number;
  buckets: { night: Bucket; nightEarly: Bucket; sunday: Bucket; holiday: Bucket; special: Bucket };
  paid: number;
  taxFree: number;
  taxable: number;
  invalid: number;
}

/** Kind of a calendar day given a holiday map; minute-of-day decides the 14:00 rules on 24.12./31.12. */
function kindAt(iso: string, minuteOfDay: number, holidays: Set<string>): DayKind {
  const md = iso.slice(5);
  if (md === '12-25' || md === '12-26' || md === '05-01') return 'special';
  if (md === '12-24' && minuteOfDay >= 14 * 60) return 'special';
  if (md === '12-31' && minuteOfDay >= 14 * 60) return 'holiday';
  if (holidays.has(iso)) return 'holiday';
  const c = parseISO(iso)!;
  return weekday(c) === 0 ? 'sunday' : 'normal';
}

export function calcSurcharges(shifts: Shift[], wage: number, paidRates: SurchargeRates, holidays: Set<string> = new Set()): SurchargeResult {
  const b = () => ({ minutes: 0, paid: 0, taxFree: 0 });
  const buckets = { night: b(), nightEarly: b(), sunday: b(), holiday: b(), special: b() };
  const base = Math.min(wage, TAXFREE.maxBase);
  let total = 0, invalid = 0;
  for (const s of shifts) {
    const st = parseClock(s.start), en = parseClock(s.end), d0 = parseISO(s.date);
    if (st === null || en === null || !d0 || st === en) { invalid++; continue; }
    const len = spanMinutes(st, en);
    const startedBeforeMidnight = st + len > 1440; // shift crosses midnight
    const day0 = formatISO(d0);
    for (let i = 0; i < len; i++) {
      const abs = st + i;                 // minutes from 00:00 of the start day
      const dayOffset = Math.floor(abs / 1440);
      const mod = abs % 1440;
      const iso = dayOffset === 0 ? day0 : formatISO(addDays(d0, dayOffset));
      total++;
      // night
      let nightKey: 'night' | 'nightEarly' | null = null;
      if (mod >= 20 * 60 || mod < 6 * 60) nightKey = 'night';
      if (mod < 4 * 60 && dayOffset >= 1 && startedBeforeMidnight) nightKey = 'nightEarly';
      // day kind; 0–4 Uhr after a Sunday/holiday start counts for the previous day (§ 3b Abs. 3 Nr. 2)
      let kind = kindAt(iso, mod, holidays);
      if (dayOffset >= 1 && mod < 4 * 60) {
        const prevIso = formatISO(addDays(d0, dayOffset - 1));
        const prev = kindAt(prevIso, 1439, holidays);
        const rank = { normal: 0, sunday: 1, holiday: 2, special: 3 } as const;
        if (rank[prev] > rank[kind]) kind = prev;
      }
      const perMinWage = wage / 60, perMinBase = base / 60;
      if (nightKey) {
        const legal = nightKey === 'nightEarly' ? TAXFREE.nightEarly : TAXFREE.night;
        const paid = paidRates.night;
        buckets[nightKey].minutes++;
        buckets[nightKey].paid += (paid / 100) * perMinWage;
        buckets[nightKey].taxFree += (Math.min(paid, legal) / 100) * perMinBase;
      }
      if (kind !== 'normal') {
        const legal = TAXFREE[kind];
        const paid = paidRates[kind];
        buckets[kind].minutes++;
        buckets[kind].paid += (paid / 100) * perMinWage;
        buckets[kind].taxFree += (Math.min(paid, legal) / 100) * perMinBase;
      }
    }
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  for (const k of Object.keys(buckets) as (keyof typeof buckets)[]) { buckets[k].paid = r2(buckets[k].paid); buckets[k].taxFree = r2(buckets[k].taxFree); }
  const paid = r2(Object.values(buckets).reduce((s, x) => s + x.paid, 0));
  const taxFree = r2(Object.values(buckets).reduce((s, x) => s + x.taxFree, 0));
  return { totalMinutes: total, buckets, paid, taxFree, taxable: r2(paid - taxFree), invalid };
}

export const isoDayNum = (iso: string) => toDayNum(parseISO(iso)!);
