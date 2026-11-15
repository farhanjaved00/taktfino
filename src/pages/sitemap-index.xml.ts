import { SITE } from '../config/site';
import { allPages } from '../lib/pages';
export async function GET() {
  const families = [...new Set((await allPages()).map((p) => p.sitemap))];
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${families.map((f) => `  <sitemap><loc>${SITE.url}/sitemaps/${f}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
