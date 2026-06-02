import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One file per category, each holding a bulk list of items.
// Edited in the CMS as separate "Work" screens you load images into.
const galleries = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/galleries' }),
  schema: z.object({
    category: z.enum(['animation', 'stills', 'motion', 'packaging', 'branding', 'artwork']),
    label: z.string(),
    order: z.enum(['curated', 'random']).default('curated'),
    items: z.array(
      z.object({
        title: z.string(),
        image: z.string(),
        video: z.string().optional(),
        spinFolder: z.string().optional(),
        spinPrefix: z.string().optional(),
        spinCount: z.number().optional(),
        swatch: z.string().default('navy'),
      })
    ).default([]),
  }),
});

export const collections = { galleries };
