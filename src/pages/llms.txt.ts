/** /llms.txt — summary for AI assistants and AI search (llmstxt.org). */
import { SITE } from '../config/site';
import { LIVE_LOCALES } from '../config/locales';
import { allPages } from '../lib/registry';
import { t } from '../i18n';
export async function GET() {
  const pages = (await allPages()).filter((p) => p.indexable);
  const parts = LIVE_LOCALES.map((l) => {
    const mine = pages.filter((p) => p.locale === l.code);
    const list = (k: string) => mine.filter((p) => p.kind === k).map((p) => `- [${p.title}](${SITE.url}${p.path})`).join('\n');
    return `## ${l.name}\n\n${t(l.code, 'meta.tagline')}\n\n### Tools\n${list('tool')}\n${list('region')}\n\n### Guides\n${list('article')}`;
  });
  const body = `# ${SITE.name}\n\n> Free date, time, working-hours and pay calculators for Germany, Austria and Switzerland (more languages coming). All calculations run in the browser. Legal rules (ArbZG, AZG, ArG), public holidays per state and the statutory minimum wage are built in and linked to official sources.\n\n${parts.join('\n\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
