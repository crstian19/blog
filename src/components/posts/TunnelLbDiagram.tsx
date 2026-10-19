import { useEffect, useRef, useState } from 'react'

// Animated diagram for the Cloudflare Tunnel as a load balancer post.
// Requests travel client → Cloudflare colo → tunnel connection → cloudflared →
// Service (ClusterIP) → gateway proxy (kgateway / Envoy) → app. Clicking a cloudflared pod
// kills it: its connections drop and the edge stops routing to it.

type Lang = 'es' | 'en'
type Pt = [number, number]

const TEXT = {
  es: {
    clients: 'Clientes',
    edge: 'Cloudflare edge',
    colo: 'Colo',
    tunnel: 'Conexiones salientes del túnel',
    cluster: 'Clúster de Kubernetes',
    connector: 'cloudflared',
    service: 'Service',
    ingress: 'kgateway',
    app: 'App',
    req: 'petición',
    reqs: 'peticiones',
    down: 'caído',
    hint: 'Pulsa un pod de cloudflared para tumbarlo.',
    pause: 'Pausar',
    play: 'Reanudar',
    reset: 'Reiniciar',
    sticky: 'Cada cloudflared reutiliza sus conexiones keep-alive, así que se pega a un pod del gateway.',
  },
  en: {
    clients: 'Clients',
    edge: 'Cloudflare edge',
    colo: 'Colo',
    tunnel: 'Outbound tunnel connections',
    cluster: 'Kubernetes cluster',
    connector: 'cloudflared',
    service: 'Service',
    ingress: 'kgateway',
    app: 'App',
    req: 'request',
    reqs: 'requests',
    down: 'down',
    hint: 'Click a cloudflared pod to kill it.',
    pause: 'Pause',
    play: 'Play',
    reset: 'Reset',
    sticky: 'Each cloudflared reuses its keep-alive connections, so it sticks to one gateway pod.',
  },
}

const W = 960
const H = 470
const CLIENTS: Pt[] = [
  [48, 150],
  [48, 240],
  [48, 330],
]
const COLOS: Pt[] = [
  [215, 165],
  [215, 315],
]
const PODS: Pt[] = [
  [470, 120],
  [470, 240],
  [470, 360],
]
const SERVICE: Pt = [620, 240]
const INGRESS: Pt[] = [
  [745, 170],
  [745, 310],
]
const APPS: Pt[] = [
  [890, 120],
  [890, 240],
  [890, 360],
]
// Which gateway pod each cloudflared ends up glued to through its keep-alive pool.
const STICKY = [0, 1, 0]
const COLO_W = 110
const POD_W = 112
const SPEED = 300 // px per second

/** The four connections of a pod: two to each colo, as cloudflared does. */
function connections(pod: number) {
  return [0, 1, 2, 3].map((c) => {
    const colo = c < 2 ? 0 : 1
    const [cx, cy] = COLOS[colo]
    const [px, py] = PODS[pod]
    const from: Pt = [cx + COLO_W / 2, cy + (pod - 1) * 16 + (c % 2 ? 5 : -5)]
    const to: Pt = [px - POD_W / 2, py + (colo ? 9 : -9) + (c % 2 ? 4 : -4)]
    return { colo, from, to }
  })
}

type Dot = { pts: Pt[]; lens: number[]; total: number; t: number; pod: number; ingress: number }

function makeDot(alive: boolean[], rr: { app: number }): Dot | null {
  const live = PODS.map((_, i) => i).filter((i) => alive[i])
  if (!live.length) return null
  const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)]
  const pod = live[Math.floor(Math.random() * live.length)]
  const conn = connections(pod)[Math.floor(Math.random() * 4)]
  const ingress = STICKY[pod]
  const app = rr.app++ % APPS.length
  const [cx, cy] = COLOS[conn.colo]
  const [px, py] = PODS[pod]
  const [ix, iy] = INGRESS[ingress]
  const pts: Pt[] = [
    [client[0] + 16, client[1]],
    [cx - COLO_W / 2, cy],
    conn.from,
    conn.to,
    [px + POD_W / 2, py],
    [SERVICE[0] - 38, SERVICE[1]],
    [SERVICE[0] + 38, SERVICE[1]],
    [ix - 50, iy],
    [ix + 50, iy],
    [APPS[app][0] - 34, APPS[app][1]],
  ]
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  return { pts, lens, total: lens.reduce((a, b) => a + b, 0), t: 0, pod, ingress }
}

function pointAt(d: Dot): Pt {
  let dist = d.t * d.total
  for (let i = 0; i < d.lens.length; i++) {
    if (dist <= d.lens[i]) {
      const k = d.lens[i] ? dist / d.lens[i] : 0
      const [ax, ay] = d.pts[i]
      const [bx, by] = d.pts[i + 1]
      return [ax + (bx - ax) * k, ay + (by - ay) * k]
    }
    dist -= d.lens[i]
  }
  return d.pts[d.pts.length - 1]
}

export default function TunnelLbDiagram({ lang = 'en' }: { lang?: Lang }) {
  const t = TEXT[lang]
  const [alive, setAlive] = useState([true, true, true])
  const [playing, setPlaying] = useState(true)
  const [, setFrame] = useState(0)
  const dots = useRef<Dot[]>([])
  const counts = useRef({ pods: [0, 0, 0], ingress: [0, 0] })
  const rr = useRef({ app: 0 })
  const aliveRef = useRef(alive)
  aliveRef.current = alive

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let spawn = 0
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      spawn += dt
      if (spawn > 0.32) {
        spawn = 0
        const d = makeDot(aliveRef.current, rr.current)
        if (d) {
          dots.current.push(d)
          counts.current.pods[d.pod]++
          counts.current.ingress[d.ingress]++
        }
      }
      dots.current = dots.current.filter((d) => {
        d.t += (SPEED * dt) / d.total
        // A request still on the edge side of a pod that just died is lost with it.
        return d.t < 1 && aliveRef.current[d.pod]
      })
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const toggle = (i: number) => setAlive((a) => a.map((v, j) => (j === i ? !v : v)))
  const reset = () => {
    dots.current = []
    counts.current = { pods: [0, 0, 0], ingress: [0, 0] }
    setAlive([true, true, true])
  }

  const box = 'fill-muted stroke-border'
  const label = 'fill-foreground text-[15px] font-medium'
  const small = 'fill-muted-foreground text-[12px]'

  return (
    <figure className="not-prose my-8">
      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[640px] select-none" role="img" aria-label={t.tunnel}>
          {/* Cluster boundary */}
          <rect x={395} y={52} width={545} height={372} rx={16} className="fill-primary/[0.04] stroke-primary/40" strokeDasharray="6 6" />
          <text x={410} y={76} className={small}>
            {t.cluster}
          </text>
          <text x={215} y={76} textAnchor="middle" className={small}>
            {t.edge}
          </text>
          <text x={48} y={76} textAnchor="middle" className={small}>
            {t.clients}
          </text>

          {/* Tunnel connections */}
          {PODS.map((_, p) =>
            connections(p).map((c, i) => (
              <line
                key={`${p}-${i}`}
                x1={c.from[0]}
                y1={c.from[1]}
                x2={c.to[0]}
                y2={c.to[1]}
                strokeWidth={1.5}
                className={alive[p] ? 'stroke-primary/45' : 'stroke-red-500/0'}
                style={{ transition: 'stroke 300ms' }}
              />
            )),
          )}
          <text x={330} y={448} textAnchor="middle" className={small}>
            {t.tunnel}
          </text>

          {/* Pod → Service → sticky ingress */}
          {PODS.map(([px, py], p) => (
            <line key={`s${p}`} x1={px + POD_W / 2} y1={py} x2={SERVICE[0] - 38} y2={SERVICE[1]} strokeWidth={1.5} className="stroke-border" />
          ))}
          {INGRESS.map(([ix, iy], i) => (
            <line key={`i${i}`} x1={SERVICE[0] + 38} y1={SERVICE[1]} x2={ix - 50} y2={iy} strokeWidth={1.5} className="stroke-border" />
          ))}
          {INGRESS.map(([ix, iy], i) =>
            APPS.map(([ax, ay], a) => (
              <line key={`a${i}${a}`} x1={ix + 50} y1={iy} x2={ax - 34} y2={ay} strokeWidth={1} className="stroke-border" />
            )),
          )}

          {/* Requests in flight, under the boxes so they go in and out of each hop */}
          {dots.current.map((d, i) => {
            const [x, y] = pointAt(d)
            return <circle key={i} cx={x} cy={y} r={5} className="fill-primary" />
          })}

          {/* Clients */}
          {CLIENTS.map(([x, y], i) => (
            <g key={`c${i}`}>
              <circle cx={x} cy={y - 7} r={7} className="fill-muted-foreground/60" />
              <path d={`M ${x - 13} ${y + 14} a 13 11 0 0 1 26 0 z`} className="fill-muted-foreground/60" />
            </g>
          ))}

          {/* Colos */}
          {COLOS.map(([x, y], i) => (
            <g key={`colo${i}`}>
              <rect x={x - COLO_W / 2} y={y - 34} width={COLO_W} height={68} rx={12} className="fill-background" />
              <rect x={x - COLO_W / 2} y={y - 34} width={COLO_W} height={68} rx={12} className="fill-[#f6821f]/15 stroke-[#f6821f]/60" />
              <text x={x} y={y + 5} textAnchor="middle" className={label}>
                {t.colo} {i ? 'B' : 'A'}
              </text>
            </g>
          ))}

          {/* cloudflared pods */}
          {PODS.map(([x, y], i) => (
            <g key={`p${i}`} onClick={() => toggle(i)} className="cursor-pointer">
              <rect
                x={x - POD_W / 2}
                y={y - 30}
                width={POD_W}
                height={60}
                rx={12}
                className={alive[i] ? box : 'fill-red-500/10 stroke-red-500'}
                strokeWidth={1.5}
                style={{ transition: 'fill 300ms, stroke 300ms' }}
              />
              <text x={x} y={y - 4} textAnchor="middle" className={alive[i] ? label : 'fill-red-500 text-[15px] font-medium'}>
                {t.connector}
              </text>
              <text x={x} y={y + 16} textAnchor="middle" className={small}>
                {alive[i] ? `${counts.current.pods[i]} ${counts.current.pods[i] === 1 ? t.req : t.reqs}` : t.down}
              </text>
            </g>
          ))}

          {/* Service */}
          <rect x={SERVICE[0] - 38} y={SERVICE[1] - 40} width={76} height={80} rx={38} className={box} strokeWidth={1.5} />
          <text x={SERVICE[0]} y={SERVICE[1] + 5} textAnchor="middle" className="fill-foreground text-[12px] font-medium">
            {t.service}
          </text>
          <text x={SERVICE[0]} y={SERVICE[1] + 60} textAnchor="middle" className={small}>
            ClusterIP
          </text>

          {/* Gateway proxy pods (Envoy) */}
          {INGRESS.map(([x, y], i) => (
            <g key={`t${i}`}>
              <rect x={x - 50} y={y - 30} width={100} height={60} rx={12} className={box} strokeWidth={1.5} />
              <text x={x} y={y - 4} textAnchor="middle" className={label}>
                {t.ingress}
              </text>
              <text x={x} y={y + 16} textAnchor="middle" className={small}>
                {counts.current.ingress[i]} {counts.current.ingress[i] === 1 ? t.req : t.reqs}
              </text>
            </g>
          ))}

          {/* Apps */}
          {APPS.map(([x, y], i) => (
            <g key={`app${i}`}>
              <rect x={x - 34} y={y - 22} width={68} height={44} rx={10} className={box} strokeWidth={1.5} />
              <text x={x} y={y + 5} textAnchor="middle" className="fill-foreground text-[13px]">
                {t.app}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>{t.hint}</span>
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md border border-border px-3 py-1 text-foreground hover:bg-muted"
          >
            {playing ? t.pause : t.play}
          </button>
          <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-1 text-foreground hover:bg-muted">
            {t.reset}
          </button>
        </span>
        <span className="w-full text-xs">{t.sticky}</span>
      </figcaption>
    </figure>
  )
}
