import { SITE } from '../config/site';
import { LIVE_LOCALES } from '../config/locales';
/** Sitemap index → one sitemap per language (only indexable pages). */
export function GET() {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LIVE_LOCALES.map((l) => `  <sitemap><loc>${SITE.url}/sitemaps/${l.code}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
