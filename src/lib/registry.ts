/**
 * The single list of every page per live language. Used for hreflang, sitemaps, search, llms.txt and the
 * keyword-uniqueness check — so they can never disagree.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { LIVE_LOCALES, type LocaleCode } from '../config/locales';
import { TOOLS, REGIONS, CATEGORIES, PAGES, type ToolId, type CategoryId, type PageId, toolPath, categoryPath, pagePath } from '../config/tool-map';
import { t } from '../i18n';

export type Kind = 'home' | 'tool' | 'region' | 'category' | 'article' | 'page';
export interface PageEntry {
  /** Same key across languages = translations of each other (hreflang) */
  key: string;
  locale: LocaleCode;
  path: string;
  kind: Kind;
  title: string;
  indexable: boolean;
  lastmod?: Date;
  keyword?: string;
}

const split = (id: string) => { const i = id.indexOf('/'); return [id.slice(0, i), id.slice(i + 1)] as [LocaleCode, string]; };

export async function toolEntries() { return getCollection('tools'); }
export async function articleEntries() { return getCollection('articles'); }
export async function regionEntries() { return getCollection('regions'); }

export const articlePath = (e: CollectionEntry<'articles'>) => {
  const [loc, slug] = split(e.id);
  return `/${loc}/${CATEGORIES[e.data.category][loc]}/${slug}/`;
};
export const regionPath = (e: CollectionEntry<'regions'>) => {
  const [loc] = split(e.id);
  const r = REGIONS.find((x) => x.code === e.data.region)!;
  return `${toolPath(e.data.tool as ToolId, loc)}${r.slug[loc]}/`;
};
export const entryLocale = (id: string) => split(id)[0];

let cache: PageEntry[] | null = null;
export async function allPages(): Promise<PageEntry[]> {
  if (cache) return cache;
  const live = new Set(LIVE_LOCALES.map((l) => l.code));
  const out: PageEntry[] = [];
  const [tools, articles, regions] = await Promise.all([toolEntries(), articleEntries(), regionEntries()]);
  for (const l of LIVE_LOCALES) {
    out.push({ key: 'home', locale: l.code, path: `/${l.code}/`, kind: 'home', title: t(l.code, 'home.h1'), indexable: true });
    for (const c of Object.keys(CATEGORIES) as CategoryId[])
      out.push({ key: `category:${c}`, locale: l.code, path: categoryPath(c, l.code), kind: 'category', title: t(l.code, `categories.${c}.name`), indexable: true });
    for (const p of Object.keys(PAGES) as PageId[])
      out.push({ key: `page:${p}`, locale: l.code, path: pagePath(p, l.code), kind: 'page', title: p, indexable: p !== 'search' && p !== 'history' && p !== 'imprint' });
  }
  for (const e of tools) {
    const [loc] = split(e.id);
    if (!live.has(loc)) continue;
    out.push({ key: `tool:${e.data.tool}`, locale: loc, path: toolPath(e.data.tool, loc), kind: 'tool', title: e.data.h1, indexable: e.data.reviewed, lastmod: e.data.updated, keyword: e.data.keyword });
  }
  for (const e of regions) {
    const [loc] = split(e.id);
    const r = REGIONS.find((x) => x.code === e.data.region);
    if (!live.has(loc) || !r?.live) continue;
    out.push({ key: `region:${e.data.tool}:${e.data.region}`, locale: loc, path: regionPath(e), kind: 'region', title: e.data.h1, indexable: e.data.reviewed, lastmod: e.data.updated, keyword: e.data.keyword });
  }
  for (const e of articles) {
    const [loc] = split(e.id);
    if (!live.has(loc)) continue;
    out.push({ key: `article:${e.data.translationKey}`, locale: loc, path: articlePath(e), kind: 'article', title: e.data.title, indexable: e.data.reviewed, lastmod: e.data.updated, keyword: e.data.keyword });
  }
  cache = out;
  return out;
}

/** hreflang alternates for a page key (only languages where the page exists and is indexable). */
export async function alternatesFor(key: string) {
  return (await allPages()).filter((p) => p.key === key && p.indexable);
}

export const toolIds = TOOLS.map((t) => t.id);
