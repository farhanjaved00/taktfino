/** PWA manifest per live language – generated so a new language needs no extra file. */
import type { APIRoute } from 'astro';
import { LIVE_LOCALES, type LocaleCode } from '../config/locales';
import { toolsFor, toolPath } from '../config/tool-map';
import { SITE } from '../config/site';
import { t } from '../i18n';

export const getStaticPaths = () => LIVE_LOCALES.map((l) => ({ params: { locale: l.code } }));

export const GET: APIRoute = ({ params }) => {
  const locale = params.locale as LocaleCode;
  const l = LIVE_LOCALES.find((x) => x.code === locale)!;
  const top = toolsFor(locale).slice(0, 2);
  const body = {
    name: `${SITE.name} – ${top.map((x) => t(locale, `tools.${x.id}.name`)).join(' & ')}`,
    short_name: SITE.name,
    lang: l.htmlLang,
    start_url: `/${locale}/?source=pwa`,
    scope: '/',
    display: 'standalone',
    background_color: '#F6F7FB',
    theme_color: '#4338CA',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: top.map((x) => ({ name: t(locale, `tools.${x.id}.name`), url: toolPath(x.id, locale) })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
};
