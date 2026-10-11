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
  ogImage: '/og-image.jpg',
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
    name: 'crstian.me',
    url: 'https://crstian.me',
    icon: 'icon-[ri--global-line]',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/crstian19',
    icon: 'icon-[ri--github-fill]',
  },
  {
    name: 'GitLab',
    url: 'https://gitlab.com/Crstian',
    icon: 'icon-[ri--gitlab-fill]',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/cristian-gutierrez-lopez/',
    icon: 'icon-[ri--linkedin-box-fill]',
  },
  {
    name: 'X',
    url: 'https://x.com/crstiax',
    icon: 'icon-[ri--twitter-x-fill]',
  },
  {
    name: 'Mastodon',
    url: 'https://mastodon.social/@crstian',
    icon: 'icon-[ri--mastodon-fill]',
    // Lets Mastodon verify this link on the profile.
    rel: 'me',
  },
  {
    name: 'Email',
    url: 'mailto:cristian@crstian.me',
    icon: 'icon-[ri--mail-line]',
  },
]

// Logos come from public/stack.svg, based on the crstian.me sprite; `icon`
// is the symbol id. Grouped by theme, from what the homelab and work repos use.
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    // AI and platform
    {
      direction: 'left',
      skills: [
        { name: 'vLLM', icon: 'vllm', url: 'https://docs.vllm.ai/' },
        { name: 'LiteLLM', icon: 'litellm', url: 'https://www.litellm.ai/' },
        { name: 'agentgateway', icon: 'agentgateway', url: 'https://agentgateway.dev/' },
        { name: 'NVIDIA', icon: 'nvidia', url: 'https://developer.nvidia.com/' },
        { name: 'KEDA', icon: 'keda', url: 'https://keda.sh/' },
        { name: 'Kubernetes', icon: 'k8s', url: 'https://kubernetes.io/' },
        { name: 'Argo CD', icon: 'argo', url: 'https://argo-cd.readthedocs.io/' },
      ],
    },
    // Networking, secrets and data
    {
      direction: 'right',
      skills: [
        { name: 'kgateway', icon: 'kgateway', url: 'https://kgateway.dev/' },
        { name: 'Traefik', icon: 'traefik', url: 'https://traefik.io/traefik/' },
        { name: 'cert-manager', icon: 'cert-manager', url: 'https://cert-manager.io/' },
        { name: 'Infisical', icon: 'infisical', url: 'https://infisical.com/' },
        { name: 'Helm', icon: 'helm', url: 'https://helm.sh/' },
        { name: 'CloudNativePG', icon: 'cloudnativepg', url: 'https://cloudnative-pg.io/' },
        { name: 'Dragonfly', icon: 'dragonfly', url: 'https://www.dragonflydb.io/' },
        { name: 'Cloudflare', icon: 'cloudflare', url: 'https://www.cloudflare.com/' },
      ],
    },
    // Observability and infrastructure
    {
      direction: 'left',
      skills: [
        { name: 'Prometheus', icon: 'prometheus', url: 'https://prometheus.io/' },
        { name: 'VictoriaMetrics', icon: 'victoriametrics', url: 'https://victoriametrics.com/' },
        { name: 'Grafana', icon: 'grafana', url: 'https://grafana.com/' },
        { name: 'Loki', icon: 'loki', url: 'https://grafana.com/oss/loki/' },
        { name: 'Tempo', icon: 'tempo', url: 'https://grafana.com/oss/tempo/' },
        { name: 'NixOS', icon: 'nixos', url: 'https://nixos.org/' },
        { name: 'Hetzner', icon: 'hetzner', url: 'https://www.hetzner.com/' },
        { name: 'AWS', icon: 'aws', url: 'https://aws.amazon.com/' },
        { name: 'Golang', icon: 'golang', url: 'https://go.dev/' },
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
    repo: 'crstian19/blog',
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
