/** Build-time Open Graph images (1200×630 PNG) for the home page, hubs and guides. */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE } from '../../config/site';
import { HUBS } from '../../lib/links';

const font = (pkg: string, file: string) => fs.readFileSync(path.resolve('node_modules', pkg, 'files', file));
const fonts = [
  { name: 'Inter', data: font('@fontsource/inter', 'inter-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Space Grotesk', data: font('@fontsource/space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
];

const CARDS: Record<string, { title: string; sub: string }> = {
  home: { title: 'Count any date, in seconds.', sub: 'Days from today · Countdowns · Age · Hours from now' },
  default: { title: SITE.name, sub: SITE.tagline },
  guides: { title: 'Date & time guides', sub: 'Clear answers with worked examples' },
  ...Object.fromEntries(Object.entries(HUBS).map(([k, h]) => [k, { title: h.name, sub: h.blurb }])),
};

export function getStaticPaths() {
  return Object.keys(CARDS).map((slug) => ({ params: { slug } }));
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export async function GET({ params }: { params: { slug: string } }) {
  const c = CARDS[params.slug] || CARDS.default;
  const tree = el('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#F6F7FB', fontFamily: 'Inter' }, [
    el('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
      el('div', { width: 64, height: 64, borderRadius: 18, background: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        el('div', { width: 30, height: 30, borderRadius: 99, border: '4px solid #fff' })),
      el('div', { fontFamily: 'Space Grotesk', fontSize: 40, color: '#12142A' }, SITE.name),
    ]),
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { fontFamily: 'Space Grotesk', fontSize: 84, lineHeight: 1.05, color: '#12142A', letterSpacing: -2 }, c.title),
      el('div', { fontSize: 34, color: '#565B78', marginTop: 18 }, c.sub),
    ]),
    el('div', { display: 'flex', fontSize: 28, color: '#3730A3' }, 'Free · Updated daily · US, UK & Canada'),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
