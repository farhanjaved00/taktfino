/** Build-time Open Graph image for every page (1200×630). */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE } from '../../../config/site';
import { LIVE_LOCALES, type LocaleCode } from '../../../config/locales';
import { allPages } from '../../../lib/registry';
import { t } from '../../../i18n';

const font = (pkg: string, file: string) => fs.readFileSync(path.resolve('node_modules', pkg, 'files', file));
const fonts = [
  { name: 'Inter', data: font('@fontsource/inter', 'inter-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Space Grotesk', data: font('@fontsource/space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
];
export async function getStaticPaths() {
  const pages = await allPages();
  const out = pages.filter((p) => p.kind !== 'home').map((p) => ({ params: { locale: p.locale, slug: p.path.split('/').filter(Boolean).slice(1).join('/') }, props: { title: p.title } }));
  for (const l of LIVE_LOCALES) out.push({ params: { locale: l.code, slug: 'default' }, props: { title: t(l.code, 'home.h1') } });
  return out;
}
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
export async function GET({ params, props }: { params: { locale: LocaleCode }; props: { title: string } }) {
  const tree = el('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#F6F7FB', fontFamily: 'Inter' }, [
    el('div', { display: 'flex', alignItems: 'center' }, [
      el('div', { width: 64, height: 64, borderRadius: 18, background: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 18 }, el('div', { width: 30, height: 30, borderRadius: 99, border: '4px solid #fff' })),
      el('div', { fontFamily: 'Space Grotesk', fontSize: 40, color: '#12142A' }, SITE.name),
    ]),
    el('div', { display: 'flex', fontFamily: 'Space Grotesk', fontSize: props.title.length > 40 ? 64 : 80, lineHeight: 1.08, color: '#12142A', letterSpacing: -2 }, props.title),
    el('div', { display: 'flex', fontSize: 28, color: '#3730A3' }, t(params.locale, 'home.pill')),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return new Response(new Uint8Array(new Resvg(svg).render().asPng()), { headers: { 'Content-Type': 'image/png' } });
}
