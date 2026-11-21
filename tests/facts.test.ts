/** The fact checker that guards AI drafts (scripts/lib/facts.ts) – and every published German page must pass it. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { checkFacts, factsFor, deHolidays, countsPerLand, keywordStuffing } from '../scripts/lib/facts';

const brief = { keyword: 'feiertage 2027', title: 'Feiertage 2027' };

describe('fact checker', () => {
  it('checks minimum wages in tables whose header says Mindestlohn', () => {
    const b = { keyword: 'minijob 2027', title: 'Minijob 2027' };
    const table = (w: string) => `| Jahr | Mindestlohn | Minijob-Grenze |\n|---|---|---|\n| 2026 | ${w} | 603 € |\n| 2027 | 14,60 € | 633 € |`;
    expect(checkFacts(table('12,41 €'), b).some((i) => i.includes('Mindestlohn 12,41'))).toBe(true);
    expect(checkFacts(table('13,90 €'), b)).toEqual([]);
  });
  it('knows the 2027 facts', () => {
    const h = deHolidays(2027);
    expect(h.filter((x) => x.full.length === 16)).toHaveLength(9);
    expect(h.find((x) => x.key === 'reformationstag')!.full.sort()).toEqual(['bb', 'hb', 'hh', 'mv', 'ni', 'sh', 'sn', 'st', 'th']);
    expect(countsPerLand(2027).st.full).toBe(11);
    expect(factsFor({ ...brief, tool: 'workdays' })).toContain('Bundesweit gelten genau 9 Feiertage');
  });
  it('catches the errors of the first AI draft', () => {
    const bad = [
      '## Bundesweite Feiertage 2027', '| Feiertag | Datum | Wochentag |', '| --- | --- | --- |', '| Fronleichnam | 27.5.2027 | Donnerstag |', '',
      '| Feiertag | Datum | Wochentag | Bundesländer |', '| --- | --- | --- | --- |', '| Reformationstag | 31.10.2027 | Sonntag | BB, MV, SN, ST, SH, TH |',
      '| Allerheiligen | 2.11.2027 | Montag | BW, BY, NW, RP, SL |', '',
      '| Bundesland | Anzahl Feiertage |', '| --- | --- |', '| Sachsen-Anhalt | 12 |', '| Schleswig-Holstein | 9 |', '',
      'Neujahr ist am 1.1.2027, einem Samstag.', 'Es gibt zehn bundesweite Feiertage.',
      '- **Schweiz:** Neben bundesweiten Feiertagen wie Karfreitag gibt es kantonale Feiertage.',
      'Der Mindestlohn beträgt 2027 14,20 € pro Stunde.', '2027 hat 53 Kalenderwochen.',
    ].join('\n');
    const issues = checkFacts(bad, brief).join('\n');
    for (const s of ['Fronleichnam steht', 'es fehlen HB, HH, NI', 'Allerheiligen“ ist 1.11.2027', 'Sachsen-Anhalt hat 2027 11', 'Schleswig-Holstein hat 2027 10',
      'ist Freitag, nicht Samstag', '9 bundesweite Feiertage', 'Schweiz', 'Mindestlohn 14,20', '2027 hat 52']) expect(issues).toContain(s);
  });
  it('accepts correct statements', () => {
    const good = [
      '| Feiertag | Datum | Wochentag | Bundesländer |', '| --- | --- | --- | --- |',
      '| Reformationstag | 31.10.2027 | Sonntag | BB, HB, HH, MV, NI, SN, ST, SH, TH |',
      '| Fronleichnam | 27.5.2027 | Donnerstag | BW, BY, HE, NW, RP, SL; teilweise SN, TH |', '',
      'Bundesweit gelten 9 bundesweite Feiertage. Der Mindestlohn steigt 2027 auf 14,60 € pro Stunde.',
      'Welche Jahre haben 53 Kalenderwochen? 2026 hat 53 Kalenderwochen.',
    ].join('\n');
    expect(checkFacts(good, brief)).toEqual([]);
  });
});

describe('second draft (Brückentage 2027)', () => {
  const b = { keyword: 'brückentage 2027', title: 'Brückentage 2027' };
  it('catches wrong free-day spans', () => {
    const t = ['| Zeitraum | Feiertag |', '| --- | --- |', '| 28. März – 1. April | Ostern |', '| 1. – 4. Januar 2027 | Neujahr |', '| 8. – 10. März 2027 | Int. Frauentag |'].join('\n');
    expect(checkFacts(t, b)).toHaveLength(3);
  });
  it('accepts correct spans and bridge-day lines', () => {
    const t = ['| Zeitraum | Feiertag |', '| --- | --- |', '| 6.–9. Mai 2027 | Christi Himmelfahrt |', '| 26.–29. März | Ostern |', '',
      '- Freitag, 7. Mai 2027 (nach Christi Himmelfahrt)', 'Vom 27. bis 30. Mai haben Sie nach Fronleichnam frei.'].join('\n');
    expect(checkFacts(t, b)).toEqual([]);
  });
  it('flags keyword stuffing', () => {
    expect(keywordStuffing('**NRW (brückentage 2027 nrw):** Die Brückentage …', ['brückentage 2027 nrw'])).toHaveLength(1);
    expect(keywordStuffing('Die Brückentage 2027 in NRW sind …', ['brückentage 2027 nrw'])).toEqual([]);
  });
});

describe('calendar days (not holidays)', () => {
  it('computes them from Easter and fixed rules', async () => {
    const { specialDays } = await import('../scripts/lib/facts');
    const d = Object.fromEntries(specialDays(2027).map((x) => [x.key, x.date]));
    expect(d.rosenmontag).toBe('2027-02-08');
    expect(d.muttertag).toBe('2027-05-09');
    expect(d['advent-1']).toBe('2027-11-28');
    expect(d.totensonntag).toBe('2027-11-21');
    expect(d['zeitumstellung-maerz']).toBe('2027-03-28');
    expect(d['zeitumstellung-oktober']).toBe('2027-10-31');
  });
  it('flags a wrong date for them', () => {
    const b = { keyword: 'wann ist muttertag 2027', title: 'Muttertag 2027' };
    expect(checkFacts('Der Muttertag ist 2027 am 16. Mai.', b).join()).toContain('Muttertag');
    expect(checkFacts('Der Muttertag ist 2027 am Sonntag, 9. Mai.', b)).toEqual([]);
  });
});

describe('published German pages pass the fact check', () => {
  for (const type of ['articles', 'regions', 'tools']) {
    const dir = path.join('src/content', type, 'de');
    for (const f of fs.readdirSync(dir)) {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      if (!/^reviewed: true$/m.test(raw)) continue; // drafts may still be wrong – they are noindex
      it(`${type}/de/${f}`, () => {
        const b = { keyword: raw.match(/^keyword: "?(.*?)"?$/m)![1], title: raw.match(/^title: "?(.*?)"?$/m)![1] };
        expect(checkFacts(raw.split(/^---$/m).slice(2).join('---'), b)).toEqual([]);
      });
    }
  }
  it('runs', () => expect(true).toBe(true));
});
