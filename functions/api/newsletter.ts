// Pages Function behind the newsletter form. Same browser contract as the Go service at
// https://newsletter.crstian.me/api/subscribe (see NewsletterForm.astro).
interface Env {
  TURNSTILE_SECRET: string
  LISTMONK_URL: string
  LISTMONK_USER: string
  LISTMONK_TOKEN: string
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}
type Fn = (ctx: { request: Request; env: Env }) => Promise<Response>

const LISTS = { es: 3, en: 4 } as const // listmonk list ids: Blog (ES), Blog (EN)
const WELCOME_TEMPLATE_ID = 6
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const reply = (status: number, error?: string) =>
  Response.json(error ? { ok: false, error } : { ok: true }, { status })

// The latest post comes from the static RSS feed, so the welcome email needs no build-time wiring.
async function latestPost(env: Env, origin: string, lang: 'es' | 'en') {
  try {
    const res = await env.ASSETS.fetch(new Request(`${origin}${lang === 'en' ? '/en' : ''}/index.xml`))
    const item = (await res.text()).match(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/)
    const unescape = (s: string) =>
      s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&')
    return item ? { latest_title: unescape(item[1].trim()), latest_url: unescape(item[2].trim()) } : {}
  } catch {
    return {}
  }
}

export const onRequestPost: Fn = async ({ request, env }) => {
  let body: { email?: unknown; lang?: unknown; turnstileToken?: unknown }
  try {
    body = await request.json()
  } catch {
    return reply(400, 'invalid_email')
  }
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const lang = body.lang === 'en' ? 'en' : 'es'
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, 'invalid_email')

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: typeof body.turnstileToken === 'string' ? body.turnstileToken : '',
      remoteip: request.headers.get('CF-Connecting-IP') ?? '',
    }),
  })
  if (!verify.ok || !((await verify.json()) as { success?: boolean }).success) return reply(403, 'captcha_failed')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${btoa(`${env.LISTMONK_USER}:${env.LISTMONK_TOKEN}`)}`,
  }
  const created = await fetch(`${env.LISTMONK_URL}/api/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      name: email.split('@')[0],
      status: 'enabled',
      lists: [LISTS[lang]],
      preconfirm_subscriptions: true,
    }),
  })
  if (created.status === 409) return reply(409, 'already_subscribed')
  if (!created.ok) {
    console.error('listmonk subscribe failed', created.status, await created.text())
    return reply(502, 'server_error')
  }

  // The welcome is best effort: the person is already subscribed, so a failure only gets logged.
  try {
    const data = { lang, ...(await latestPost(env, new URL(request.url).origin, lang)) }
    const tx = await fetch(`${env.LISTMONK_URL}/api/tx`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subscriber_email: email, template_id: WELCOME_TEMPLATE_ID, data, content_type: 'html' }),
    })
    if (!tx.ok) console.error('listmonk welcome failed', tx.status, await tx.text())
  } catch (err) {
    console.error('listmonk welcome failed', err)
  }
  return reply(200)
}
