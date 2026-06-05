// /llms.txt — a concise, agent-readable summary of the site for AI assistants.
// Generated from the same CMS data (site.json) the page uses, so it never drifts.
// Spec: https://llmstxt.org/
import site from '../data/site.json';

export function GET() {
  const { seo, hero, services, contact } = site as any;
  const lines: string[] = [];

  lines.push('# Nate Winter', '');
  lines.push(`> ${seo.description}`, '');
  lines.push(hero.intro, '');

  lines.push('## Services');
  for (const s of services.items) lines.push(`- ${s.title}: ${s.desc}`);
  lines.push('');

  lines.push('## Contact');
  lines.push(`- Email: ${contact.email}`);
  if (contact.instagram) lines.push(`- Instagram: ${contact.instagram}`);
  if (contact.linkedin) lines.push(`- LinkedIn: ${contact.linkedin}`);
  lines.push('');

  lines.push('## Links');
  lines.push('- Portfolio: https://iamnatewinter.com/');
  lines.push('- Sitemap: https://iamnatewinter.com/sitemap.xml');

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
