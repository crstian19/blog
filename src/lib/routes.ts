import type { PaginateFunction } from 'astro'
import { POSTS_CONFIG } from '~/config'
import { LOCALES, localizePath, type Locale } from '~/i18n'
import { getAllPosts, getAllTags, getPostSlug, getPostUrl, getTranslations, tagSlug } from '~/lib/data'

// Each route exists twice, as src/pages/<route> (Spanish) and src/pages/en/<route>,
// so the Spanish URLs keep the unprefixed paths the Hugo blog used. Both copies
// call these helpers and render the same view from src/views/.

export async function postListPaths(lang: Locale, paginate: PaginateFunction) {
  return paginate(await getAllPosts(lang), { pageSize: POSTS_CONFIG.postPageConfig.size })
}

export async function postPaths(lang: Locale) {
  const posts = await getAllPosts(lang)
  return Promise.all(
    posts.map(async (post, index) => {
      const translations = await getTranslations(post)
      const alternates = Object.fromEntries(Object.entries(translations).map(([locale, p]) => [locale, getPostUrl(p)]))
      return {
        params: { slug: getPostSlug(post) },
        props: {
          post,
          posts,
          prev: index + 1 < posts.length ? posts[index + 1] : null,
          next: index > 0 ? posts[index - 1] : null,
          alternates,
        },
      }
    })
  )
}

export async function tagPaths(lang: Locale, paginate: PaginateFunction) {
  const [posts, tags] = await Promise.all([getAllPosts(lang), getAllTags(lang)])
  const tagsByLocale = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, await getAllTags(l)] as const)))

  return Object.entries(tags).flatMap(([slug, { name }]) => {
    const tagPosts = posts.filter((post) => post.data.tags?.some((tag) => tagSlug(tag) === slug))
    const alternates = Object.fromEntries(
      LOCALES.filter((l) => tagsByLocale[l][slug]).map((l) => [l, localizePath(l, `/tags/${slug}/`)])
    ) as Partial<Record<Locale, string>>
    return paginate(tagPosts, {
      params: { tag: slug },
      props: { tag: name, slug, alternates },
      pageSize: POSTS_CONFIG.tagsPageConfig.size,
    })
  })
}
