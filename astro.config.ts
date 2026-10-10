import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1500,
    },
  },
  markdown: {
    syntaxHighlight: false,
    // Astro 7 defaults to Sätteri; keep the unified pipeline for the remark/rehype plugins.
    processor: unified({ remarkPlugins, rehypePlugins }),
  },
  integrations: [expressiveCode(), mdx(), react(), sitemap(), robotsTxt()],
})
