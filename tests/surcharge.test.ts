import { describe, it, expect } from 'vitest';
import { calcSurcharges } from '../src/tools/surcharge';

const LEGAL = { night: 25, sunday: 50, holiday: 125, special: 150 };

describe('Zuschläge § 3b EStG', () => {
  it('weekday night shift 22–6 started before midnight', () => {
    // Wed 2027-03-10 22:00 → Thu 06:00
    const r = calcSurcharges([{ date: '2027-03-10', start: '22:00', end: '06:00' }], 20, LEGAL);
    expect(r.totalMinutes).toBe(480);
    expect(r.buckets.night.minutes).toBe(240);      // 22–24 and 4–6
    expect(r.buckets.nightEarly.minutes).toBe(240); // 0–4
    expect(r.paid).toBe(40);                        // 8 h × 20 € × 25 %
    expect(r.taxFree).toBe(40);                     // early hours could even be 40 % tax-free, but only 25 % is paid
  });
  it('higher paid night rate: 40 % tax-free only for 0–4 after a pre-midnight start', () => {
    const r = calcSurcharges([{ date: '2027-03-10', start: '22:00', end: '06:00' }], 20, { ...LEGAL, night: 40 });
    expect(r.paid).toBe(64);                        // 8 h × 20 × 40 %
    expect(r.taxFree).toBe(52);                     // 4 h × 20 × 25 % + 4 h × 20 × 40 %
    expect(r.taxable).toBe(12);
  });
  it('a shift starting at 0:00 gets only 25 % at night', () => {
    const r = calcSurcharges([{ date: '2027-03-11', start: '00:00', end: '06:00' }], 20, { ...LEGAL, night: 40 });
    expect(r.buckets.nightEarly.minutes).toBe(0);
    expect(r.taxFree).toBe(30);                     // 6 h × 20 × 25 %
  });
  it('Sunday day shift 50 %', () => {
    const r = calcSurcharges([{ date: '2027-03-14', start: '08:00', end: '16:00' }], 20, LEGAL);
    expect(r.buckets.sunday.minutes).toBe(480);
    expect(r.paid).toBe(80);
  });
  it('Sunday night: night + Sunday add up; 0–4 Monday still counts as Sunday', () => {
    const r = calcSurcharges([{ date: '2027-03-14', start: '22:00', end: '04:00' }], 20, LEGAL);
    expect(r.buckets.sunday.minutes).toBe(360);
    expect(r.buckets.night.minutes + r.buckets.nightEarly.minutes).toBe(360);
    expect(r.paid).toBe(90); // 6 h × 20 € × (25 % + 50 %)
  });
  it('holiday 125 % and special days 150 %', () => {
    const hol = new Set(['2027-05-27']); // Fronleichnam (NRW)
    expect(calcSurcharges([{ date: '2027-05-27', start: '08:00', end: '12:00' }], 20, LEGAL, hol).paid).toBe(100);
    expect(calcSurcharges([{ date: '2027-12-25', start: '08:00', end: '12:00' }], 20, LEGAL).paid).toBe(120);
    expect(calcSurcharges([{ date: '2027-05-01', start: '08:00', end: '10:00' }], 20, LEGAL).buckets.special.minutes).toBe(120);
  });
  it('24.12. and 31.12. only from 14:00', () => {
    const r = calcSurcharges([{ date: '2027-12-24', start: '12:00', end: '16:00' }], 20, LEGAL);
    expect(r.buckets.special.minutes).toBe(120);
    const s = calcSurcharges([{ date: '2027-12-31', start: '12:00', end: '16:00' }], 20, LEGAL);
    expect(s.buckets.holiday.minutes).toBe(120);
  });
  it('tax-free base capped at 50 €/h', () => {
    const r = calcSurcharges([{ date: '2027-03-14', start: '08:00', end: '10:00' }], 80, LEGAL);
    expect(r.paid).toBe(80);     // 2 h × 80 × 50 %
    expect(r.taxFree).toBe(50);  // 2 h × 50 × 50 %
    expect(r.taxable).toBe(30);
  });
  it('invalid rows are counted, not crashing', () => {
    expect(calcSurcharges([{ date: '2027-03-14', start: '8', end: '' }], 20, LEGAL).invalid).toBe(1);
  });
});
