// THROWAWAY spike: Apache ECharts prototype, ONE chart instance with 3 stacked grids (synced zoom + axisPointer),
// multi Y axes by unit, inside dataZoom (wheel / drag), slider minimap, tooltip, theme switch, PNG + SVG export.
import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { parseLog, PANELS, type Log } from './log.ts'

echarts.use([
  LineChart,
  AxisPointerComponent,
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
  SVGRenderer,
])

const variant = new URLSearchParams(location.search).get('variant') ?? 'lttb' // lttb | minmax | nosampling
const THEMES = {
  light: { fg: '#222', grid: '#e3e3e3', bg: '#ffffff' },
  dark: { fg: '#ddd', grid: '#3a3a3a', bg: '#161616' },
}
type ThemeName = keyof typeof THEMES
let theme: ThemeName = 'light'
let chart: echarts.ECharts | null = null
let logRef: Log | null = null

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

const GRID_LEFT = 70
const GRID_RIGHT = 130
const TOP = 28
const BOTTOM = 40 // slider

function layout(height: number) {
  const usable = height - TOP - BOTTOM - PANELS.length * 28
  const wsum = PANELS.reduce((a, p) => a + p.weight, 0)
  let y = TOP
  return PANELS.map((p) => {
    const h = Math.floor((usable * p.weight) / wsum)
    const top = y + 18
    y = top + h + 10
    return { top, height: h }
  })
}

function buildOption(log: Log, height: number, t: ThemeName): echarts.EChartsCoreOption {
  const c = THEMES[t]
  const rects = layout(height)
  const source: Record<string, ArrayLike<number>> = { Time: Array.from(log.time) }
  for (const [k, v] of log.cols) source[k] = Array.from(v)
  const grids: unknown[] = []
  const xAxes: unknown[] = []
  const yAxes: unknown[] = []
  const series: unknown[] = []
  const titles: unknown[] = []
  PANELS.forEach((panel, pi) => {
    const r = rects[pi]!
    grids.push({ left: GRID_LEFT, right: GRID_RIGHT, top: r.top, height: r.height })
    titles.push({ text: panel.title, top: r.top - 20, left: GRID_LEFT, textStyle: { color: c.fg, fontSize: 13 } })
    xAxes.push({
      type: 'value',
      gridIndex: pi,
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: { color: c.fg, formatter: (v: number) => fmtTime(v) },
      axisLine: { lineStyle: { color: c.grid } },
      splitLine: { show: true, lineStyle: { color: c.grid } },
      axisPointer: { show: true },
    })
    const units = [...new Set(panel.series.map((s) => s.unit))]
    const yIndexByUnit = new Map<string, number>()
    units.forEach((unit, ui) => {
      const users = panel.series.filter((s) => s.unit === unit)
      const col = users.length === 1 ? users[0]!.color : c.fg
      yIndexByUnit.set(unit, yAxes.length)
      yAxes.push({
        type: 'value',
        gridIndex: pi,
        name: unit,
        scale: true, // do not force zero: fit to data
        position: ui === 0 ? 'left' : 'right',
        offset: ui <= 1 ? 0 : (ui - 1) * 60, // extra right-hand axes stack outwards
        nameTextStyle: { color: col },
        axisLabel: { color: col },
        axisLine: { show: true, lineStyle: { color: col } },
        splitLine: { show: ui === 0, lineStyle: { color: c.grid } },
      })
    })
    for (const s of panel.series) {
      series.push({
        type: 'line',
        name: s.name,
        xAxisIndex: pi,
        yAxisIndex: yIndexByUnit.get(s.unit),
        datasetIndex: 0,
        encode: { x: 'Time', y: s.name },
        showSymbol: false,
        animation: false,
        lineStyle: { width: 1, color: s.color },
        itemStyle: { color: s.color },
        step: s.step ? 'end' : false,
        sampling: variant === 'nosampling' ? undefined : variant,
      })
    }
  })
  return {
    animation: false,
    backgroundColor: c.bg,
    textStyle: { color: c.fg },
    dataset: { source },
    title: titles,
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series,
    axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true },
    tooltip: { trigger: 'axis', confine: true, transitionDuration: 0, axisPointer: { type: 'cross' } },
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2], filterMode: 'filter', zoomOnMouseWheel: true, moveOnMouseMove: true },
      {
        type: 'slider',
        xAxisIndex: [0, 1, 2],
        filterMode: 'filter',
        height: 18,
        bottom: 6,
        showDataShadow: false,
        textStyle: { color: c.fg },
      },
    ],
  }
}

/** partial option merged on top of the current one: only colours (shows the cost of a theme switch) */
function themeOption(t: ThemeName): echarts.EChartsCoreOption {
  const c = THEMES[t]
  return {
    backgroundColor: c.bg,
    textStyle: { color: c.fg },
    title: PANELS.map(() => ({ textStyle: { color: c.fg } })),
    xAxis: PANELS.map(() => ({
      axisLabel: { color: c.fg },
      axisLine: { lineStyle: { color: c.grid } },
      splitLine: { lineStyle: { color: c.grid } },
    })),
    yAxis: PANELS.flatMap((p) =>
      [...new Set(p.series.map((s) => s.unit))].map((unit, ui) => {
        const users = p.series.filter((s) => s.unit === unit)
        const col = users.length === 1 ? users[0]!.color : c.fg
        return {
          nameTextStyle: { color: col },
          axisLabel: { color: col },
          axisLine: { lineStyle: { color: col } },
          splitLine: { show: ui === 0, lineStyle: { color: c.grid } },
        }
      }),
    ),
    dataZoom: [{}, { textStyle: { color: c.fg } }],
  }
}

declare global {
  interface Window {
    __api: Record<string, unknown>
  }
}

export function App() {
  const host = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState('loading...')
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
      const el = host.current!
      const height = Math.max(window.innerHeight - 40, 400)
      el.style.height = height + 'px'
      const make = () => {
        chart?.dispose()
        chart = echarts.init(el, undefined, { renderer: 'canvas' })
        chart.setOption(buildOption(log, height, theme))
      }
      make()
      setStatus(`${log.time.length} rows x 13 series (sampling: ${variant})`)
      const T0 = log.time[0]!
      const T1 = log.time[log.time.length - 1]!
      const raf = () => new Promise<number>((r) => requestAnimationFrame(r))
      const setWindow = (min: number, max: number) => {
        chart!.dispatchAction({ type: 'dataZoom', startValue: min, endValue: max })
      }
      window.__api = {
        info: () => ({ rows: log.time.length, series: 13, parseMs, fetchMs: t1 - t0, T0, T1, variant }),
        renderFresh: async () => {
          chart?.dispose()
          chart = null
          const t = performance.now()
          make()
          await raf()
          await raf()
          return performance.now() - t
        },
        setWindow,
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
        /** back-to-back updates: dispatch (data filter + sampling + layout) + immediate canvas paint */
        stress: async (n: number, frac: number) => {
          const w = (T1 - T0) * frac
          const costs: number[] = []
          for (let i = 0; i < n; i++) {
            const s = T0 + ((T1 - T0 - w) * i) / n
            const t = performance.now()
            setWindow(s, s + w)
            chart!.getZr().flush()
            costs.push(performance.now() - t)
          }
          return costs
        },
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
        scalesX: () => {
          const dz = (chart!.getOption() as { dataZoom: { startValue: number; endValue: number }[] }).dataZoom[0]!
          // one chart instance: a single shared window by construction; report it once per panel
          return PANELS.map(() => [dz.startValue, dz.endValue])
        },
        exportAll: async () => {
          const out: Record<string, unknown> = {}
          let t = performance.now()
          const png = chart!.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: THEMES[theme].bg })
          out.png_2x = { ms: performance.now() - t, base64_chars: png.length }
          t = performance.now()
          try {
            const svgChart = echarts.init(null, undefined, { renderer: 'svg', ssr: true, width: 1280, height })
            svgChart.setOption(buildOption(log, height, theme))
            const svg = svgChart.renderToSVGString()
            out.svg = { ms: performance.now() - t, bytes: svg.length, sampling: variant }
            svgChart.dispose()
          } catch (e) {
            out.svg = { error: String(e) }
          }
          return out
        },
        setTheme: (t: ThemeName) => applyTheme(t),
      }
    })()
    return () => {
      cancelled = true
      chart?.dispose()
      chart = null
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
        <b>ECharts spike</b>
        <span id="status">{status}</span>
        <button onClick={toggle}>theme: {dark ? 'dark' : 'light'}</button>
        <button
          onClick={() => {
            const a = document.createElement('a')
            a.href = chart!.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: THEMES[theme].bg })
            a.download = `${logRef ? '2026-10-25_09-33-22' : 'chart'}.png`
            a.click()
          }}
        >
          export PNG
        </button>
      </div>
      <div ref={host} style={{ width: '100%' }} />
    </div>
  )
}

function applyTheme(t: ThemeName) {
  theme = t
  document.body.style.background = THEMES[t].bg
  chart?.setOption(themeOption(t))
}
