import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each project is one markdown file in src/content/projects/.
// Editable in the CMS as a "Projects" folder collection.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['animation', 'stills', 'motion', 'packaging', 'branding', 'artwork']),
    image: z.string(),                 // poster / thumbnail URL
    video: z.string().optional(),      // hover-to-play + lightbox video URL
    spinFolder: z.string().optional(), // 360° sequence folder (e.g. "2025/12")
    spinPrefix: z.string().optional(), // 360° filename prefix (e.g. "treatos_")
    spinCount: z.number().optional(),  // number of frames
    swatch: z.string().default('navy'),
    order: z.number().default(0),      // controls display order
  }),
});

export const collections = { projects };
