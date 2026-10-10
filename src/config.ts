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

/**
 * SkillsShowcase 配置接口 / SkillsShowcase configuration type
 * get icon https://icon-sets.iconify.design/
 */
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',
      skills: [
        { name: 'Kubernetes', icon: 'icon-[skill-icons--kubernetes]', url: 'https://kubernetes.io/' },
        { name: 'Argo CD', icon: 'icon-[devicon--argocd]', url: 'https://argo-cd.readthedocs.io/' },
        { name: 'Helm', icon: 'icon-[devicon--helm]', url: 'https://helm.sh/' },
        { name: 'Docker', icon: 'icon-[skill-icons--docker]', url: 'https://www.docker.com/' },
        { name: 'Terraform', icon: 'icon-[skill-icons--terraform-dark]', url: 'https://www.terraform.io/' },
        { name: 'AWS', icon: 'icon-[skill-icons--aws-dark]', url: 'https://aws.amazon.com/' },
      ],
    },
    {
      direction: 'right',
      skills: [
        { name: 'Prometheus', icon: 'icon-[skill-icons--prometheus]', url: 'https://prometheus.io/' },
        { name: 'Grafana', icon: 'icon-[skill-icons--grafana-dark]', url: 'https://grafana.com/' },
        { name: 'Go', icon: 'icon-[skill-icons--golang]', url: 'https://go.dev/' },
        { name: 'Astro', icon: 'icon-[skill-icons--astro]', url: 'https://astro.build/' },
        { name: 'Svelte', icon: 'icon-[skill-icons--svelte]', url: 'https://svelte.dev/' },
        { name: 'Cloudflare', icon: 'icon-[skill-icons--cloudflare-dark]', url: 'https://www.cloudflare.com/' },
      ],
    },
    {
      direction: 'left',
      skills: [
        { name: 'Arch Linux', icon: 'icon-[skill-icons--arch-dark]', url: 'https://archlinux.org/' },
        { name: 'NixOS', icon: 'icon-[devicon--nixos]', url: 'https://nixos.org/' },
        { name: 'Traefik', icon: 'icon-[devicon--traefikproxy]', url: 'https://traefik.io/' },
        { name: 'Git', icon: 'icon-[skill-icons--git]', url: 'https://git-scm.com/' },
        { name: 'Neovim', icon: 'icon-[skill-icons--neovim-dark]', url: 'https://neovim.io/' },
        { name: 'Obsidian', icon: 'icon-[skill-icons--obsidian-dark]', url: 'https://obsidian.md/' },
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

// Gitalk needs a GitHub OAuth app; disabled until one exists.
export const COMMENT_CONFIG: CommentConfig = {
  enabled: false,
  system: 'none',
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
