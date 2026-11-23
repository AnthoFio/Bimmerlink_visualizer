// Stands in for uPlot in jsdom, which has no canvas. It records what the chart panel asks for.
import type uPlot from 'uplot'

export class FakeUplot {
  static instances: FakeUplot[] = []
  static paths = {
    stepped: () => () => null,
    linear: () => () => null,
  }

  static reset() {
    FakeUplot.instances = []
  }

  static get last(): FakeUplot {
    const last = FakeUplot.instances.at(-1)
    if (!last) throw new Error('no chart was created')
    return last
  }

  opts: uPlot.Options
  data: uPlot.AlignedData
  series: uPlot.Series[]
  axes: uPlot.Axis[]
  root = document.createElement('div')
  over = document.createElement('div')
  width: number
  height: number
  x: { min: number; max: number } | undefined
  destroyed = false
  redraws = 0

  constructor(opts: uPlot.Options, data: uPlot.AlignedData, target: HTMLElement) {
    this.opts = opts
    this.data = data
    this.series = [...opts.series]
    this.axes = [...(opts.axes ?? [])]
    this.width = opts.width
    this.height = opts.height
    this.root.append(this.over)
    target.append(this.root)
    FakeUplot.instances.push(this)
  }

  addSeries(series: uPlot.Series, index = this.series.length) {
    this.series.splice(index, 0, series)
  }

  delSeries(index: number) {
    this.series.splice(index, 1)
  }

  setData(data: uPlot.AlignedData) {
    this.data = data
  }

  setScale(key: string, range: { min: number; max: number }) {
    if (key === 'x') this.x = { ...range }
  }

  setSize(size: { width: number; height: number }) {
    this.width = size.width
    this.height = size.height
  }

  batch(work: () => void) {
    work()
  }

  redraw() {
    this.redraws++
  }

  /** The plot area is 1000 px wide and shows the current window. */
  valToPos(value: number) {
    const { min, max } = this.x ?? { min: 0, max: 1 }
    return ((value - min) / (max - min)) * 1000
  }

  posToVal(position: number) {
    const { min, max } = this.x ?? { min: 0, max: 1 }
    return min + (position / 1000) * (max - min)
  }

  destroy() {
    this.destroyed = true
    this.root.remove()
  }
}
