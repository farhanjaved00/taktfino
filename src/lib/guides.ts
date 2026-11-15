import { getCollection, type CollectionEntry } from 'astro:content';
export type Guide = CollectionEntry<'guides'>;
export async function allGuides(): Promise<Guide[]> {
  const g = await getCollection('guides', (e) => !e.data.draft);
  return g.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export const readingMinutes = (body = '') => Math.max(2, Math.round(body.split(/\s+/).length / 220));
/** Human label for a tool URL used in "relatedTools". */
export function toolLabel(url: string): string {
  const m = /^\/([a-z-]+)\/(?:([a-z0-9-]+)\/)?$/.exec(url);
  if (!m) return url;
  const words = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  if (!m[2]) return words(m[1]);
  if (m[1] === 'days-until') return `Days until ${words(m[2])}`;
  return `${m[2]} ${m[1].replace(/-/g, ' ')}`;
}
export const GUIDE_ART: Record<string, { bg: string; icon: 'cal' | 'hour' | 'cake' | 'clock' | 'globe' | 'book' }> = {
  Work: { bg: '#EEF0FF', icon: 'cal' }, Holidays: { bg: '#FEF3C7', icon: 'hour' }, Life: { bg: '#DCFCE7', icon: 'cake' },
  Time: { bg: '#E0F2FE', icon: 'clock' }, Travel: { bg: '#FCE7F3', icon: 'globe' }, Pregnancy: { bg: '#FFE4E6', icon: 'cal' },
  Calendar: { bg: '#EEF0FF', icon: 'cal' }, School: { bg: '#FEF9C3', icon: 'book' },
};
