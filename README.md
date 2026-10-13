# blog.crstian.me

Personal blog of Cristian Gutiérrez, SRE / AI Platform Engineer: Kubernetes, observability, inference platforms, homelab and open source. Written in Spanish and English.

Built with [Astro 7](https://astro.build/) on top of the [Litos](https://github.com/Dnzzk2/Litos) theme, heavily customised: bilingual routing, a purple OLED theme, an avatar that follows the cursor and giscus comments.

## Stack

| Piece | Choice |
|---|---|
| Framework | Astro 7, static output |
| Runtime and package manager | Bun |
| Styling | Tailwind CSS 4, colour tokens in oklch |
| Interactive islands | React 19 (theme toggle, GitHub contributions, tooltips) |
| Markdown | unified pipeline (remark/rehype plugins), Expressive Code with Catppuccin |
| Search | Pagefind, one index per language |
| Comments | giscus on the Discussions of this repo |
| Analytics | Umami and Rybbit |

## Commands

```bash
bun install
bun run dev       # dev server on http://localhost:4321
bun run build     # astro check + build + Pagefind index into dist/
bun run preview   # serve dist/ locally
```

Search only works on a production build (`bun run build && bun run preview`).

## Languages and URLs

Spanish is served without a prefix and English under `/en/`, the same URLs the previous Hugo blog published, so old links keep working:

| Page | Spanish | English |
|---|---|---|
| Home | `/` | `/en/` |
| Posts | `/post/`, `/post/<slug>/` | `/en/post/`, `/en/post/<slug>/` |
| Tags | `/tags/`, `/tags/<tag>/` | `/en/tags/`, `/en/tags/<tag>/` |
| Projects | `/projects/` | `/en/projects/` |
| Feeds | `/index.xml`, `/atom.xml` | `/en/index.xml`, `/en/atom.xml` |

The root page sends visitors whose browser prefers another language to `/en/`, unless they picked one in the header picker. Crawlers are never redirected.

Each route exists twice, in `src/pages/` and `src/pages/en/`, and both render the same view from `src/views/`. UI strings live in `src/i18n.ts`, one dictionary per language.

## Writing a post

Create `src/content/posts/<es|en>/<slug>/index.md`, with images in an `assets/` folder next to it:

```yaml
---
title: 'Post title'
description: 'One or two sentences for the card, search engines and social previews.'
pubDate: 2026-10-10
cover: assets/cover.jpg   # optional
tags: ['kubernetes', 'grafana']
translationKey: my-post   # only if the translation uses a different slug
aliases: ['/posts/old-url/']   # optional, old URLs that redirect here
draft: false
---
```

- Slugs start with the date, as in `2026-10-10-iris-3b-vs-budgetpixel-arena`.
- A post and its translation are linked by `translationKey`, which defaults to the slug, so translations with the same slug need nothing extra. Both share one comment thread.
- Tags become `/tags/<tag>/` in lower case with spaces turned into hyphens.

## Projects

One file per project in `src/content/projects/<name>/index.md`:

```yaml
---
name: 'Gluetun Exporter'
description:
  es: 'Exporter de Prometheus para Gluetun.'
  en: 'Prometheus exporter for Gluetun.'
githubUrl: 'https://github.com/crstian19/gluetun-exporter'
website: 'https://example.com'   # optional
iconClass: 'icon-[simple-icons--wireguard]'   # any Iconify icon, used when there is no logo
logo: ./logo.webp   # optional real logo, grayscale until hover
dockerImage: ghcr.io/crstian19/gluetun-exporter   # optional, shows its total pulls
pulls: 14435   # fallback pull count if GHCR can't be read at build time
date: 2026-03-22
---
```

Stars and forks are refreshed live from GitHub. Pulls are read from the GHCR package page at build time, since GHCR has no public API for them. Logos come from the same project folder on crstian.me.

## Configuration

`src/config.ts` holds the site identity, navigation, social links, the stack shown on the home page (logos from `public/stack.svg`), comments and analytics. The photos section is built but hidden behind `PHOTOS_CONFIG.enabled`.

## Support

If something here helped you, you can support the blog and my open source projects:

- [GitHub Sponsors](https://github.com/sponsors/crstian19), no fees
- [Ko-fi](https://ko-fi.com/crstian)
- [PayPal](https://paypal.me/CrstianG)

The same options are on [blog.crstian.me/support/](https://blog.crstian.me/support/).

## Credits

Based on [Litos](https://github.com/Dnzzk2/Litos) by Dnzzk2, released under the MIT licence (see `LICENSE`).
