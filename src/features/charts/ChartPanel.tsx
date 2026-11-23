// The only module that imports uPlot (ADR 0001). It renders what it is given and decides nothing.
//
// uPlot cannot add a scale or an axis to an existing chart, so a chart gets a scale per channel
// and four axes up front. An unused scale has no range, which hides its axis. That way the
// selection can change without remounting the chart.
import { useLayoutEffect, useRef, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { VISIBLE_AXES } from '../../lib/axes.ts'
import type { Axis, Gutters } from '../../lib/axes.ts'
import { formatAxisTime } from '../../lib/format.ts'
import { downsample } from '../../lib/downsample.ts'
import { chartDrawn } from '../../lib/perfMarks.ts'
import { toPercent } from '../../lib/normalise.ts'
import { CHART_COLOURS } from '../../lib/palette.ts'
import type { Theme } from '../../lib/palette.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import type { Range } from '../../lib/yRange.ts'
import { createAxisStrips } from './axisDrag.ts'
import { attachGestures } from './gestures.ts'
import type { GestureTarget } from './gestures.ts'

/** Read and followed without rendering React: the pointer moves on every frame. */
export interface CursorSource {
  get: () => number | null
  subscribe: (listener: () => void) => () => void
}

export interface PlotSeries {
  id: string
  name: string
  values: Float64Array
  colour: string
  /** Index into `axes`. */
  axis: number
  stepped: boolean
  dash: readonly number[]
  /** In a normalised panel: the min and max that become 0 and 100%. */
  span?: Range
}

interface Props {
  time: Float64Array
  window: TimeWindow
  gestures: GestureTarget
  onRange: (key: string, range: Range | null) => void
  cursor: CursorSource
  selection: TimeWindow | null
  series: readonly PlotSeries[]
  axes: readonly Axis[]
  /** One per axis. */
  ranges: readonly Range[]
  gutters: Gutters
  /** The most axes the chart can ever need: the channels of the log. */
  capacity: number
  theme: Theme
  height: number
}

interface Model extends Props {
  duration: number
}

const FALLBACK_WIDTH = 800
const AXIS_SIZE = 58
const AXIS_TITLE_SIZE = 20
const EDGE = 14
const LEFT = 3
const RIGHT = 1

const scaleKey = (axis: number) => `a${axis}`

/** The strips lie on the gutters, which move whenever the axes do. */
function placeStrips(chart: uPlot) {
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = chart.over
  const size = AXIS_SIZE + AXIS_TITLE_SIZE
  chart.root.querySelectorAll<HTMLElement>('.axis-drag').forEach((strip, slot) => {
    const outwards = Math.floor(slot / 2) * size
    const left = slot % 2 ? offsetLeft + offsetWidth + outwards : offsetLeft - size - outwards
    strip.style.left = `${left}px`
    strip.style.top = `${offsetTop}px`
    strip.style.width = `${size}px`
    strip.style.height = `${offsetHeight}px`
  })
}

function chartOptions(model: () => Model, width: number, height: number): uPlot.Options {
  const ink = () => CHART_COLOURS[model().theme].ink
  const grid = () => CHART_COLOURS[model().theme].grid

  const scales: uPlot.Scales = { x: { time: false } }
  for (let i = 0; i < Math.max(VISIBLE_AXES, model().capacity); i++) {
    scales[scaleKey(i)] = {
      auto: true,
      range: () => {
        const range = model().axes[i]?.members.length ? model().ranges[i] : undefined
        return range ? [range[0], range[1]] : [null, null]
      },
    }
  }

  // Padding fills the gutters that this panel leaves empty and another panel uses.
  const padding = (side: 'left' | 'right') => () => {
    const { axes, gutters } = model()
    const own = axes.filter((axis) => axis.visible && axis.side === side).length
    const missing = Math.max(0, gutters[side] - own) * (AXIS_SIZE + AXIS_TITLE_SIZE)
    return Math.max(EDGE, missing)
  }

  const yAxes = Array.from({ length: VISIBLE_AXES }, (_, i): uPlot.Axis => ({
    scale: scaleKey(i),
    side: i % 2 ? RIGHT : LEFT,
    size: AXIS_SIZE,
    label: '',
    labelSize: AXIS_TITLE_SIZE,
    stroke: () => model().axes[i]?.colour ?? ink(),
    grid: { show: i === 0, stroke: grid, width: 1 },
    ticks: { stroke: grid },
  }))

  return {
    width,
    height,
    padding: [EDGE, padding('right'), 0, padding('left')],
    hooks: {
      draw: [
        (chart) => {
          placeStrips(chart)
          if (chart.series.length > 1) chartDrawn()
        },
      ],
    },
    legend: { show: false },
    cursor: {
      show: false,
      drag: { x: false, y: false },
      // gestures.ts owns the mouse.
      bind: { mousedown: () => null, mouseup: () => null, dblclick: () => null },
    },
    scales,
    series: [{}],
    axes: [
      {
        stroke: ink,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid },
        values: (_plot, splits, _axis, _space, increment) =>
          splits.map((value) => formatAxisTime(value, model().duration, increment)),
      },
      ...yAxes,
    ],
  }
}

export function ChartPanel(props: Props) {
  const {
    time,
    window: shown,
    cursor,
    series,
    axes,
    ranges,
    gutters,
    capacity,
    theme,
    height,
  } = props
  const { selection } = props
  const host = useRef<HTMLDivElement>(null)
  const plot = useRef<uPlot>(null)
  const drawn = useRef('')
  const cursorLine = useRef<HTMLDivElement>(null)
  const band = useRef<HTMLDivElement>(null)
  const axisStrips = useRef<HTMLDivElement[]>([])
  const [width, setWidth] = useState(0)
  const duration = time.length ? time[time.length - 1]! - time[0]! : 0
  const latest = useRef<Model>({ ...props, duration })

  // First, so that the callbacks uPlot calls while it is being updated see the new props.
  useLayoutEffect(() => {
    latest.current = { ...props, duration }
  })

  useLayoutEffect(() => {
    const target = host.current!
    const model = () => latest.current
    const width = target.clientWidth || FALLBACK_WIDTH
    const chart = new uPlot(
      chartOptions(model, width, model().height),
      [new Float64Array()],
      target,
    )
    plot.current = chart
    const line = document.createElement('div')
    line.className = 'cursor-line'
    line.hidden = true
    const highlight = document.createElement('div')
    highlight.className = 'selection-band'
    highlight.hidden = true
    chart.over.append(highlight, line)
    band.current = highlight
    cursorLine.current = line
    drawn.current = ''

    const observer = new ResizeObserver(() => {
      if (!target.clientWidth) return
      chart.setSize({ width: target.clientWidth, height: model().height })
      setWidth(target.clientWidth)
    })
    observer.observe(target)
    const { strips, destroy } = createAxisStrips(VISIBLE_AXES, {
      range: (slot) => model().ranges[slot],
      setRange: (slot, range) => {
        const axis = model().axes[slot]
        if (axis) model().onRange(axis.key, range)
      },
    })
    ;(chart.over.parentElement ?? chart.root).append(...strips)
    axisStrips.current = strips
    const detach = attachGestures(chart.over, {
      window: () => model().gestures.window(),
      extent: () => model().gestures.extent(),
      setWindow: (next) => model().gestures.setWindow(next),
      reset: () => model().gestures.reset(),
      hover: (at) => model().gestures.hover(at),
      select: (range) => model().gestures.select(range),
    })

    return () => {
      detach()
      destroy()
      observer.disconnect()
      chart.destroy()
      plot.current = null
    }
  }, [capacity])

  useLayoutEffect(() => {
    const chart = plot.current!
    const structure = JSON.stringify(
      series.map((line) => [line.id, line.name, line.axis, line.stepped, line.dash]),
    )
    axisStrips.current.forEach((strip, slot) => {
      strip.hidden = !axes[slot]?.visible
    })
    // uPlot reads the titles each time it draws.
    for (let i = 0; i < VISIBLE_AXES; i++) chart.axes[i + 1]!.label = axes[i]?.title ?? ''

    chart.batch(() => {
      if (structure !== drawn.current) {
        drawn.current = structure
        for (let i = chart.series.length - 1; i > 0; i--) chart.delSeries(i)
        series.forEach((line, i) => {
          chart.addSeries(
            {
              label: line.name,
              scale: scaleKey(line.axis),
              // One pixel is a hairline, which software rasterisers stroke several times faster.
              width: 1,
              dash: [...line.dash],
              points: { show: false },
              // align 1 holds each sample until the next one.
              paths: line.stepped ? uPlot.paths.stepped?.({ align: 1 }) : undefined,
              stroke: () => latest.current.series[i]?.colour ?? line.colour,
            },
            i + 1,
          )
        })
      }
      // One bucket per pixel of the plot, sampled again for every window.
      const { x, ys } = downsample(
        time,
        series.map((line) => line.values),
        shown,
        chart.over.clientWidth || width || FALLBACK_WIDTH,
      )
      const drawnYs = ys.map((y, i) => {
        const { span } = series[i]!
        return span ? toPercent(y, span) : y
      })
      chart.setData([x, ...drawnYs], false)
      chart.setScale('x', { min: shown.min, max: shown.max })
    })
  }, [time, series, axes, ranges, capacity, shown, width])

  useLayoutEffect(() => {
    const follow = () => {
      const line = cursorLine.current!
      const at = cursor.get()
      const share = at === null ? -1 : (at - shown.min) / (shown.max - shown.min)
      line.hidden = share < 0 || share > 1
      if (!line.hidden) line.style.left = `${share * 100}%`
    }
    follow()
    return cursor.subscribe(follow)
  }, [cursor, shown, capacity])

  useLayoutEffect(() => {
    const highlight = band.current!
    const span = shown.max - shown.min
    const from = selection ? Math.max(0, (selection.min - shown.min) / span) : 0
    const to = selection ? Math.min(1, (selection.max - shown.min) / span) : 0
    highlight.hidden = to <= from
    highlight.style.left = `${from * 100}%`
    highlight.style.width = `${(to - from) * 100}%`
  }, [selection, shown, capacity])

  // A new size makes uPlot measure the padding again, hence the gutters.
  useLayoutEffect(() => {
    const width = host.current?.clientWidth || FALLBACK_WIDTH
    plot.current?.setSize({ width, height })
  }, [height, gutters, axes, capacity])

  useLayoutEffect(() => {
    plot.current?.redraw()
  }, [theme])

  return <div ref={host} className="chart-host" />
}
