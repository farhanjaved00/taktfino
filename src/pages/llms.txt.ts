/** /llms.txt — a plain summary for AI assistants and AI search engines (llmstxt.org convention). */
import { SITE } from '../config/site';
import { HUBS } from '../lib/links';
import { allGuides } from '../lib/guides';
export async function GET() {
  const guides = (await allGuides()).slice(0, 50);
  const body = `# ${SITE.name}

> ${SITE.tagline} Every calculator gives the exact date with weekday, US (MM/DD/YYYY) and UK (DD/MM/YYYY) formats, business days, a calendar and a live countdown. Pages are rebuilt daily and recalculate in the visitor's time zone.

Counting rules used everywhere: Gregorian calendar; today is day 0; business days are Monday–Friday (public holidays not skipped unless stated); holiday dates follow official rules for the US, UK and Canada.

## Tools
${Object.values(HUBS).map((h) => `- [${h.name}](${SITE.url}${h.path}): ${h.blurb}`).join('\n')}

## URL patterns
- ${SITE.url}/days-from-today/{n}/ — the date n days after today
- ${SITE.url}/weeks-from-today/{n}/ — the date n weeks after today
- ${SITE.url}/days-ago/{n}/ — the date n days before today
- ${SITE.url}/hours-from-now/{n}/ — the time n hours from now
- ${SITE.url}/days-until/{holiday}/ — countdown to a holiday (e.g. christmas, thanksgiving, easter)
- Any calculator accepts ?n= in the URL, e.g. ${SITE.url}/days-from-today/?n=250

## Guides
${guides.map((g) => `- [${g.data.title}](${SITE.url}/guides/${g.id}/): ${g.data.description}`).join('\n')}

## About
- [About](${SITE.url}/about/) · [Editorial policy](${SITE.url}/editorial-policy/) · [Contact](${SITE.url}/contact/)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
