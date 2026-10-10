import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { POSTS_CONFIG } from '~/config'
import type { CoverLayout, PostType } from '~/types'

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        pubDate: z.date(),
        tags: z.array(z.string()).optional(),
        updatedDate: z.date().optional(),
        author: z.string().default(POSTS_CONFIG.author),
        cover: image().optional(),
        ogImage: image().optional(),
        recommend: z.boolean().default(false),
        postType: z.custom<PostType>().optional(),
        coverLayout: z.custom<CoverLayout>().optional(),
        pinned: z.boolean().default(false),
        draft: z.boolean().default(false),
        license: z.string().optional(),
        // Links translations whose slugs differ; defaults to the slug.
        translationKey: z.string().optional(),
        // Old URLs of this post; each one gets a page that redirects here.
        aliases: z.array(z.string()).default([]),
      })
      .transform((data) => ({
        ...data,
        ogImage: POSTS_CONFIG.ogImageUseCover && data.cover ? data.cover : data.ogImage,
      })),
})

// Projects are shared by both locales; only the description is translated.
const projects = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/projects',
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.object({ es: z.string(), en: z.string() }),
      githubUrl: z.string().optional(),
      website: z.string().optional(),
      // 'icon' renders iconClass (an Iconify class); 'image' renders icon.
      type: z.enum(['icon', 'image']).default('icon'),
      icon: image().optional(),
      iconClass: z.string().optional(),
      imageClass: z.string().optional(),
      // Fallbacks shown until the live GitHub counts load.
      star: z.number().default(0),
      fork: z.number().default(0),
      date: z.date().optional(),
      draft: z.boolean().default(false),
    }),
})

export const collections = { posts, projects }
