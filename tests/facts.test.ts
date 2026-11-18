/** The fact checker that guards AI drafts (scripts/lib/facts.ts) – and every published German page must pass it. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { checkFacts, factsFor, deHolidays, countsPerLand } from '../scripts/lib/facts';

const brief = { keyword: 'feiertage 2027', title: 'Feiertage 2027' };

describe('fact checker', () => {
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
