// THROWAWAY smoke benchmark for Plotly.js (scattergl and SVG scatter) and Recharts on the same 3-panel / 13-series layout.
// ?lib=plotly-gl | plotly-svg | recharts   [&maxpts=N : naive stride decimation of the input to N points]
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { parseLog, PANELS, type Log } from './log.ts'

const params = new URLSearchParams(location.search)
const lib = params.get('lib') ?? 'plotly-gl'
const maxpts = Number(params.get('maxpts') ?? 0)
const PANEL_H = 270
const W = 1240

declare global {
  interface Window {
    __api: Record<string, unknown>
  }
}

function decimate(log: Log, max: number): Log {
  const n = log.time.length
  if (!max || n <= max) return log
  const stride = Math.ceil(n / max)
  const pick = (a: Float64Array) => Float64Array.from({ length: Math.ceil(n / stride) }, (_, i) => a[i * stride]!)
  const cols = new Map<string, Float64Array>()
  for (const [k, v] of log.cols) cols.set(k, pick(v))
  return { time: pick(log.time), cols }
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

async function main() {
  const text = await (await fetch('/log.csv')).text()
  const full = parseLog(text)
  const log = decimate(full, maxpts)
  const T0 = full.time[0]!
  const T1 = full.time[full.time.length - 1]!
  const root = document.getElementById('root')!
  const raf = () => new Promise<number>((r) => requestAnimationFrame(r))
  let cleanup: () => void = () => {}
  let setWindow: (min: number, max: number) => Promise<void> | void = () => {}

  const hosts = PANELS.map((p) => {
    const d = document.createElement('div')
    d.id = 'panel-' + p.id
    d.style.cssText = `width:${W}px;height:${PANEL_H}px`
    root.appendChild(d)
    return d
  })

  async function mountPlotly(gl: boolean) {
    const Plotly = (
      gl ? await import('plotly.js-gl2d-dist-min') : await import('plotly.js-cartesian-dist-min')
    ).default as unknown as {
      newPlot: (d: HTMLElement, t: unknown[], l: unknown, c: unknown) => Promise<void>
      relayout: (d: HTMLElement, u: unknown) => Promise<void>
      purge: (d: HTMLElement) => void
    }
    return {
      mount: async () => {
        await Promise.all(
          PANELS.map((panel, pi) => {
            const units = [...new Set(panel.series.map((s) => s.unit))]
            const traces = panel.series.map((s) => ({
              type: gl ? 'scattergl' : 'scatter',
              mode: 'lines',
              name: s.name,
              x: log.time,
              y: log.cols.get(s.name),
              line: { color: s.color, width: 1, shape: s.step ? 'hv' : 'linear' },
              yaxis: ['y', 'y2', 'y3'][units.indexOf(s.unit)],
              hoverinfo: 'x+y+name',
            }))
            const layout: Record<string, unknown> = {
              width: W,
              height: PANEL_H,
              margin: { l: 60, r: 10, t: 20, b: 30 },
              showlegend: false,
              xaxis: { range: [T0, T1], domain: [0, units.length > 2 ? 0.88 : units.length > 1 ? 0.94 : 1] },
              hovermode: 'x unified',
              dragmode: 'pan',
            }
            units.forEach((u, ui) => {
              const key = ui === 0 ? 'yaxis' : `yaxis${ui + 1}`
              layout[key] = {
                title: { text: u },
                ...(ui > 0 ? { overlaying: 'y', side: 'right', anchor: 'free', position: ui === 1 ? 0.94 : 1 } : {}),
              }
            })
            return Plotly.newPlot(hosts[pi]!, traces, layout, { displayModeBar: false, scrollZoom: true })
          }),
        )
      },
      setWindow: (min: number, max: number) =>
        Promise.all(hosts.map((h) => Plotly.relayout(h, { 'xaxis.range': [min, max] }))).then(() => {}),
      cleanup: () => hosts.forEach((h) => Plotly.purge(h)),
    }
  }

  async function mountRecharts() {
    let setDomain: (d: [number, number]) => void = () => {}
    const reactRoots: Root[] = []
    const rows = Array.from({ length: log.time.length }, (_, i) => {
      const o: Record<string, number> = { t: log.time[i]! }
      for (const [k, v] of log.cols) o[k] = v[i]!
      return o
    })
    function Panel({ pi, domain }: { pi: number; domain: [number, number] }) {
      const panel = PANELS[pi]!
      const units = [...new Set(panel.series.map((s) => s.unit))]
      return (
        <LineChart width={W} height={PANEL_H} data={rows} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" type="number" domain={domain} allowDataOverflow tickFormatter={fmtTime} />
          {units.map((u, ui) => (
            <YAxis key={u} yAxisId={u} orientation={ui === 0 ? 'left' : 'right'} width={50} />
          ))}
          {panel.series.map((s) => (
            <Line
              key={s.name}
              yAxisId={s.unit}
              dataKey={s.name}
              stroke={s.color}
              dot={false}
              strokeWidth={1}
              isAnimationActive={false}
              type={s.step ? 'stepAfter' : 'linear'}
            />
          ))}
        </LineChart>
      )
    }
    function All() {
      const [domain, set] = useState<[number, number]>([T0, T1])
      setDomain = set
      return (
        <>
          {[0, 1, 2].map((i) => (
            <PanelPortal key={i} i={i} domain={domain} />
          ))}
        </>
      )
    }
    // all three panels inside one React root (simplest); hosts are only used as layout containers
    function PanelPortal({ i, domain }: { i: number; domain: [number, number] }) {
      return (
        <div style={{ width: W, height: PANEL_H }}>
          <Panel pi={i} domain={domain} />
        </div>
      )
    }
    hosts.forEach((h) => (h.style.display = 'none'))
    const holder = document.createElement('div')
    root.appendChild(holder)
    const r = createRoot(holder)
    reactRoots.push(r)
    return {
      mount: async () => {
        flushSync(() => r.render(<All />))
      },
      setWindow: (min: number, max: number) => {
        flushSync(() => setDomain([min, max]))
      },
      cleanup: () => flushSync(() => r.render(<></>)),
    }
  }

  const impl = lib === 'recharts' ? await mountRecharts() : await mountPlotly(lib === 'plotly-gl')
  setWindow = impl.setWindow
  cleanup = impl.cleanup
  await impl.mount()

  window.__api = {
    info: () => ({ lib, rows: log.time.length, fullRows: full.time.length, series: 13, T0, T1, maxpts }),
    renderFresh: async () => {
      cleanup()
      const t = performance.now()
      await impl.mount()
      await raf()
      await raf()
      return performance.now() - t
    },
    panBench: async (frames: number, frac: number) => {
      const w = (T1 - T0) * frac
      await setWindow(T0, T0 + w)
      await raf()
      await raf()
      const deltas: number[] = []
      let last = await raf()
      for (let i = 0; i < frames; i++) {
        const s = T0 + ((T1 - T0 - w) * i) / frames
        void setWindow(s, s + w)
        const now = await raf()
        deltas.push(now - last)
        last = now
      }
      return deltas
    },
    stress: async (n: number, frac: number) => {
      const w = (T1 - T0) * frac
      const costs: number[] = []
      for (let i = 0; i < n; i++) {
        const s = T0 + ((T1 - T0 - w) * i) / n
        const t = performance.now()
        await setWindow(s, s + w)
        costs.push(performance.now() - t)
      }
      return costs
    },
    heap: () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0,
  }
}

void main()
