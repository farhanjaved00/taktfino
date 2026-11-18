import { describe, it, expect } from 'vitest';
import { monthDays, monthTotals } from '../src/tools/timesheet';

describe('Stundenzettel', () => {
  it('days of a month with weekends and holidays', () => {
    const d = monthDays(2027, 5, 'nw');
    expect(d.length).toBe(31);
    expect(d[0]).toMatchObject({ iso: '2027-05-01', weekday: 6, weekend: true, holiday: 'Tag der Arbeit' });
    expect(d.find((x) => x.iso === '2027-05-27')!.holiday).toBe('Fronleichnam');
    expect(monthDays(2028, 2).length).toBe(29);
  });
  it('totals, target and difference', () => {
    const rows = [
      { iso: '2027-05-03', start: '08:00', end: '16:30', breakMin: 30 },
      { iso: '2027-05-04', start: '08:00', end: '17:30', breakMin: 30 },
      { iso: '2027-05-05', start: '', end: '', breakMin: 30 },
    ];
    const t = monthTotals(rows, { year: 2027, month: 5, country: 'DE', region: 'nw', weeklyHours: 40 });
    expect(t.workedMin).toBe(480 + 540);
    expect(t.daysWorked).toBe(2);
    // May 2027 NRW: 18 working days (Mo–Fr minus Himmelfahrt, Pfingstmontag, Fronleichnam) × 8 h
    expect(t.targetMin).toBe(18 * 480);
    expect(t.diffMin).toBe(1020 - 18 * 480);
  });
  it('flags a too-short break', () => {
    const t = monthTotals([{ iso: '2027-05-03', start: '07:00', end: '17:00', breakMin: 30 }], { year: 2027, month: 5, country: 'DE' });
    expect(t.warnings).toBe(1);
    expect(t.targetMin).toBeNull();
  });
});
