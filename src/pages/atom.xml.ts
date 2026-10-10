import { generateAtom10 } from '~/lib/feed'

export async function GET() {
  return new Response(await generateAtom10('es'), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  })
}
