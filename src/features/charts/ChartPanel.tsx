// The only module that imports uPlot (ADR 0001). It renders what it is given and decides nothing.
import { useEffect, useLayoutEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { formatAxisTime } from '../../lib/format.ts'
import { withGaps } from '../../lib/gaps.ts'
import { CHART_COLOURS } from '../../lib/palette.ts'
import type { Theme } from '../../lib/palette.ts'

export interface PlotSeries {
  id: string
  name: string
  values: Float64Array
  colour: string
}

interface Props {
  time: Float64Array
  series: readonly PlotSeries[]
  axisTitle: string
  theme: Theme
  height: number
}

interface Model extends Props {
  duration: number
}

const FALLBACK_WIDTH = 800

function chartOptions(model: () => Model, width: number, height: number): uPlot.Options {
  const ink = () => CHART_COLOURS[model().theme].ink
  const grid = () => CHART_COLOURS[model().theme].grid

  return {
    width,
    height,
    legend: { show: false },
    cursor: { show: false },
    scales: { x: { time: false }, y: { auto: true } },
    series: [{}],
    axes: [
      {
        stroke: ink,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid },
        values: (_plot, splits, _axis, _space, increment) =>
          splits.map((value) => formatAxisTime(value, model().duration, increment)),
      },
      {
        scale: 'y',
        stroke: ink,
        size: 64,
        label: '',
        labelSize: 20,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid },
      },
    ],
  }
}

export function ChartPanel(props: Props) {
  const { time, series, axisTitle, theme, height } = props
  const host = useRef<HTMLDivElement>(null)
  const plot = useRef<uPlot>(null)
  const drawn = useRef('')
  const duration = time.length ? time[time.length - 1]! - time[0]! : 0
  const latest = useRef<Model>({ ...props, duration })

  // First, so that the callbacks uPlot calls while it is being updated see the new props.
  useLayoutEffect(() => {
    latest.current = { time, series, axisTitle, theme, height, duration }
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

    return () => {
      observer.disconnect()
      chart.destroy()
      plot.current = null
    }
  }, [])

  useLayoutEffect(() => {
    const chart = plot.current!
    const structure = JSON.stringify(series.map((line) => [line.id, line.name]))
    // uPlot reads the title each time it draws.
    chart.axes[1]!.label = axisTitle
    chart.batch(() => {
      if (structure !== drawn.current) {
        drawn.current = structure
        for (let i = chart.series.length - 1; i > 0; i--) chart.delSeries(i)
        series.forEach((line, i) => {
          chart.addSeries(
            {
              label: line.name,
              scale: 'y',
              width: 1.5,
              points: { show: false },
              stroke: () => latest.current.series[i]?.colour ?? line.colour,
            },
            i + 1,
          )
        })
      }
      chart.setData([time, ...series.map((line) => withGaps(line.values))], false)
      if (time.length) {
        const min = time[0]!
        chart.setScale('x', { min, max: Math.max(min + 0.001, time[time.length - 1]!) })
      }
    })
  }, [time, series, axisTitle])

  useEffect(() => {
    const width = host.current?.clientWidth || FALLBACK_WIDTH
    plot.current?.setSize({ width, height })
  }, [height])

  useEffect(() => {
    plot.current?.redraw()
  }, [theme])

  return <div ref={host} className="chart-host" />
}
