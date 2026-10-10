// Spanish is served without a prefix and English under /en/, matching the
// URLs the old Hugo blog published, so existing links and search rankings survive.
export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_TAGS: Record<Locale, string> = { es: 'es-ES', en: 'en-US' }
export const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English' }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function getLocale(url: URL): Locale {
  const first = url.pathname.split('/')[1]
  return isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE
}

/** Prefixes a site-relative path ("/post/") with the locale segment when needed. */
export function localizePath(lang: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return lang === DEFAULT_LOCALE ? clean : `/${lang}${clean === '/' ? '/' : clean}`
}

/** Strips the locale segment, so "/en/post/" becomes "/post/". */
export function unlocalizePath(path: string): string {
  const [, first, ...rest] = path.split('/')
  return isLocale(first) && first !== DEFAULT_LOCALE ? `/${rest.join('/')}` : path
}

const es = {
  'site.description':
    'Blog de Cristian, SRE / AI Platform Engineer: Kubernetes, observabilidad, plataformas de inferencia, homelab y open source.',
  'nav.home': 'Inicio',
  'nav.posts': 'Posts',
  'nav.tags': 'Etiquetas',
  'nav.photos': 'Fotos',
  'nav.projects': 'Proyectos',
  'nav.language': 'Idioma',
  'nav.rss': 'Feed RSS',
  'posts.title': 'Posts',
  'posts.description': 'Todos los posts del blog',
  'posts.introduce': 'Todo lo que he ido escribiendo, del más reciente al más antiguo.',
  'posts.readMore': 'Leer más',
  'posts.prevPage': 'Anterior',
  'posts.nextPage': 'Siguiente',
  'posts.toc': 'En esta página',
  'posts.overview': 'Resumen',
  'posts.back': 'Volver a los posts',
  'posts.nextPost': 'Siguiente post',
  'posts.prevPost': 'Post anterior',
  'posts.recommend': 'DESTACADO',
  'posts.updated': 'Actualizado',
  'posts.minutes': 'min',
  'posts.words': 'palabras',
  'posts.views': 'visitas',
  'posts.translation': 'Read in English',
  'posts.comments': 'Comentarios',
  'tags.title': 'Etiquetas',
  'tags.description': 'Todas las etiquetas del blog',
  'tags.introduce': 'Todas las etiquetas de los posts. Pulsa en una para filtrar.',
  'tags.total': 'etiquetas en total',
  'tags.totalOne': 'etiqueta en total',
  'tags.postsTotal': 'posts en total',
  'tags.postsTotalOne': 'post en total',
  'tags.empty': 'Todavía no hay etiquetas',
  'tags.taggedWith': 'Posts con la etiqueta',
  'tags.post': 'post',
  'tags.posts': 'posts',
  'projects.title': 'Proyectos',
  'projects.description': 'Proyectos open source de Cristian',
  'projects.introduce': 'Herramientas, exporters y cacharreos que he ido publicando.',
  'projects.stars': 'Estrellas',
  'projects.forks': 'Forks',
  'projects.website': 'Web',
  'photos.title': 'Fotos',
  'photos.description': 'Fotos que voy haciendo.',
  'photos.introduce': 'Fotos que voy haciendo.',
  'photos.empty': 'Todavía no hay fotos.',
  'search.label': 'Buscar',
  'search.shortcut': 'Buscar (Ctrl+K)',
  'search.exact': 'Exacta',
  'search.exactTitle': 'Coincidencia exacta',
  'search.typeToSearch': 'Escribe para buscar',
  'search.noResults': 'Sin resultados',
  'search.devMode': 'La búsqueda solo funciona en la build de producción',
  'home.title': 'Inicio',
  'home.contributions': 'Contribuciones en GitHub en el último año:',
  'home.skills': 'Con qué trabajo',
  'home.skillsSub': 'Herramientas que uso a diario:',
  'home.posts': 'Posts',
  'home.pinned': 'Fijados',
  'home.recent': 'Los últimos',
  'home.pinnedOne': 'El post fijado',
  'home.recentOne': 'El último post',
  'home.postsSuffix': 'posts',
  'home.followers': 'seguidores',
  'footer.craftedBy': 'hecho por',
  'footer.source': 'Código fuente',
  'pagination.label': 'Paginación',
  'notFound.title': 'Página no encontrada',
  'notFound.error': 'Error: no existe ese directorio',
  'notFound.commands': 'Comandos disponibles:',
} as const

type Dictionary = Record<keyof typeof es, string>

const en: Dictionary = {
  'site.description':
    "Cristian's blog, SRE / AI Platform Engineer: Kubernetes, observability, inference platforms, homelab and open source.",
  'nav.home': 'Home',
  'nav.posts': 'Posts',
  'nav.tags': 'Tags',
  'nav.photos': 'Photos',
  'nav.projects': 'Projects',
  'nav.language': 'Language',
  'nav.rss': 'RSS feed',
  'posts.title': 'Posts',
  'posts.description': 'All blog posts',
  'posts.introduce': "Everything I've written, newest first.",
  'posts.readMore': 'Read more',
  'posts.prevPage': 'Previous',
  'posts.nextPage': 'Next',
  'posts.toc': 'On this page',
  'posts.overview': 'Overview',
  'posts.back': 'Back to posts',
  'posts.nextPost': 'Next post',
  'posts.prevPost': 'Previous post',
  'posts.recommend': 'FEATURED',
  'posts.updated': 'Updated',
  'posts.minutes': 'min',
  'posts.words': 'words',
  'posts.views': 'views',
  'posts.translation': 'Leer en español',
  'posts.comments': 'Comments',
  'tags.title': 'Tags',
  'tags.description': 'All blog tags',
  'tags.introduce': 'All the post tags. Click one to filter.',
  'tags.total': 'tags total',
  'tags.totalOne': 'tag total',
  'tags.postsTotal': 'posts total',
  'tags.postsTotalOne': 'post total',
  'tags.empty': 'No tags yet',
  'tags.taggedWith': 'Posts tagged',
  'tags.post': 'post',
  'tags.posts': 'posts',
  'projects.title': 'Projects',
  'projects.description': "Cristian's open source projects",
  'projects.introduce': "Tools, exporters and side projects I've published.",
  'projects.stars': 'Stars',
  'projects.forks': 'Forks',
  'projects.website': 'Website',
  'photos.title': 'Photos',
  'photos.description': 'Photos I take.',
  'photos.introduce': 'Photos I take.',
  'photos.empty': 'No photos yet.',
  'search.label': 'Search',
  'search.shortcut': 'Search (Ctrl+K)',
  'search.exact': 'Exact',
  'search.exactTitle': 'Exact match',
  'search.typeToSearch': 'Type to search',
  'search.noResults': 'No results found',
  'search.devMode': 'Search only works in the production build',
  'home.title': 'Home',
  'home.contributions': 'GitHub contributions in the past year:',
  'home.skills': 'What I work with',
  'home.skillsSub': 'Tools I use every day:',
  'home.posts': 'Posts',
  'home.pinned': 'Pinned',
  'home.recent': 'Latest',
  'home.pinnedOne': 'Pinned post',
  'home.recentOne': 'Latest post',
  'home.postsSuffix': 'posts',
  'home.followers': 'followers',
  'footer.craftedBy': 'crafted by',
  'footer.source': 'Source code',
  'pagination.label': 'Pagination',
  'notFound.title': 'Page not found',
  'notFound.error': 'Error: directory not found',
  'notFound.commands': 'Available commands:',
}

const dictionaries: Record<Locale, Dictionary> = { es, en }

export type TranslationKey = keyof Dictionary

export function useTranslations(lang: Locale) {
  return (key: TranslationKey) => dictionaries[lang][key]
}
