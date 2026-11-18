import { SITE } from '../../config/site';
import { LIVE_LOCALES, getLocale, type LocaleCode } from '../../config/locales';
import { allPages } from '../../lib/registry';
export function getStaticPaths() { return LIVE_LOCALES.map((l) => ({ params: { locale: l.code } })); }
/** Per-language sitemap with hreflang alternates (xhtml:link). Unreviewed pages are left out until reviewed. */
export async function GET({ params }: { params: { locale: LocaleCode } }) {
  const pages = await allPages();
  const mine = pages.filter((p) => p.locale === params.locale && p.indexable);
  const urls = mine.map((p) => {
    const alts = pages.filter((x) => x.key === p.key && x.indexable);
    const links = alts.length > 1 ? alts.map((a) => `\n    <xhtml:link rel="alternate" hreflang="${getLocale(a.locale).hreflang}" href="${SITE.url}${a.path}"/>`).join('') : '';
    return `  <url><loc>${SITE.url}${p.path}</loc>${p.lastmod ? `<lastmod>${p.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}${links}\n  </url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
