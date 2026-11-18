// THROWAWAY spike: uPlot prototype, 3 stacked + synced panels, multi Y axes by unit,
// wheel zoom / drag pan / dblclick reset, live-legend tooltip, light/dark theme, PNG export.
import { useEffect, useRef, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { parseLog, PANELS, type Log, type PanelDef } from './log.ts'

const SYNC_KEY = 'logs'
const THEMES = {
  light: { fg: '#222', grid: '#e3e3e3', bg: '#fff' },
  dark: { fg: '#ddd', grid: '#3a3a3a', bg: '#161616' },
}
let theme: keyof typeof THEMES = 'light'
const plots = new Map<string, uPlot>()
let logRef: Log | null = null

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ?variant=raw : hand every point to uPlot (it still decimates per pixel column while drawing)
// ?variant=decimate : app-side min/max decimation of the visible window (what ticket #28 asks for)
const variant = new URLSearchParams(location.search).get('variant') ?? 'decimate'
const BUCKETS = 1200 // ~ plot width in px; 2 points per bucket

function lowerBound(a: Float64Array, v: number) {
  let lo = 0
  let hi = a.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (a[mid]! < v) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** min/max-per-bucket decimation of the visible window (keeps spikes). Shared x: [t(start), t(end)] per bucket. */
function dataFor(panel: PanelDef, log: Log, lo: number, hi: number): uPlot.AlignedData {
  if (variant === 'raw') return [log.time, ...panel.series.map((s) => log.cols.get(s.name)!)]
  const i0 = Math.max(0, lowerBound(log.time, lo) - 1)
  const i1 = Math.min(log.time.length, lowerBound(log.time, hi) + 1)
  const n = i1 - i0
  if (n <= BUCKETS * 2) {
    return [log.time.subarray(i0, i1), ...panel.series.map((s) => log.cols.get(s.name)!.subarray(i0, i1))]
  }
  const nb = BUCKETS
  const xs = new Float64Array(nb * 2)
  for (let b = 0; b < nb; b++) {
    const a = i0 + Math.floor((b * n) / nb)
    const z = i0 + Math.floor(((b + 1) * n) / nb) - 1
    xs[2 * b] = log.time[a]!
    xs[2 * b + 1] = log.time[z]!
  }
  const ys = panel.series.map((s) => {
    const col = log.cols.get(s.name)!
    const out = new Float64Array(nb * 2)
    for (let b = 0; b < nb; b++) {
      const a = i0 + Math.floor((b * n) / nb)
      const z = i0 + Math.floor(((b + 1) * n) / nb)
      let mn = Infinity
      let mx = -Infinity
      let imn = a
      let imx = a
      for (let i = a; i < z; i++) {
        const v = col[i]!
        if (v < mn) {
          mn = v
          imn = i
        }
        if (v > mx) {
          mx = v
          imx = i
        }
      }
      out[2 * b] = imn <= imx ? mn : mx
      out[2 * b + 1] = imn <= imx ? mx : mn
    }
    return out
  })
  return [xs, ...ys]
}

/** single source of truth for the x window: re-sample + move every panel (this is also the cross-panel sync) */
function applyWindow(min: number, max: number) {
  const log = logRef!
  for (const [id, p] of plots) {
    if (variant === 'decimate') p.setData(dataFor(PANELS.find((q) => q.id === id)!, log, min, max), false)
    p.setScale('x', { min, max })
  }
}

/** wheel zoom centred on the cursor + drag pan + dblclick reset (not built in to uPlot) */
function interactionPlugin(extent: () => [number, number]): uPlot.Plugin {
  return {
    hooks: {
      init: (u) => {
        const over = u.over
        over.addEventListener('wheel', (e) => {
          e.preventDefault()
          const [lo, hi] = extent()
          const { min, max } = u.scales.x!
          const left = u.cursor.left!
          const xv = u.posToVal(left, 'x')
          const k = e.deltaY < 0 ? 0.75 : 1 / 0.75
          let nmin = xv - (xv - min!) * k
          let nmax = xv + (max! - xv) * k
          if (nmax - nmin > hi - lo) [nmin, nmax] = [lo, hi]
          if (nmin < lo) [nmin, nmax] = [lo, lo + (nmax - nmin)]
          if (nmax > hi) [nmin, nmax] = [hi - (nmax - nmin), hi]
          applyWindow(Math.max(lo, nmin), Math.min(hi, nmax))
        })
        over.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return
          const x0 = e.clientX
          const { min, max } = u.scales.x!
          const pxToVal = (max! - min!) / over.getBoundingClientRect().width
          const [lo, hi] = extent()
          const move = (ev: MouseEvent) => {
            const dv = (ev.clientX - x0) * pxToVal
            let nmin = min! - dv
            let nmax = max! - dv
            if (nmin < lo) [nmin, nmax] = [lo, lo + (max! - min!)]
            if (nmax > hi) [nmin, nmax] = [hi - (max! - min!), hi]
            applyWindow(nmin, nmax)
          }
          const up = () => {
            document.removeEventListener('mousemove', move)
            document.removeEventListener('mouseup', up)
          }
          document.addEventListener('mousemove', move)
          document.addEventListener('mouseup', up)
        })
        over.addEventListener('dblclick', () => {
          const [lo, hi] = extent()
          applyWindow(lo, hi)
        })
      },
    },
  }
}

export function createPanelPlot(host: HTMLElement, panel: PanelDef, log: Log, width: number, height: number) {
  const units = [...new Set(panel.series.map((s) => s.unit))]
  const scales: uPlot.Scales = { x: { time: false } }
  for (const u of units) scales[u] = { auto: true }
  const axes: uPlot.Axis[] = [
    {
      stroke: () => THEMES[theme].fg,
      grid: { stroke: () => THEMES[theme].grid, width: 1 },
      ticks: { stroke: () => THEMES[theme].grid },
      values: (_u, splits) => splits.map(fmtTime),
    },
    ...units.map((unit, i): uPlot.Axis => {
      const users = panel.series.filter((s) => s.unit === unit)
      return {
        scale: unit,
        side: i === 0 ? 3 : 1, // left for the first unit, right (stacked outwards) for the rest
        label: unit,
        size: 60,
        stroke: () => (users.length === 1 ? users[0]!.color : THEMES[theme].fg),
        grid: { show: i === 0, stroke: () => THEMES[theme].grid, width: 1 },
        ticks: { stroke: () => THEMES[theme].grid },
      }
    }),
  ]
  const opts: uPlot.Options = {
    width,
    height,
    title: panel.title,
    scales,
    axes,
    series: [
      { label: 'Time', value: (_u, v) => (v == null ? '--' : fmtTime(v)) },
      ...panel.series.map(
        (s): uPlot.Series => ({
          label: s.name,
          scale: s.unit,
          stroke: s.color,
          width: 1,
          points: { show: false },
          paths: s.step ? uPlot.paths.stepped!({ align: 1 }) : undefined,
        }),
      ),
    ],
    cursor: { sync: { key: SYNC_KEY }, drag: { x: false, y: false } },
    legend: { live: true },
    plugins: [interactionPlugin(() => [log.time[0]!, log.time[log.time.length - 1]!])],
  }
  const data = dataFor(panel, log, log.time[0]!, log.time[log.time.length - 1]!)
  return new uPlot(opts, data, host)
}

declare global {
  interface Window {
    __api: Record<string, unknown>
  }
}

export function App() {
  const [status, setStatus] = useState('loading...')
  const hosts = useRef<Record<string, HTMLDivElement | null>>({})
  const [dark, setDark] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t0 = performance.now()
      const text = await (await fetch('/log.csv')).text()
      const t1 = performance.now()
      const log = parseLog(text)
      const parseMs = performance.now() - t1
      logRef = log
      if (cancelled) return
      const total = Math.max(window.innerHeight - 40, 400)
      const weightSum = PANELS.reduce((a, p) => a + p.weight, 0)
      const build = () => {
        for (const panel of PANELS) {
          const host = hosts.current[panel.id]!
          plots.get(panel.id)?.destroy()
          const h = Math.floor((total * panel.weight) / weightSum) - 70
          plots.set(panel.id, createPanelPlot(host, panel, log, host.clientWidth, h))
        }
      }
      build()
      setStatus(`${log.time.length} rows x ${PANELS.reduce((a, p) => a + p.series.length, 0)} series`)
      const T0 = log.time[0]!
      const T1 = log.time[log.time.length - 1]!
      const raf = () => new Promise<number>((r) => requestAnimationFrame(r))

      const setWindow = (min: number, max: number) => {
        applyWindow(min, max)
      }
      window.__api = {
        info: () => ({ rows: log.time.length, series: 13, parseMs, fetchMs: t1 - t0, T0, T1 }),
        renderFresh: async () => {
          for (const p of plots.values()) p.destroy()
          plots.clear()
          const t = performance.now()
          build()
          await raf()
          await raf()
          return performance.now() - t
        },
        setWindow,
        /** rAF-paced pan of a window of `frac` of the log; returns frame deltas (ms) */
        panBench: async (frames: number, frac: number) => {
          const w = (T1 - T0) * frac
          setWindow(T0, T0 + w)
          await raf()
          await raf()
          const deltas: number[] = []
          let last = await raf()
          for (let i = 0; i < frames; i++) {
            const s = T0 + ((T1 - T0 - w) * i) / frames
            setWindow(s, s + w)
            const now = await raf()
            deltas.push(now - last)
            last = now
          }
          return deltas
        },
        /** back-to-back updates (no rAF pacing): synchronous cost of one all-panel redraw */
        stress: async (n: number, frac: number) => {
          const w = (T1 - T0) * frac
          const costs: number[] = []
          for (let i = 0; i < n; i++) {
            const s = T0 + ((T1 - T0 - w) * i) / n
            const t = performance.now()
            setWindow(s, s + w)
            await Promise.resolve() // uPlot commits in a microtask (panel 1); the synced panels commit in a follow-up microtask
            await Promise.resolve()
            costs.push(performance.now() - t)
          }
          return costs
        },
        /** records rAF frame deltas for `ms` milliseconds (used while Playwright moves the real mouse) */
        recordFrames: (ms: number) =>
          new Promise<number[]>((resolve) => {
            const deltas: number[] = []
            let last = performance.now()
            const t0 = last
            const tick = (now: number) => {
              deltas.push(now - last)
              last = now
              if (now - t0 < ms) requestAnimationFrame(tick)
              else resolve(deltas)
            }
            requestAnimationFrame(tick)
          }),
        heap: () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0,
        scalesX: () => [...plots.values()].map((p) => [p.scales.x!.min, p.scales.x!.max]),
        exportAll: async () => {
          const t = performance.now()
          const out = await exportPng(2)
          return { ms: performance.now() - t, bytes: out.bytes, width: out.width, height: out.height, svg: 'not supported natively' }
        },
        setTheme: (t: 'light' | 'dark') => applyTheme(t),
      }
    })()
    return () => {
      cancelled = true
      for (const p of plots.values()) p.destroy()
      plots.clear()
    }
  }, [])

  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    setDark(!dark)
    applyTheme(next)
  }

  return (
    <div
      style={{
        font: '13px system-ui',
        background: THEMES[dark ? 'dark' : 'light'].bg,
        color: THEMES[dark ? 'dark' : 'light'].fg,
        minHeight: '100vh',
      }}
    >
      <div style={{ height: 40, display: 'flex', gap: 12, alignItems: 'center', padding: '0 8px' }}>
        <b>uPlot spike</b>
        <span id="status">{status}</span>
        <button onClick={toggle}>theme: {dark ? 'dark' : 'light'}</button>
        <button
          onClick={async () => {
            const r = await exportPng(2)
            const a = document.createElement('a')
            a.href = r.url
            a.download = 'chart.png'
            a.click()
          }}
        >
          export PNG
        </button>
      </div>
      {PANELS.map((p) => (
        <div key={p.id} ref={(el) => void (hosts.current[p.id] = el)} data-panel={p.id} style={{ width: '100%' }} />
      ))}
    </div>
  )
}

function applyTheme(t: 'light' | 'dark') {
  theme = t
  document.body.style.background = THEMES[t].bg
  for (const p of plots.values()) p.redraw(false, true)
}

/** Compose all panel canvases (each rendered with devicePixelRatio) into one PNG with a file title. */
async function exportPng(scale: number) {
  const ratio = scale / (window.devicePixelRatio || 1)
  const cs = [...plots.values()].map((p) => p.root.querySelector('canvas')!)
  const width = Math.round(cs[0]!.width * ratio)
  const head = 40 * scale
  const height = cs.reduce((a, c) => a + Math.round(c.height * ratio), head)
  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')!
  ctx.fillStyle = THEMES[theme].bg
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = THEMES[theme].fg
  ctx.font = `${14 * scale}px system-ui`
  ctx.fillText(`2026-10-25_09-33-22.csv  (${logRef?.time.length} rows)`, 8 * scale, 24 * scale)
  let y = head
  for (const c of cs) {
    const h = Math.round(c.height * ratio)
    ctx.drawImage(c, 0, y, width, h)
    y += h
  }
  const blob: Blob = await new Promise((r) => out.toBlob((b) => r(b!), 'image/png'))
  return { url: URL.createObjectURL(blob), bytes: blob.size, width, height }
}
