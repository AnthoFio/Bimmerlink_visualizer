// The only module that imports uPlot (ADR 0001). It renders what it is given and decides nothing.
//
// uPlot cannot add a scale or an axis to an existing chart, so a chart gets a scale per channel
// and four axes up front. An unused scale has no range, which hides its axis. That way the
// selection can change without remounting the chart.
import { useLayoutEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { VISIBLE_AXES } from '../../lib/axes.ts'
import type { Axis, Gutters } from '../../lib/axes.ts'
import { formatAxisTime } from '../../lib/format.ts'
import { withGaps } from '../../lib/gaps.ts'
import { CHART_COLOURS } from '../../lib/palette.ts'
import type { Theme } from '../../lib/palette.ts'
import type { TimeWindow } from '../../lib/timeWindow.ts'
import type { Range } from '../../lib/yRange.ts'
import { attachGestures } from './gestures.ts'
import type { GestureTarget } from './gestures.ts'

export interface PlotSeries {
  id: string
  name: string
  values: Float64Array
  colour: string
  /** Index into `axes`. */
  axis: number
}

interface Props {
  time: Float64Array
  window: TimeWindow
  gestures: GestureTarget
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

function chartOptions(model: () => Model, width: number, height: number): uPlot.Options {
  const ink = () => CHART_COLOURS[model().theme].ink
  const grid = () => CHART_COLOURS[model().theme].grid

  const scales: uPlot.Scales = { x: { time: false } }
  for (let i = 0; i < Math.max(VISIBLE_AXES, model().capacity); i++) {
    scales[scaleKey(i)] = {
      auto: true,
      range: () => {
        const range = model().ranges[i]
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
  const { time, window: shown, series, axes, ranges, gutters, capacity, theme, height } = props
  const host = useRef<HTMLDivElement>(null)
  const plot = useRef<uPlot>(null)
  const drawn = useRef('')
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
    drawn.current = ''

    const observer = new ResizeObserver(() => {
      if (target.clientWidth) chart.setSize({ width: target.clientWidth, height: model().height })
    })
    observer.observe(target)
    const detach = attachGestures(chart.over, {
      window: () => model().gestures.window(),
      extent: () => model().gestures.extent(),
      setWindow: (next) => model().gestures.setWindow(next),
      reset: () => model().gestures.reset(),
    })

    return () => {
      detach()
      observer.disconnect()
      chart.destroy()
      plot.current = null
    }
  }, [capacity])

  useLayoutEffect(() => {
    const chart = plot.current!
    const structure = JSON.stringify(series.map((line) => [line.id, line.name, line.axis]))
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
              width: 1.5,
              points: { show: false },
              stroke: () => latest.current.series[i]?.colour ?? line.colour,
            },
            i + 1,
          )
        })
      }
      chart.setData([time, ...series.map((line) => withGaps(line.values))], false)
      chart.setScale('x', { min: latest.current.window.min, max: latest.current.window.max })
    })
  }, [time, series, axes, ranges, capacity])

  useLayoutEffect(() => {
    plot.current?.setScale('x', { min: shown.min, max: shown.max })
  }, [shown])

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
