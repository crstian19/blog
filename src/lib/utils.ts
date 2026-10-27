import type { CollectionEntry } from 'astro:content'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from '~/i18n'

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

// Newest first by pubDate. updatedDate is only shown and sent as dateModified, so a
// rewritten old post keeps its place in the list.
export function postsSort(posts: CollectionEntry<'posts'>[]) {
  return posts.slice().sort((a, b) => {
    return b.data.pubDate.getTime() - a.data.pubDate.getTime()
  })
}

// 日期格式化类型
export type DateFormat = 'default' | 'dot' | 'short' | 'iso' | 'chinese'

// 日期格式化函数
export const formatDate = (date: Date, format: DateFormat = 'default', lang: Locale = DEFAULT_LOCALE): string => {
  switch (format) {
    case 'dot':
      // 2020.03.03 格式
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}.${month}.${day}`

    case 'short':
      // Mar 3, 2020 格式
      return date.toLocaleDateString(LOCALE_TAGS[lang], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

    case 'iso':
      // 2020-03-03 格式
      return date.toISOString().split('T')[0]

    case 'chinese':
      // 2020年3月3日 格式
      const chineseYear = date.getFullYear()
      const chineseMonth = date.getMonth() + 1
      const chineseDay = date.getDate()
      return `${chineseYear}年${chineseMonth}月${chineseDay}日`

    case 'default':
    default:
      // March 3, 2020 格式（默认）
      return date.toLocaleDateString(LOCALE_TAGS[lang], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
  }
}
