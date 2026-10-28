import { defineConfig, fontProviders } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'
import { readdirSync, readFileSync } from 'node:fs'

// lastmod for each post URL in the sitemap: updatedDate, else pubDate, read from the
// frontmatter (astro:content isn't available here). Posts live in
// src/content/posts/<locale>/<slug>/index.md(x) and are served at [/en]/post/<slug>/.
function postLastmods(): Map<string, string> {
  const lastmods = new Map<string, string>()
  const root = './src/content/posts'
  for (const locale of readdirSync(root)) {
    for (const slug of readdirSync(`${root}/${locale}`)) {
      const file = readdirSync(`${root}/${locale}/${slug}`).find((f) => /^index\.mdx?$/.test(f))
      if (!file) continue
      const text = readFileSync(`${root}/${locale}/${slug}/${file}`, 'utf8')
      const date = (key: string) => text.match(new RegExp(`^${key}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1]
      const lastmod = date('updatedDate') ?? date('pubDate')
      if (lastmod) lastmods.set(`${locale === 'es' ? '' : `/${locale}`}/post/${slug}/`, lastmod)
    }
  }
  return lastmods
}
const lastmods = postLastmods()

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  // Hugo published every URL with a trailing slash; keep them identical.
  trailingSlash: 'always',
  // Pages of the old Hugo blog that have no equivalent here.
  redirects: {
    '/about/': '/',
    '/readme/': '/',
    '/en/readme/': '/en/',
    '/categories/': '/tags/',
    '/en/categories/': '/en/tags/',
  },
  // Responsive images: every <Image /> and Markdown image gets a srcset and
  // sizes, so phones no longer download the full-size file.
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    // Smaller steps than Astro's default (which starts at 640) for card covers
    // and side-by-side images, which render around 235 and 346px wide.
    breakpoints: [360, 480, 640, 750, 828, 1080, 1280, 1600],
  },
  // Self-hosted variable fonts through the Fonts API: Astro emits the
  // @font-face rules, size-adjusted fallbacks (less layout shift while the
  // font loads) and preloads only what <Font preload /> asks for.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: { variants: [{ src: ['./src/assets/fonts/GeistVF.woff2'], weight: '100 900', style: 'normal' }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Lexend',
      cssVariable: '--font-lexend-face',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: { variants: [{ src: ['./src/assets/fonts/Lexend-VariableFont_wght.woff2'], weight: '100 900', style: 'normal' }] },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono-face',
      fallbacks: ['ui-monospace', 'monospace'],
      options: { variants: [{ src: ['./src/assets/fonts/GeistMono.woff2'], weight: '100 900', style: 'normal' }] },
    },
  ],
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
  integrations: [
    expressiveCode(),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } },
      serialize(item) {
        const lastmod = lastmods.get(new URL(item.url).pathname)
        if (lastmod) item.lastmod = new Date(lastmod).toISOString()
        return item
      },
    }),
    robotsTxt(),
  ],
})
