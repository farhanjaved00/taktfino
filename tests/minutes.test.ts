import { describe, it, expect } from 'vitest';
import { splitMinutes, parseMinutes, parseDuration } from '../src/tools/time';

describe('Minuten ↔ Stunden', () => {
  it('splits minutes', () => {
    expect(splitMinutes(135)).toMatchObject({ hours: 2, minutes: 15, decimalHours: 2.25 });
    expect(splitMinutes(45)).toMatchObject({ hours: 0, minutes: 45, decimalHours: 0.75 });
    expect(splitMinutes(1440)).toMatchObject({ hours: 24, minutes: 0, days: 1 });
    expect(splitMinutes(90.5)).toMatchObject({ hours: 1, minutes: 30.5 });
    expect(splitMinutes(-75)).toMatchObject({ neg: true, hours: 1, minutes: 15 });
    expect(splitMinutes(20).seconds).toBe(1200);
  });
  it('parses minute input', () => {
    expect(parseMinutes('135')).toBe(135);
    expect(parseMinutes('90,5')).toBe(90.5);
    expect(parseMinutes('1.440')).toBe(1440);
    expect(parseMinutes('7.5')).toBe(7.5);
    expect(parseMinutes('abc')).toBeNull();
  });
  it('hours input reuses parseDuration (h:mm and decimal)', () => {
    expect(parseDuration('2,25')).toBe(135);
    expect(parseDuration('2:15')).toBe(135);
    expect(parseDuration('1,5')).toBe(90);
    expect(parseDuration('0,1')).toBe(6);
  });
});
