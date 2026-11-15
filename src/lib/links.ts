/** URL helpers + navigation. Long-tail links are only produced for RELEASED pages, so we never link to a 404. */
import { releasedNumbers, releasedDaysUntil, type Family } from './release';
import { getHoliday } from './holidays';
import type { IconName } from './icons';

export const HUBS = {
  'days-from-today': { path: '/days-from-today/', name: 'Days from today', blurb: 'Find the date any number of days ahead.' },
  'weeks-from-today': { path: '/weeks-from-today/', name: 'Weeks from today', blurb: 'Add 1 to 104 weeks to today.' },
  'days-until': { path: '/days-until/', name: 'Days until', blurb: 'Countdowns to holidays and any date.' },
  'hours-from-now': { path: '/hours-from-now/', name: 'Hours from now', blurb: 'The exact time a number of hours ahead.' },
  'days-ago': { path: '/days-ago/', name: 'Days ago', blurb: 'The date any number of days in the past.' },
  'date-duration-calculator': { path: '/date-duration-calculator/', name: 'Date duration calculator', blurb: 'Days, weeks and months between two dates.' },
  'age-calculator': { path: '/age-calculator/', name: 'Age calculator', blurb: 'Your exact age in years, months and days.' },
  countdown: { path: '/countdown/', name: 'Countdown timer', blurb: 'A live countdown to any date and time.' },
} as const;
export type HubKey = keyof typeof HUBS;

export const CATEGORIES = {
  'date-tools': { path: '/date-tools/', name: 'Date tools' },
  countdowns: { path: '/countdowns/', name: 'Countdowns' },
  time: { path: '/time/', name: 'Time' },
  age: { path: '/age/', name: 'Age' },
  guides: { path: '/guides/', name: 'Guides' },
} as const;

export const MAIN_NAV = [
  CATEGORIES['date-tools'], CATEGORIES.countdowns, CATEGORIES.time, CATEGORIES.age, CATEGORIES.guides,
];

const cache = new Map<string, Set<number>>();
function rel(f: Exclude<Family, 'days-until'>) {
  if (!cache.has(f)) cache.set(f, new Set(releasedNumbers(f)));
  return cache.get(f)!;
}

/** Path to a numeric long-tail page, or null if that page is not released. */
export function nPath(f: Exclude<Family, 'days-until'>, n: number): string | null {
  return rel(f).has(n) ? `/${f}/${n}/` : null;
}

export function untilPath(slug: string): string | null {
  return releasedDaysUntil().some((t) => t.slug === slug) ? `/days-until/${slug}/` : null;
}

export const unitLabel = (f: Exclude<Family, 'days-until'>, n: number) => {
  switch (f) {
    case 'days-from-today': return `${n} day${n === 1 ? '' : 's'} from today`;
    case 'weeks-from-today': return `${n} week${n === 1 ? '' : 's'} from today`;
    case 'hours-from-now': return `${n} hour${n === 1 ? '' : 's'} from now`;
    case 'days-ago': return `${n} day${n === 1 ? '' : 's'} ago`;
  }
};

export interface NavLink { label: string; href: string }

/** First N released links from a list of candidates. */
export function pick(f: Exclude<Family, 'days-until'>, candidates: number[], max = 99): NavLink[] {
  const out: NavLink[] = [];
  for (const n of candidates) {
    const p = nPath(f, n);
    if (p && !out.some((o) => o.href === p)) out.push({ label: unitLabel(f, n), href: p });
    if (out.length >= max) break;
  }
  return out;
}

export function pickUntil(slugs: string[], max = 99): NavLink[] {
  const out: NavLink[] = [];
  for (const s of slugs) {
    const p = untilPath(s);
    const h = getHoliday(s);
    if (p && h) out.push({ label: `Days until ${h.short || h.name}`, href: p });
    if (out.length >= max) break;
  }
  return out;
}

export function popularLinks(): NavLink[] {
  return [
    ...pick('days-from-today', [14, 90, 30]),
    ...pick('weeks-from-today', [6]),
    ...pick('days-ago', [30]),
    ...pick('hours-from-now', [72]),
    ...pickUntil(['christmas']),
  ].slice(0, 7);
}

export interface CategoryCard { title: string; meta: string; icon: IconName; links: NavLink[]; href: string }

export function categoryCards(): CategoryCard[] {
  return [
    {
      title: 'Date calculators', meta: 'Add or subtract days', icon: 'cal', href: CATEGORIES['date-tools'].path,
      links: [
        { label: HUBS['days-from-today'].name, href: HUBS['days-from-today'].path },
        { label: HUBS['weeks-from-today'].name, href: HUBS['weeks-from-today'].path },
        { label: HUBS['days-ago'].name, href: HUBS['days-ago'].path },
        { label: HUBS['date-duration-calculator'].name, href: HUBS['date-duration-calculator'].path },
      ],
    },
    {
      title: 'Countdowns', meta: 'Holidays and events', icon: 'hour', href: CATEGORIES.countdowns.path,
      links: [...pickUntil(['christmas', 'thanksgiving'], 2), { label: 'Custom countdown', href: HUBS.countdown.path }, { label: 'All holidays', href: HUBS['days-until'].path }],
    },
    {
      title: 'Time', meta: 'Hours and minutes', icon: 'clock', href: CATEGORIES.time.path,
      links: [{ label: HUBS['hours-from-now'].name, href: HUBS['hours-from-now'].path }, ...pick('hours-from-now', [24, 48, 72], 3)],
    },
    {
      title: 'Age', meta: 'Birthdays and ages', icon: 'cake', href: CATEGORIES.age.path,
      links: [{ label: HUBS['age-calculator'].name, href: HUBS['age-calculator'].path }, { label: 'Days between two dates', href: HUBS['date-duration-calculator'].path }],
    },
    {
      title: 'Popular dates', meta: 'Most searched', icon: 'calAdd', href: HUBS['days-from-today'].path,
      links: [...pick('days-from-today', [14, 30, 90, 180], 4)],
    },
    {
      title: 'Guides', meta: 'How-tos and calendars', icon: 'book', href: CATEGORIES.guides.path,
      links: [{ label: 'All guides', href: CATEGORIES.guides.path }],
    },
  ];
}
