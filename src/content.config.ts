import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().max(110),
    description: z.string().max(200),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().optional(),
    category: z.enum(['Work', 'Holidays', 'Life', 'Time', 'Travel', 'Pregnancy', 'Calendar', 'School']).default('Calendar'),
    relatedTools: z.array(z.string()).min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
