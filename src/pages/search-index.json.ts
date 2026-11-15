import { allPages } from '../lib/pages';
export async function GET() {
  const pages = (await allPages()).map((p) => ({ u: p.path, t: p.title, g: p.group }));
  return new Response(JSON.stringify(pages), { headers: { 'Content-Type': 'application/json' } });
}
