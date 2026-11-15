import {
  type CalDate, addDays, compare, daysInMonth, toDayNum, weekday, todayIn,
} from './dates';

/* -------------------------------------------------------------- date rules */

/** Western (Gregorian) Easter Sunday — anonymous Gregorian algorithm (Meeus/Jones/Butcher). */
export function easterSunday(y: number): CalDate {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y, m: month, d: day };
}

/** nth weekday of a month: nthWeekday(2026, 11, 4, 4) = 4th Thursday of Nov 2026. n = -1 for the last one. */
export function nthWeekday(y: number, m: number, wd: number, n: number): CalDate {
  if (n > 0) {
    const first = weekday({ y, m, d: 1 });
    const d = 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
    return { y, m, d };
  }
  const lastD = daysInMonth(y, m);
  const last = weekday({ y, m, d: lastD });
  return { y, m, d: lastD - ((last - wd + 7) % 7) };
}

/** The Monday on or before a date (used for Victoria Day: Monday preceding May 25). */
function mondayBefore(c: CalDate): CalDate {
  const wd = weekday(c);
  return addDays(c, -(wd === 1 ? 7 : (wd + 6) % 7));
}

/**
 * Equinox / solstice date (Meeus, "Astronomical Algorithms" ch. 27, mean values + periodic terms),
 * returned as the calendar date in US Eastern time, the date most US/Canada calendars print.
 * kind: 0 = March equinox, 1 = June solstice, 2 = September equinox, 3 = December solstice.
 */
export function seasonStart(y: number, kind: 0 | 1 | 2 | 3, timeZone = 'America/New_York'): CalDate {
  const Y = (y - 2000) / 1000;
  const base = [
    2451623.80984 + 365242.37404 * Y + 0.05169 * Y ** 2 - 0.00411 * Y ** 3 - 0.00057 * Y ** 4,
    2451716.56767 + 365241.62603 * Y + 0.00325 * Y ** 2 + 0.00888 * Y ** 3 - 0.0003 * Y ** 4,
    2451810.21715 + 365242.01767 * Y - 0.11575 * Y ** 2 + 0.00337 * Y ** 3 + 0.00078 * Y ** 4,
    2451900.05952 + 365242.74049 * Y - 0.06223 * Y ** 2 - 0.00823 * Y ** 3 + 0.00032 * Y ** 4,
  ][kind];
  const T = (base - 2451545.0) / 36525;
  const W = (35999.373 * T - 2.47) * (Math.PI / 180);
  const dL = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
  const A = [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8];
  const B = [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45];
  const C = [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];
  let S = 0;
  for (let i = 0; i < 24; i++) S += A[i] * Math.cos((B[i] + C[i] * T) * (Math.PI / 180));
  const jde = base + (0.00001 * S) / dL;
  // JDE (TT) → Unix ms; TT−UTC ≈ 69 s, negligible for a calendar date
  const ms = (jde - 2440587.5) * 86_400_000 - 69_000;
  return todayIn(timeZone, new Date(ms));
}

/* ----------------------------------------------------------------- catalog */

export type Country = 'US' | 'UK' | 'CA';

export interface Holiday {
  slug: string;
  name: string;
  /** Short label for chips/cards */
  short?: string;
  countries: Country[];
  rule: (y: number) => CalDate;
  /** How the date is set — shown on the page */
  ruleText: string;
  /** One or two factual sentences unique to this holiday */
  about: string;
  /** Is it a public holiday (day off) somewhere? */
  publicHoliday?: string;
}

const fixed = (m: number, d: number) => (y: number): CalDate => ({ y, m, d });

export const HOLIDAYS: Holiday[] = [
  { slug: 'new-year', name: "New Year's Day", short: 'New Year', countries: ['US', 'UK', 'CA'], rule: fixed(1, 1), ruleText: 'Always January 1', about: 'The first day of the Gregorian calendar year.', publicHoliday: 'Public holiday in the US, UK and Canada' },
  { slug: 'martin-luther-king-day', name: 'Martin Luther King Jr. Day', short: 'MLK Day', countries: ['US'], rule: (y) => nthWeekday(y, 1, 1, 3), ruleText: 'Third Monday in January', about: 'A US federal holiday honoring civil rights leader Martin Luther King Jr., observed near his January 15 birthday.', publicHoliday: 'US federal holiday' },
  { slug: 'groundhog-day', name: 'Groundhog Day', countries: ['US', 'CA'], rule: fixed(2, 2), ruleText: 'Always February 2', about: 'A folk tradition in the US and Canada in which a groundhog is said to predict whether spring will come early.' },
  { slug: 'valentines-day', name: "Valentine's Day", short: "Valentine's", countries: ['US', 'UK', 'CA'], rule: fixed(2, 14), ruleText: 'Always February 14', about: 'A day for cards, flowers and gifts between partners and friends. It is not a public holiday.' },
  { slug: 'presidents-day', name: "Presidents' Day", countries: ['US'], rule: (y) => nthWeekday(y, 2, 1, 3), ruleText: 'Third Monday in February', about: "Officially Washington's Birthday, a US federal holiday that falls between February 15 and 21.", publicHoliday: 'US federal holiday' },
  { slug: 'family-day', name: 'Family Day (Canada)', short: 'Family Day', countries: ['CA'], rule: (y) => nthWeekday(y, 2, 1, 3), ruleText: 'Third Monday in February', about: 'A statutory holiday in several Canadian provinces, including Ontario, Alberta and British Columbia.', publicHoliday: 'Provincial holiday in several provinces' },
  { slug: 'st-patricks-day', name: "St. Patrick's Day", short: "St Patrick's", countries: ['US', 'UK', 'CA'], rule: fixed(3, 17), ruleText: 'Always March 17', about: "Ireland's national day, widely celebrated with parades in the US, UK and Canada. It is a bank holiday in Northern Ireland.", publicHoliday: 'Bank holiday in Northern Ireland' },
  { slug: 'mothers-day-uk', name: "Mother's Day (UK)", short: "Mother's Day UK", countries: ['UK'], rule: (y) => addDays(easterSunday(y), -21), ruleText: 'Fourth Sunday of Lent (three weeks before Easter Sunday)', about: 'Also called Mothering Sunday. Because it is tied to Easter, its date moves between early March and early April.' },
  { slug: 'spring', name: 'First Day of Spring', short: 'Spring', countries: ['US', 'UK', 'CA'], rule: (y) => seasonStart(y, 0), ruleText: 'The March equinox (March 19, 20 or 21)', about: 'Astronomical spring in the Northern Hemisphere starts at the March equinox, when day and night are roughly equal in length.' },
  { slug: 'april-fools-day', name: "April Fools' Day", short: 'April Fools', countries: ['US', 'UK', 'CA'], rule: fixed(4, 1), ruleText: 'Always April 1', about: 'A day for practical jokes and hoaxes. It is not a public holiday.' },
  { slug: 'good-friday', name: 'Good Friday', countries: ['US', 'UK', 'CA'], rule: (y) => addDays(easterSunday(y), -2), ruleText: 'The Friday before Easter Sunday', about: 'A Christian holy day. It is a bank holiday in the UK and a statutory holiday across Canada; in the US it is a holiday in some states only.', publicHoliday: 'Public holiday in the UK and Canada' },
  { slug: 'easter', name: 'Easter Sunday', short: 'Easter', countries: ['US', 'UK', 'CA'], rule: easterSunday, ruleText: 'First Sunday after the first full moon on or after March 21 (church calculation)', about: 'Easter can fall anywhere from March 22 to April 25, which is why its date changes so much from year to year.' },
  { slug: 'easter-monday', name: 'Easter Monday', countries: ['UK', 'CA'], rule: (y) => addDays(easterSunday(y), 1), ruleText: 'The day after Easter Sunday', about: 'A bank holiday in England, Wales and Northern Ireland (not Scotland), and a holiday for some workers in Canada.', publicHoliday: 'Bank holiday in England, Wales and Northern Ireland' },
  { slug: 'earth-day', name: 'Earth Day', countries: ['US', 'UK', 'CA'], rule: fixed(4, 22), ruleText: 'Always April 22', about: 'An annual day of environmental events, first held in 1970.' },
  { slug: 'cinco-de-mayo', name: 'Cinco de Mayo', countries: ['US'], rule: fixed(5, 5), ruleText: 'Always May 5', about: 'Commemorates the Mexican army’s victory at the Battle of Puebla in 1862 and is widely celebrated in the US.' },
  { slug: 'mothers-day', name: "Mother's Day (US & Canada)", short: "Mother's Day", countries: ['US', 'CA'], rule: (y) => nthWeekday(y, 5, 0, 2), ruleText: 'Second Sunday in May', about: 'In the US and Canada, Mother’s Day is always the second Sunday of May (the UK date is different).' },
  { slug: 'early-may-bank-holiday', name: 'Early May Bank Holiday', short: 'May Bank Holiday', countries: ['UK'], rule: (y) => nthWeekday(y, 5, 1, 1), ruleText: 'First Monday in May (occasionally moved)', about: 'A UK bank holiday. The government has moved it in some years for national events, so check official notices.', publicHoliday: 'UK bank holiday' },
  { slug: 'victoria-day', name: 'Victoria Day', countries: ['CA'], rule: (y) => mondayBefore({ y, m: 5, d: 25 }), ruleText: 'The last Monday before May 25', about: 'A Canadian statutory holiday marking Queen Victoria’s birthday and the unofficial start of summer.', publicHoliday: 'Statutory holiday in most of Canada' },
  { slug: 'memorial-day', name: 'Memorial Day', countries: ['US'], rule: (y) => nthWeekday(y, 5, 1, -1), ruleText: 'Last Monday in May', about: 'A US federal holiday honoring military personnel who died in service.', publicHoliday: 'US federal holiday' },
  { slug: 'spring-bank-holiday', name: 'Spring Bank Holiday', countries: ['UK'], rule: (y) => nthWeekday(y, 5, 1, -1), ruleText: 'Last Monday in May (occasionally moved)', about: 'A UK bank holiday at the end of May.', publicHoliday: 'UK bank holiday' },
  { slug: 'fathers-day', name: "Father's Day", countries: ['US', 'UK', 'CA'], rule: (y) => nthWeekday(y, 6, 0, 3), ruleText: 'Third Sunday in June', about: 'The US, UK and Canada all celebrate Father’s Day on the third Sunday of June.' },
  { slug: 'summer', name: 'First Day of Summer', short: 'Summer', countries: ['US', 'UK', 'CA'], rule: (y) => seasonStart(y, 1), ruleText: 'The June solstice (June 20 or 21)', about: 'The June solstice brings the longest day of the year in the Northern Hemisphere and starts astronomical summer.' },
  { slug: 'juneteenth', name: 'Juneteenth', countries: ['US'], rule: fixed(6, 19), ruleText: 'Always June 19', about: 'A US federal holiday since 2021, commemorating the end of slavery in the United States.', publicHoliday: 'US federal holiday' },
  { slug: 'canada-day', name: 'Canada Day', countries: ['CA'], rule: fixed(7, 1), ruleText: 'July 1', about: 'Canada’s national day, marking Confederation in 1867.', publicHoliday: 'Statutory holiday in Canada' },
  { slug: 'independence-day', name: 'Independence Day (4th of July)', short: '4th of July', countries: ['US'], rule: fixed(7, 4), ruleText: 'Always July 4', about: 'Marks the adoption of the Declaration of Independence in 1776.', publicHoliday: 'US federal holiday' },
  { slug: 'summer-bank-holiday', name: 'Summer Bank Holiday', countries: ['UK'], rule: (y) => nthWeekday(y, 8, 1, -1), ruleText: 'Last Monday in August (England, Wales, NI)', about: 'The last bank holiday before Christmas in England, Wales and Northern Ireland. Scotland’s is the first Monday in August.', publicHoliday: 'UK bank holiday' },
  { slug: 'labor-day', name: 'Labor Day', countries: ['US', 'CA'], rule: (y) => nthWeekday(y, 9, 1, 1), ruleText: 'First Monday in September', about: 'A public holiday in both the US (Labor Day) and Canada (Labour Day) honoring workers.', publicHoliday: 'Public holiday in the US and Canada' },
  { slug: 'fall', name: 'First Day of Fall (Autumn)', short: 'Fall', countries: ['US', 'UK', 'CA'], rule: (y) => seasonStart(y, 2), ruleText: 'The September equinox (September 22 or 23)', about: 'Astronomical autumn starts at the September equinox, when day and night are again roughly equal.' },
  { slug: 'thanksgiving-canada', name: 'Thanksgiving (Canada)', short: 'Canadian Thanksgiving', countries: ['CA'], rule: (y) => nthWeekday(y, 10, 1, 2), ruleText: 'Second Monday in October', about: 'A statutory holiday in most provinces, celebrated six weeks or so before US Thanksgiving.', publicHoliday: 'Statutory holiday in most provinces' },
  { slug: 'columbus-day', name: "Columbus Day / Indigenous Peoples' Day", short: 'Columbus Day', countries: ['US'], rule: (y) => nthWeekday(y, 10, 1, 2), ruleText: 'Second Monday in October', about: 'A US federal holiday; many states and cities observe it as Indigenous Peoples’ Day.', publicHoliday: 'US federal holiday' },
  { slug: 'halloween', name: 'Halloween', countries: ['US', 'UK', 'CA'], rule: fixed(10, 31), ruleText: 'Always October 31', about: 'Known for costumes and trick-or-treating. It is not a public holiday.' },
  { slug: 'bonfire-night', name: 'Bonfire Night', countries: ['UK'], rule: fixed(11, 5), ruleText: 'Always November 5', about: 'Also called Guy Fawkes Night, it recalls the failed Gunpowder Plot of 1605 with fireworks and bonfires.' },
  { slug: 'veterans-day', name: 'Veterans Day', countries: ['US'], rule: fixed(11, 11), ruleText: 'Always November 11', about: 'A US federal holiday honoring military veterans, held on the anniversary of the 1918 Armistice.', publicHoliday: 'US federal holiday' },
  { slug: 'remembrance-day', name: 'Remembrance Day', countries: ['UK', 'CA'], rule: fixed(11, 11), ruleText: 'Always November 11 (UK services on Remembrance Sunday)', about: 'Marks the 1918 Armistice. It is a statutory holiday in several Canadian provinces; the UK holds services on the nearest Sunday.' },
  { slug: 'thanksgiving', name: 'Thanksgiving (US)', short: 'Thanksgiving', countries: ['US'], rule: (y) => nthWeekday(y, 11, 4, 4), ruleText: 'Fourth Thursday in November', about: 'A US federal holiday that can fall anywhere from November 22 to 28.', publicHoliday: 'US federal holiday' },
  { slug: 'black-friday', name: 'Black Friday', countries: ['US', 'UK', 'CA'], rule: (y) => addDays(nthWeekday(y, 11, 4, 4), 1), ruleText: 'The day after US Thanksgiving', about: 'A major shopping day in the US that is now also widely marketed in the UK and Canada.' },
  { slug: 'cyber-monday', name: 'Cyber Monday', countries: ['US', 'UK', 'CA'], rule: (y) => addDays(nthWeekday(y, 11, 4, 4), 4), ruleText: 'The Monday after US Thanksgiving', about: 'An online shopping day that follows the Black Friday weekend.' },
  { slug: 'winter', name: 'First Day of Winter', short: 'Winter', countries: ['US', 'UK', 'CA'], rule: (y) => seasonStart(y, 3), ruleText: 'The December solstice (December 21 or 22)', about: 'The December solstice is the shortest day of the year in the Northern Hemisphere and starts astronomical winter.' },
  { slug: 'christmas-eve', name: 'Christmas Eve', countries: ['US', 'UK', 'CA'], rule: fixed(12, 24), ruleText: 'Always December 24', about: 'The evening before Christmas Day. It is not a federal or bank holiday, though many businesses close early.' },
  { slug: 'christmas', name: 'Christmas Day', short: 'Christmas', countries: ['US', 'UK', 'CA'], rule: fixed(12, 25), ruleText: 'Always December 25', about: 'A public holiday in the US, UK and Canada.', publicHoliday: 'Public holiday in the US, UK and Canada' },
  { slug: 'boxing-day', name: 'Boxing Day', countries: ['UK', 'CA'], rule: fixed(12, 26), ruleText: 'December 26', about: 'A public holiday in the UK and in some Canadian provinces, known for big retail sales.', publicHoliday: 'Bank holiday in the UK' },
  { slug: 'new-years-eve', name: "New Year's Eve", countries: ['US', 'UK', 'CA'], rule: fixed(12, 31), ruleText: 'Always December 31', about: 'The last day of the year, celebrated at midnight. It is not a public holiday.' },
];

export function getHoliday(slug: string): Holiday | undefined {
  return HOLIDAYS.find((h) => h.slug === slug);
}

/** Next occurrence on or after `from` (today counts). */
export function nextOccurrence(h: Holiday, from: CalDate): CalDate {
  const thisYear = h.rule(from.y);
  return compare(thisYear, from) >= 0 ? thisYear : h.rule(from.y + 1);
}

/** Next occurrence of a month/day on or after `from`; Feb 29 jumps to the next leap year. */
export function nextMonthDay(m: number, d: number, from: CalDate): CalDate {
  for (let y = from.y; y < from.y + 9; y++) {
    if (d <= daysInMonth(y, m)) {
      const c = { y, m, d };
      if (compare(c, from) >= 0) return c;
    }
  }
  throw new Error('unreachable');
}

/** Federal (US) public holidays as day numbers, for business-day maths that skips holidays. */
export function usFederalHolidaySet(years: number[]): Set<number> {
  const slugs = ['new-year', 'martin-luther-king-day', 'presidents-day', 'memorial-day', 'juneteenth', 'independence-day', 'labor-day', 'columbus-day', 'veterans-day', 'thanksgiving', 'christmas'];
  const set = new Set<number>();
  for (const y of years) for (const s of slugs) {
    const c = getHoliday(s)!.rule(y);
    // observed rule: Saturday → Friday, Sunday → Monday
    const wd = weekday(c);
    set.add(toDayNum(wd === 6 ? addDays(c, -1) : wd === 0 ? addDays(c, 1) : c));
  }
  return set;
}
