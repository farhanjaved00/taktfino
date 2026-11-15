import { SITE } from '../config/site';
/**
 * Everything is open to search engines and AI search (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, …)
 * so the tools can be cited in AI answers. To opt out of AI *training* only, uncomment the block below.
 */
export function GET() {
  return new Response(`User-agent: *
Allow: /
Disallow: /search/
Disallow: /saved/

# Opt out of AI model training (does not affect Google Search, AI Overviews or ChatGPT search):
# User-agent: GPTBot
# Disallow: /
# User-agent: Google-Extended
# Disallow: /
# User-agent: CCBot
# Disallow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`, { headers: { 'Content-Type': 'text/plain' } });
}
