/** One list of every public page — used by the search index and the sitemaps, so they never disagree. */
import { releasedNumbers, releasedDaysUntil } from './release';
import { HUBS, CATEGORIES, unitLabel } from './links';
import { getHoliday } from './holidays';
import { allGuides } from './guides';

export interface PageEntry { path: string; title: string; group: string; sitemap: string; lastmod?: Date }

export async function allPages(): Promise<PageEntry[]> {
  const out: PageEntry[] = [{ path: '/', title: 'Home', group: 'Pages', sitemap: 'pages' }];
  for (const h of Object.values(HUBS)) out.push({ path: h.path, title: h.name, group: 'Tools', sitemap: 'pages' });
  for (const c of Object.values(CATEGORIES)) out.push({ path: c.path, title: c.name, group: 'Pages', sitemap: 'pages' });
  for (const [p, t] of [['/about/', 'About'], ['/contact/', 'Contact'], ['/privacy/', 'Privacy policy'], ['/terms/', 'Terms of use'], ['/editorial-policy/', 'Editorial policy']])
    out.push({ path: p, title: t, group: 'Pages', sitemap: 'pages' });
  for (const f of ['days-from-today', 'weeks-from-today', 'days-ago', 'hours-from-now'] as const)
    for (const n of releasedNumbers(f)) out.push({ path: `/${f}/${n}/`, title: unitLabel(f, n), group: HUBS[f].name, sitemap: f });
  for (const t of releasedDaysUntil()) {
    const h = t.kind === 'holiday' ? getHoliday(t.slug) : undefined;
    out.push({ path: `/days-until/${t.slug}/`, title: `Days until ${h ? h.name : t.slug.replace(/-(\d+)$/, ' $1')}`, group: 'Countdowns', sitemap: 'days-until' });
  }
  for (const g of await allGuides()) out.push({ path: `/guides/${g.id}/`, title: g.data.title, group: 'Guides', sitemap: 'guides', lastmod: g.data.updated || g.data.date });
  return out;
}
