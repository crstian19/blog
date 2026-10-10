import { generateRSS20 } from '~/lib/feed'

export async function GET() {
  return new Response(await generateRSS20('es'), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
