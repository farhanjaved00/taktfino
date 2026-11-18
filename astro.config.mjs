// @ts-check
import { defineConfig } from 'astro/config';

const SITE = process.env.SITE_URL || 'https://www.taktfino.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
