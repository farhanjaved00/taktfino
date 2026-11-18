import { describe, it, expect } from 'vitest';
import { parseClock, parseDuration, formatHM, toDecimalHours, industrialMinutes, spanMinutes } from '../src/tools/time';
import { calcDay, calcSheet, requiredBreak } from '../src/tools/worktime';
import { countWorkdays, monthlyWorkdays, holidaysFor as holFiles } from '../src/tools/workdays';
import { holidaysFor, bussUndBettag, easterSunday } from '../src/tools/holiday-rules';
import { monthlyToHourly, hourlyToMonthly, minimumWage, upcomingMinimumWage } from '../src/tools/wage';
import { calcOvertime } from '../src/tools/overtime';
import { date as d } from '../src/lib/dates';

describe('time parsing', () => {
  it('clock', () => {
    expect(parseClock('8:05')).toBe(485);
    expect(parseClock('08.30')).toBe(510);
    expect(parseClock('1730')).toBe(1050);
    expect(parseClock('24:00')).toBe(1440);
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('8:60')).toBeNull();
  });
  it('durations', () => {
    expect(parseDuration('7:30')).toBe(450);
    expect(parseDuration('7,5')).toBe(450);
    expect(parseDuration('7.25')).toBe(435);
    expect(parseDuration('45m')).toBe(45);
    expect(parseDuration('2h 15m')).toBe(135);
    expect(parseDuration('-1:15')).toBe(-75);
    expect(parseDuration('abc')).toBeNull();
  });
  it('formatting & decimal', () => {
    expect(formatHM(450)).toBe('7:30');
    expect(formatHM(-75)).toBe('-1:15');
    expect(toDecimalHours(450)).toBe(7.5);
    expect(toDecimalHours(20)).toBe(0.33);
    expect(industrialMinutes(15)).toBe(25);
    expect(industrialMinutes(45)).toBe(75);
  });
  it('midnight crossing', () => {
    expect(spanMinutes(22 * 60, 6 * 60)).toBe(480);
    expect(spanMinutes(8 * 60, 17 * 60)).toBe(540);
  });
});

describe('ArbZG / AZG / ArG breaks', () => {
  it('Germany § 4 ArbZG', () => {
    expect(requiredBreak(360, 'DE')).toBe(0); // exactly 6 h: no break required
    expect(requiredBreak(361, 'DE')).toBe(30);
    expect(requiredBreak(540, 'DE')).toBe(30); // exactly 9 h
    expect(requiredBreak(541, 'DE')).toBe(45);
  });
  it('Austria § 11 AZG', () => {
    expect(requiredBreak(361, 'AT')).toBe(30);
    expect(requiredBreak(700, 'AT')).toBe(30);
  });
  it('Switzerland Art. 15 ArG', () => {
    expect(requiredBreak(330, 'CH')).toBe(0);
    expect(requiredBreak(331, 'CH')).toBe(15);
    expect(requiredBreak(421, 'CH')).toBe(30);
    expect(requiredBreak(541, 'CH')).toBe(60);
  });
  it('day with too short break', () => {
    const r = calcDay({ date: '2026-11-16', start: '08:00', end: '17:45', breakMin: 30 }, { country: 'DE' });
    expect(r.netMin).toBe(555);
    expect(r.warnings).toContainEqual({ code: 'break_short', required: 45, actual: 30 });
  });
  it('over 10 h in Germany', () => {
    const r = calcDay({ date: '2026-11-16', start: '06:00', end: '17:30', breakMin: 45 }, { country: 'DE' });
    expect(r.netMin).toBe(645);
    expect(r.warnings.some((w) => w.code === 'over_max')).toBe(true);
  });
  it('night shift across midnight, night and Sunday minutes', () => {
    // Saturday 2026-11-21 22:00 → Sunday 06:00
    const r = calcDay({ date: '2026-11-21', start: '22:00', end: '06:00', breakMin: 30 }, { country: 'DE' });
    expect(r.crossesMidnight).toBe(true);
    expect(r.grossMin).toBe(480);
    expect(r.netMin).toBe(450);
    expect(r.nightMin).toBe(420); // 23:00–06:00
    expect(r.sundayMin).toBe(360); // 00:00–06:00 Sunday
  });
  it('early start counts previous night window', () => {
    const r = calcDay({ date: '2026-11-16', start: '05:00', end: '13:30', breakMin: 30 }, { country: 'DE' });
    expect(r.nightMin).toBe(60);
  });
  it('DST change night (Germany, 2027-03-28) counts clock time', () => {
    const r = calcDay({ date: '2027-03-27', start: '22:00', end: '06:00', breakMin: 30 }, { country: 'DE' });
    expect(r.grossMin).toBe(480); // clock-time based; real elapsed is 7 h — documented on the page
  });
  it('holiday minutes', () => {
    const r = calcDay({ date: '2026-12-25', start: '08:00', end: '12:00', breakMin: 0 }, { country: 'DE', holidays: new Map([['2026-12-25', '1. Weihnachtstag']]) });
    expect(r.holidayMin).toBe(240);
  });
  it('rest period § 5 ArbZG', () => {
    const s = calcSheet([
      { date: '2026-11-16', start: '14:00', end: '23:00', breakMin: 45 },
      { date: '2026-11-17', start: '07:00', end: '15:00', breakMin: 30 },
    ], { country: 'DE' });
    expect(s.days[1].warnings).toContainEqual({ code: 'rest_short', rest: 480, min: 660 });
    expect(s.totalNetMin).toBe(495 + 450);
    expect(Object.keys(s.weeks)).toEqual(['2026-W47']);
  });
  it('invalid input', () => {
    expect(calcDay({ date: '2026-11-16', start: '8', end: '17:00', breakMin: 0 }, { country: 'DE' }).valid).toBe(false);
  });
});

describe('holidays', () => {
  it('Easter and Buß- und Bettag', () => {
    expect(easterSunday(2027)).toEqual(d(2027, 3, 28));
    expect(bussUndBettag(2026)).toEqual(d(2026, 11, 18));
    expect(bussUndBettag(2027)).toEqual(d(2027, 11, 17));
    expect(bussUndBettag(2028)).toEqual(d(2028, 11, 22));
  });
  it('counts per Land', () => {
    expect(holidaysFor('nw', 2027).length).toBe(11);
    expect(holidaysFor('by', 2027).length).toBe(14); // 12 + 2 partial
    expect(holidaysFor('be', 2027).length).toBe(10);
    expect(holidaysFor('sn', 2027).map((h) => h.key)).toContain('buss-und-bettag');
    expect(holidaysFor('at', 2027).length).toBe(13);
    expect(holidaysFor('ch-zh', 2027).length).toBe(10);
  });
  it('Fronleichnam 2027', () => {
    expect(holidaysFor('he', 2027).find((h) => h.key === 'fronleichnam')!.date).toBe('2027-05-27');
  });
  it('generated JSON files match the rules', () => {
    for (const r of ['nw', 'by', 'bw', 'ni', 'he', 'at', 'ch-zh']) {
      expect(holFiles(r, [2027]).map((h) => h.date)).toEqual(holidaysFor(r, 2027).map((h) => h.date));
    }
  });
});

describe('workdays', () => {
  it('NRW 2027 full year', () => {
    const r = countWorkdays(d(2027, 1, 1), d(2027, 12, 31), { region: 'nw' });
    // 261 weekdays in 2027; holidays on weekdays in NRW 2027: all 11 except none on weekends? check via result
    expect(r.calendarDays).toBe(365);
    expect(r.weekendDays).toBe(104);
    expect(r.workdays).toBe(261 - r.holidaysOnWorkdays.length);
  });
  it('Bavaria partial holiday toggle', () => {
    const on = countWorkdays(d(2027, 8, 1), d(2027, 8, 31), { region: 'by' });
    const off = countWorkdays(d(2027, 8, 1), d(2027, 8, 31), { region: 'by', partialOn: [] });
    // Aug 15 2027 is a Sunday → no difference; Aug 2028 15 is Tuesday
    expect(on.workdays).toBe(off.workdays);
    const on28 = countWorkdays(d(2028, 8, 1), d(2028, 8, 31), { region: 'by' });
    const off28 = countWorkdays(d(2028, 8, 1), d(2028, 8, 31), { region: 'by', partialOn: [] });
    expect(off28.workdays - on28.workdays).toBe(1);
  });
  it('half days and vacation', () => {
    const r = countWorkdays(d(2026, 12, 21), d(2026, 12, 31), { region: 'he', halfDays: true, vacation: 3 });
    // Mon 21 … Thu 31 Dec 2026: weekdays 21,22,23,24(half),28,29,30,31(half); 25 Fri holiday
    expect(r.workdays).toBe(7);
    expect(r.halfDays).toBe(2);
    expect(r.netWorkdays).toBe(4);
  });
  it('29 February and reversed range', () => {
    const r = countWorkdays(d(2028, 3, 1), d(2028, 2, 28), { region: 'nw' });
    expect(r.calendarDays).toBe(3); // 28, 29 Feb, 1 Mar
  });
  it('monthly table sums to the year', () => {
    const months = monthlyWorkdays('bw', 2027);
    expect(months.reduce((a, b) => a + b, 0)).toBe(countWorkdays(d(2027, 1, 1), d(2027, 12, 31), { region: 'bw' }).workdays);
  });
  it('reports missing data years', () => {
    expect(countWorkdays(d(2030, 1, 1), d(2030, 1, 31), { region: 'nw' }).missingYears).toEqual([2030]);
  });
});

describe('wage & overtime', () => {
  it('monthly ↔ hourly', () => {
    expect(monthlyToHourly(3000, 40)).toBeCloseTo(17.31, 2);
    expect(hourlyToMonthly(13.9, 40)).toBeCloseTo(2409.33, 2);
  });
  it('German minimum wage', () => {
    expect(minimumWage('DE', '2026-11-18')!.hourly).toBe(13.9);
    expect(minimumWage('DE', '2027-01-01')!.hourly).toBe(14.6);
    expect(upcomingMinimumWage('DE', '2026-11-18')!.hourly).toBe(14.6);
    expect(minimumWage('AT', '2026-11-18')).toBeNull();
  });
  it('overtime', () => {
    const r = calcOvertime({ weeklyHours: 40, daysPerWeek: 5, workedMin: [540, 540, 480, 600, 480], hourlyWage: 20, premiumPct: 25 });
    expect(r.dailyTargetMin).toBe(480);
    expect(r.overtimeMin).toBe(240);
    expect(r.daysOff).toBe(0.5);
    expect(r.payout).toBe(100);
    expect(calcOvertime({ weeklyHours: 40, daysPerWeek: 5, workedMin: [420] }).overtimeMin).toBe(-60);
  });
});
