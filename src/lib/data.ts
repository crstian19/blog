import { getCollection, type CollectionEntry } from 'astro:content'
import { isLocale, localizePath, type Locale } from '~/i18n'

type Post = CollectionEntry<'posts'>

// Posts live in src/content/posts/<locale>/<slug>/, so the entry id is "<locale>/<slug>".
export function getPostLocale(post: Post): Locale {
  const lang = post.id.split('/')[0]
  if (!isLocale(lang)) {
    throw new Error(`Post "${post.id}" must live under src/content/posts/<locale>/, one of es or en`)
  }
  return lang
}

export function getPostSlug(post: Post): string {
  return post.id.split('/').slice(1).join('/')
}

export function getPostUrl(post: Post): string {
  return localizePath(getPostLocale(post), `/post/${getPostSlug(post)}/`)
}

export function getTranslationKey(post: Post): string {
  return post.data.translationKey ?? getPostSlug(post)
}

// Newest first by pubDate. updatedDate is only shown and sent as dateModified, so a
// rewritten old post keeps its place in the list.
export function postsSort(posts: Post[]) {
  return posts.slice().sort((a, b) => {
    return b.data.pubDate.getTime() - a.data.pubDate.getTime()
  })
}

// A post is live once it is not a draft and its pubDate has arrived. A future
// pubDate schedules it: the daily scheduled-publish workflow rebuilds the site
// on that day. Drafts and scheduled posts still render in `astro dev`.
export function isPublished(post: Post): boolean {
  return !post.data.draft && post.data.pubDate.getTime() <= Date.now()
}

async function getPublishedPosts(): Promise<Post[]> {
  const allPosts = await getCollection('posts')
  return allPosts.filter((post) => import.meta.env.DEV || isPublished(post))
}

// 获取所有非草稿文章，按时间排序
export async function getAllPosts(lang: Locale): Promise<Post[]> {
  const posts = await getPublishedPosts()
  return postsSort(posts.filter((post) => getPostLocale(post) === lang))
}

// 获取所有置顶文章
export async function getPinnedPosts(lang: Locale): Promise<Post[]> {
  const posts = await getAllPosts(lang)
  return posts.filter((post) => post.data.pinned)
}

// 获取最新的固定数量的文章
export async function getNumPosts(lang: Locale, size: number): Promise<Post[]> {
  return (await getAllPosts(lang)).slice(0, size)
}

/** The same post in the other locales, keyed by locale. */
export async function getTranslations(post: Post): Promise<Partial<Record<Locale, Post>>> {
  const key = getTranslationKey(post)
  const posts = await getPublishedPosts()
  const found: Partial<Record<Locale, Post>> = {}
  for (const candidate of posts) {
    if (getTranslationKey(candidate) === key) found[getPostLocale(candidate)] = candidate
  }
  return found
}

/** Tag counts keyed by slug, with the first spelling seen as the display name. */
export async function getAllTags(lang: Locale): Promise<Record<string, { name: string; count: number }>> {
  const tags: Record<string, { name: string; count: number }> = {}
  for (const tag of (await getAllPosts(lang)).flatMap((post) => post.data.tags || [])) {
    const slug = tagSlug(tag)
    tags[slug] ??= { name: tag, count: 0 }
    tags[slug].count++
  }
  return tags
}

/** Same rule as Hugo's urlize, so /tags/<tag>/ URLs from the old blog keep working. */
export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-')
}

export function getTagUrl(lang: Locale, tag: string): string {
  return localizePath(lang, `/tags/${tagSlug(tag)}/`)
}

/** Published projects, newest first; undated ones go last. */
export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = (await getCollection('projects')).filter((project) => !project.data.draft)
  return projects.sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0))
}
