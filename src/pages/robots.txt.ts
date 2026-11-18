import { SITE } from '../config/site';
import { LIVE_LOCALES } from '../config/locales';
import { PAGES } from '../config/tool-map';
/** Open to search engines and AI crawlers (GPTBot, PerplexityBot, Google-Extended …) per the plan. */
export function GET() {
  const disallow = LIVE_LOCALES.flatMap((l) => [`Disallow: /${l.code}/${PAGES.search[l.code]}/`, `Disallow: /${l.code}/${PAGES.history[l.code]}/`]);
  return new Response(`User-agent: *\nAllow: /\n${disallow.join('\n')}\n\nSitemap: ${SITE.url}/sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
}
