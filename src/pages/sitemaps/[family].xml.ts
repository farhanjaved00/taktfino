/** One sitemap per tool family. Only released pages are listed (they come from the same registry that builds them). */
import { SITE } from '../../config/site';
import { allPages } from '../../lib/pages';
export async function getStaticPaths() {
  const families = [...new Set((await allPages()).map((p) => p.sitemap))];
  return families.map((family) => ({ params: { family } }));
}
export async function GET({ params }: { params: { family: string } }) {
  const today = new Date().toISOString().slice(0, 10);
  const pages = (await allPages()).filter((p) => p.sitemap === params.family);
  // tool pages change daily (the date in the answer), guides use their own updated date
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${SITE.url}${p.path}</loc><lastmod>${p.lastmod ? p.lastmod.toISOString().slice(0, 10) : today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
