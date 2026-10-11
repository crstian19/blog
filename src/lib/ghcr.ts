const cache = new Map<string, Promise<number | undefined>>()

/**
 * Total downloads of a GHCR image (ghcr.io/owner/name), read at build time.
 * GHCR has no public API for it, so it comes from the package page on
 * github.com; undefined if the page can't be reached or its layout changed,
 * in which case the caller falls back to the count in the frontmatter.
 */
export function fetchGhcrPulls(image: string): Promise<number | undefined> {
  const match = image.match(/^ghcr\.io\/([^/]+)\/([^:@]+)/)
  if (!match) return Promise.resolve(undefined)
  const [, owner, name] = match
  if (!cache.has(image)) {
    cache.set(
      image,
      fetch(`https://github.com/users/${owner}/packages/container/package/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'blog.crstian.me' },
        signal: AbortSignal.timeout(8000),
      })
        .then(async (res) => {
          if (!res.ok) return undefined
          const total = (await res.text()).match(/Total downloads[\s\S]{0,400}?title="([\d,]+)"/)?.[1]
          return total ? Number(total.replaceAll(',', '')) : undefined
        })
        .catch(() => undefined)
    )
  }
  return cache.get(image)!
}
