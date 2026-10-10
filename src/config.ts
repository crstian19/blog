import type {
  AnalyticsConfig,
  CommentConfig,
  GithubConfig,
  Link,
  PhotosConfig,
  PostConfig,
  Site,
  SkillsShowcaseConfig,
  SocialLink,
} from '~/types'

// Texts shown to readers live in src/i18n.ts, one dictionary per locale.

export const SITE: Site = {
  title: "Crstian's Blog",
  website: 'https://blog.crstian.me/',
  base: '/',
  author: 'Crstian',
  ogImage: '/og-image.webp',
  transition: false,
  themeAnimation: true,
}

export const PHOTOS_CONFIG: PhotosConfig = {
  enabled: false,
}

const PHOTOS_LINK: Link[] = PHOTOS_CONFIG.enabled ? [{ key: 'nav.photos', url: '/photos/' }] : []

// URLs are locale-neutral; components prefix them with localizePath().
export const HEADER_LINKS: Link[] = [
  { key: 'nav.posts', url: '/post/' },
  { key: 'nav.projects', url: '/projects/' },
  { key: 'nav.tags', url: '/tags/' },
  ...PHOTOS_LINK,
]

export const FOOTER_LINKS: Link[] = [
  { key: 'nav.home', url: '/' },
  { key: 'nav.posts', url: '/post/' },
  { key: 'nav.projects', url: '/projects/' },
  { key: 'nav.tags', url: '/tags/' },
  ...PHOTOS_LINK,
]

// get icon https://icon-sets.iconify.design/
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'github',
    url: 'https://github.com/crstian19',
    icon: 'icon-[ri--github-fill]',
  },
  {
    name: 'twitter',
    url: 'https://x.com/crstiax',
    icon: 'icon-[ri--twitter-x-fill]',
  },
]

// Logos come from public/stack.svg, the same sprite crstian.me uses; `icon`
// is the symbol id. Same stack and order as the crstian.me home page.
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',
      skills: [
        { name: 'vLLM', icon: 'vllm', url: 'https://docs.vllm.ai/' },
        { name: 'LiteLLM', icon: 'litellm', url: 'https://www.litellm.ai/' },
        { name: 'Kubernetes', icon: 'k8s', url: 'https://kubernetes.io/' },
        { name: 'AWS', icon: 'aws', url: 'https://aws.amazon.com/' },
        { name: 'DigitalOcean', icon: 'digitalocean', url: 'https://www.digitalocean.com/' },
        { name: 'Azure', icon: 'azure', url: 'https://azure.microsoft.com/' },
        { name: 'Google Cloud', icon: 'gcp', url: 'https://cloud.google.com/' },
        { name: 'Argo', icon: 'argo', url: 'https://argoproj.github.io/' },
      ],
    },
    {
      direction: 'right',
      skills: [
        { name: 'Kong', icon: 'kong', url: 'https://konghq.com/' },
        { name: 'GitHub Actions', icon: 'github-actions', url: 'https://github.com/features/actions' },
        { name: 'GitLab CI', icon: 'gitlab-ci', url: 'https://docs.gitlab.com/ee/ci/' },
        { name: 'Vault', icon: 'vault', url: 'https://www.vaultproject.io/' },
        { name: 'Traefik', icon: 'traefik', url: 'https://traefik.io/traefik/' },
        { name: 'Nginx', icon: 'nginx', url: 'https://nginx.org/' },
        { name: 'PostgreSQL', icon: 'postgresql', url: 'https://www.postgresql.org/' },
      ],
    },
    {
      direction: 'left',
      skills: [
        { name: 'Grafana', icon: 'grafana', url: 'https://grafana.com/' },
        { name: 'Prometheus', icon: 'prometheus', url: 'https://prometheus.io/' },
        { name: 'Python', icon: 'python', url: 'https://www.python.org/' },
        { name: 'Terraform', icon: 'terraform', url: 'https://www.terraform.io/' },
        { name: 'Golang', icon: 'golang', url: 'https://go.dev/' },
        { name: 'Astro', icon: 'astro', url: 'https://astro.build/' },
        { name: 'Arch', icon: 'arch', url: 'https://archlinux.org/' },
      ],
    },
  ],
}

/**
 * GitHub配置 / GitHub configuration
 *
 * @property {boolean} ENABLED - 是否启用GitHub功能 / Whether to enable GitHub features
 * @property {string} GITHUB_USERNAME - GITHUB用户名 / GitHub username
 * @property {boolean} TOOLTIP_ENABLED - 是否开启Tooltip功能 / Whether to enable Github Tooltip features
 */
export const GITHUB_CONFIG: GithubConfig = {
  ENABLED: true,
  GITHUB_USERNAME: 'crstian19',
  TOOLTIP_ENABLED: true,
}

//--- Posts Page Config ---
export const POSTS_CONFIG: PostConfig = {
  author: 'Crstian',
  homePageConfig: {
    size: 3,
    type: 'compact',
  },
  postPageConfig: {
    size: 10,
    type: 'image',
    coverLayout: 'right',
  },
  tagsPageConfig: {
    size: 10,
    type: 'time-line',
  },
  ogImageUseCover: true,
  postType: 'metaOnly',
  imageDarkenInDark: true,
  wordCountView: true,
}

// Comments are GitHub Discussions of the blog repo, through giscus (https://giscus.app).
// Both translations of a post share one discussion, keyed by its translationKey.
export const COMMENT_CONFIG: CommentConfig = {
  enabled: true,
  system: 'giscus',
  giscus: {
    repo: 'crstian19/My-blog',
    repoId: 'MDEwOlJlcG9zaXRvcnkyNjk3ODcwNjI=',
    category: 'Announcements',
    categoryId: 'DIC_kwDOEBSfts4DHgvf',
    themes: { light: 'light', dark: 'transparent_dark' },
  },
}

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  vercount: {
    enabled: false,
  },
  umami: {
    enabled: true,
    websiteId: '1df64f67-c72f-401c-89c0-02443ca455c6',
    serverUrl: 'https://umami.crstian.me/script.js',
    domains: 'blog.crstian.me',
  },
  rybbit: {
    enabled: true,
    siteId: '7906ed64d877',
    serverUrl: 'https://app.rybbit.io/api/script.js',
  },
}
