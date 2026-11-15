import { SITE } from '../config/site';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /search/\nDisallow: /saved/\n\nSitemap: ${SITE.url}/sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
}
