import { generateRSS20 } from '~/lib/feed'

export async function GET() {
  return new Response(await generateRSS20('en'), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
