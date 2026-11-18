import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const faq = z.array(z.object({ q: z.string(), a: z.string() })).default([]);
const sources = z.array(z.object({ label: z.string(), url: z.url() })).default([]);
const review = {
  author: z.enum(['author', 'reviewer']).default('author'),
  reviewer: z.enum(['author', 'reviewer']).optional(),
  /** Native-speaker + fact review done? Unreviewed pages are built but noindex and left out of sitemaps. */
  reviewed: z.boolean().default(false),
  updated: z.coerce.date(),
};
const seo = {
  /** Primary keyword — must be unique across the whole site (checked in tests) */
  keyword: z.string(),
  secondary: z.array(z.string()).default([]),
  title: z.string().max(60),
  description: z.string().max(155),
};

/** Text around each tool: src/content/tools/{lang}/{toolId}.md */
const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    tool: z.enum(['worktime', 'hours', 'workdays', 'wage', 'overtime', 'days', 'age', 'week']),
    ...seo,
    h1: z.string(),
    /** 40–60 word direct answer shown above the tool (AI citation) */
    answer: z.string(),
    related: z.array(z.enum(['worktime', 'hours', 'workdays', 'wage', 'overtime', 'days', 'age', 'week'])).max(6).default([]),
    faq, sources, ...review,
  }),
});

/** Guides (spokes): src/content/articles/{lang}/{slug}.md → /{lang}/{category}/{slug}/ */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    ...seo,
    category: z.enum(['work', 'pay', 'dates']),
    /** The hub tool this spoke supports — linked in the first 100 words */
    tool: z.enum(['worktime', 'hours', 'workdays', 'wage', 'overtime', 'days', 'age', 'week']),
    date: z.coerce.date(),
    /** Same value across languages → hreflang between translations */
    translationKey: z.string(),
    faq, sources, ...review,
  }),
});

/** Real-data variant pages: src/content/regions/{lang}/{tool}-{region}.md */
const regions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/regions' }),
  schema: z.object({
    tool: z.literal('workdays'),
    region: z.string(),
    ...seo,
    h1: z.string(),
    answer: z.string(),
    faq, sources, ...review,
  }),
});

export const collections = { tools, articles, regions };
