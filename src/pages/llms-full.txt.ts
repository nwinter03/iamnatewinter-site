// /llms-full.txt — the expanded agent-readable version: everything in /llms.txt
// plus the About story and the complete work index, generated from the same CMS
// content the site renders (site.json + gallery collections), so it never drifts.
// Spec: https://llmstxt.org/
import site from '../data/site.json';
import { getCollection } from 'astro:content';

export async function GET() {
  const { seo, hero, services, about, contact } = site as any;
  const lines: string[] = [];

  lines.push('# Nate Winter', '');
  lines.push(`> ${seo.description}`, '');
  lines.push(hero.intro, '');
  lines.push('Based in Milwaukee, Wisconsin, USA. Works with brands, studios, and teams remotely.', '');

  lines.push('## Services');
  for (const s of services.items) lines.push(`- ${s.title}: ${s.desc}`);
  lines.push('');

  lines.push('## About');
  // about.body is CMS markdown; it reads fine as plain text paragraphs.
  lines.push(String(about.body || '').trim(), '');

  lines.push('## Work index');
  lines.push('All pieces are viewable in the filterable grid at https://iamnatewinter.com/#work', '');
  const galleries = await getCollection('galleries');
  const order = ['animation', 'stills', 'motion', 'packaging', 'branding', 'artwork'];
  const sorted = [...galleries].sort(
    (a, b) => order.indexOf(a.data.category) - order.indexOf(b.data.category)
  );
  for (const g of sorted) {
    lines.push(`### ${g.data.label} (${g.data.items.length})`);
    for (const it of g.data.items) lines.push(`- ${it.title}`);
    lines.push('');
  }

  lines.push('## Contact');
  lines.push(`- Email: ${contact.email}`);
  lines.push('- Contact form: https://iamnatewinter.com/#contact');
  if (contact.instagram) lines.push(`- Instagram: ${contact.instagram}`);
  if (contact.linkedin) lines.push(`- LinkedIn: ${contact.linkedin}`);
  lines.push('');

  lines.push('## Links');
  lines.push('- Portfolio: https://iamnatewinter.com/');
  lines.push('- Concise summary: https://iamnatewinter.com/llms.txt');
  lines.push('- Agent instructions: https://iamnatewinter.com/agents.txt');
  lines.push('- Sitemap: https://iamnatewinter.com/sitemap.xml');

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
