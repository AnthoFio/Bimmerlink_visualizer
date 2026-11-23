// The charts as one SVG document, for export: every panel with its axes, lines and legend, at
// the current zoom and scales. uPlot draws on canvas and has no SVG output (ADR 0001), so this is
// a writer of our own over the same data. The PNG export rasterises this SVG at 2x.
import type { Axis } from './axes.ts'
import type { Channel } from './channels.ts'
import { downsample } from './downsample.ts'
import { formatAxisTime } from './format.ts'
import { linePath } from './linePath.ts'
import { dashOf, isStepped } from './lineStyle.ts'
import { normalisationSpans, PERCENT_RANGE, toPercent } from './normalise.ts'
import { CHART_COLOURS } from './palette.ts'
import type { Theme } from './palette.ts'
import { panelContent } from './panelContent.ts'
import { panelRanges } from './panelRanges.ts'
import type { LogDataset } from './parseLog.ts'
import type { TimeWindow } from './timeWindow.ts'
import { unitLabel } from './units.ts'
import { axisRangeOf, panelOf, settingsOf } from './view.ts'
import type { Panel, View } from './view.ts'
import type { Range } from './yRange.ts'

interface ExportSeries {
  name: string
  colour: string
  x: Float64Array
  y: ArrayLike<number | null>
  stepped: boolean
  axis: number
  dash: readonly number[]
}

interface ExportPanel {
  height: number
  window: TimeWindow
  duration: number
  axes: Axis[]
  ranges: Range[]
  series: ExportSeries[]
  legend: { name: string; colour: string }[]
}

export interface ExportModel {
  panels: ExportPanel[]
}

interface ModelInput {
  dataset: LogDataset
  channels: readonly Channel[]
  colours: ReadonlyMap<string, string>
  view: View
  windowOf: (panel: Panel) => TimeWindow
}

const POINTS = 1200

/** What each panel shows on screen, recomputed from the same state the charts use. */
export function exportModel({
  dataset,
  channels,
  colours,
  view,
  windowOf,
}: ModelInput): ExportModel {
  const { time } = dataset
  const duration = time.length ? time[time.length - 1]! - time[0]! : 0
  return {
    panels: view.panels.map((panel) => {
      const window = windowOf(panel)
      const shown = new Set(
        view.selected.filter(
          (id) => panelOf(view, id) === panel.id && !settingsOf(view, id).hidden,
        ),
      )
      // Dashes follow the legend, which also lists the hidden series, as on screen.
      const listed = channels
        .filter((c) => view.selected.includes(c.id) && panelOf(view, c.id) === panel.id)
        .map((c) => c.id)
      const normalised = panel.normalise !== 'off'
      const { items, axes } = panelContent(
        channels,
        shown,
        colours,
        normalised,
        (id) => settingsOf(view, id).axis,
      )
      const values = items.map(({ channel }) => dataset.columns[channel.column]!.values)
      const fitted = panel.fit === 'visible' ? window : { min: time[0]!, max: time.at(-1)! }
      const auto = normalised
        ? axes.map(() => PERCENT_RANGE)
        : panelRanges(
            time,
            items.map((item, i) => ({ values: values[i]!, axis: item.axis })),
            axes.length,
            panel.fit,
            fitted,
          )
      const spans = normalised
        ? normalisationSpans(time, values, panel.normalise, window)
        : undefined
      const { x, ys } = downsample(time, values, window, POINTS)
      return {
        height: panel.height,
        window,
        duration,
        axes,
        ranges: axes.map((axis, i) => axisRangeOf(view, panel.id, axis.key) ?? auto[i]!),
        series: items.map(({ channel, colour, axis }, i) => ({
          name: channel.name,
          colour,
          x,
          y: spans ? toPercent(ys[i]!, spans[i]!) : ys[i]!,
          stepped: isStepped(channel, panel.lines),
          axis,
          dash: dashOf(listed.indexOf(channel.id), panel.patterns),
        })),
        legend: items.map(({ channel, colour }) => ({
          name: `${channel.name} (${unitLabel(channel.unit)})`,
          colour,
        })),
      }
    }),
  }
}

/** The file name, with the recording time that BimmerLink puts in it. */
export function logTitle(fileName: string): string {
  const stamp = /(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/.exec(fileName)
  return stamp ? `${fileName}, recorded ${stamp[1]} ${stamp[2]}:${stamp[3]}:${stamp[4]}` : fileName
}

/** Round values for about `count` ticks between min and max. */
export function niceTicks(min: number, max: number, count: number): number[] {
  const raw = (max - min) / count
  if (!(raw > 0) || !Number.isFinite(raw)) return [min]
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((s) => s >= raw)!
  const ticks: number[] = []
  for (let tick = Math.ceil(min / step) * step; tick <= max + step * 1e-9; tick += step) {
    ticks.push(Math.abs(tick) < step * 1e-9 ? 0 : tick)
  }
  return ticks
}

/** XML text: markup characters escaped, and the control characters XML forbids dropped. */
const escape = (text: string) =>
  text
    // eslint-disable-next-line no-control-regex -- removing them is the point
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(
      /[<>&"]/g,
      (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]!,
    )

const tickText = (value: number) => String(Number(value.toPrecision(6)))

const AXIS_WIDTH = 64
const TITLE = 44
const LEGEND_ROW = 18
const X_AXIS = 26
const GAP = 16

interface Options {
  title: string
  theme: Theme
  width: number
}

export function chartSvg(model: ExportModel, { title, theme, width }: Options): string {
  const { surface, ink, grid } = CHART_COLOURS[theme]
  const most = (side: 'left' | 'right') =>
    Math.max(
      0,
      ...model.panels.map((p) => p.axes.filter((a) => a.visible && a.side === side).length),
    )
  const left = Math.max(1, most('left')) * AXIS_WIDTH
  const right = Math.max(most('right') * AXIS_WIDTH, GAP)
  const plotWidth = Math.max(100, width - left - right)

  const parts: string[] = []
  let top = TITLE
  model.panels.forEach((panel, p) => {
    const plotHeight = Math.max(80, panel.height - X_AXIS)
    const { min, max } = panel.window
    const toX = (t: number) => left + ((t - min) / (max - min)) * plotWidth
    const body: string[] = []
    body.push(
      `<rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}" fill="none" stroke="${grid}"/>`,
    )
    for (const t of niceTicks(min, max, 8)) {
      const x = toX(t).toFixed(1)
      body.push(`<line x1="${x}" x2="${x}" y1="${top}" y2="${top + plotHeight}" stroke="${grid}"/>`)
      body.push(
        `<text x="${x}" y="${top + plotHeight + 16}" text-anchor="middle">${escape(formatAxisTime(t, panel.duration, (max - min) / 8))}</text>`,
      )
    }
    const sideCount = { left: 0, right: 0 }
    panel.axes.forEach((axis, a) => {
      if (!axis.visible) return
      const [low, high] = panel.ranges[a]!
      const outward = sideCount[axis.side]++ * AXIS_WIDTH
      const x = axis.side === 'left' ? left - outward : left + plotWidth + outward
      const toY = (v: number) => top + plotHeight - ((v - low) / (high - low)) * plotHeight
      const colour = axis.colour ?? ink
      const anchor = axis.side === 'left' ? 'end' : 'start'
      const dx = axis.side === 'left' ? -6 : 6
      for (const v of niceTicks(low, high, 5)) {
        body.push(
          `<text x="${x + dx}" y="${(toY(v) + 4).toFixed(1)}" text-anchor="${anchor}" fill="${colour}">${tickText(v)}</text>`,
        )
      }
      const titleX = axis.side === 'left' ? x - AXIS_WIDTH + 12 : x + AXIS_WIDTH - 8
      const titleY = top + plotHeight / 2
      body.push(
        `<text x="${titleX}" y="${titleY}" text-anchor="middle" fill="${colour}" transform="rotate(-90 ${titleX} ${titleY})">${escape(axis.title)}</text>`,
      )
    })
    body.push(
      `<clipPath id="clip${p}"><rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`,
    )
    for (const line of panel.series) {
      const [low, high] = panel.ranges[line.axis] ?? [0, 1]
      const d = linePath(
        line.x,
        line.y,
        toX,
        (v) => top + plotHeight - ((v - low) / (high - low)) * plotHeight,
        line.stepped,
      )
      body.push(
        `<path class="series" clip-path="url(#clip${p})" d="${d}" fill="none" stroke="${line.colour}" stroke-width="1.25"${line.dash.length ? ` stroke-dasharray="${line.dash.join(' ')}"` : ''}/>`,
      )
    }
    top += plotHeight + X_AXIS
    panel.legend.forEach((entry, i) => {
      const y = top + 4 + i * LEGEND_ROW
      body.push(`<rect x="${left}" y="${y}" width="10" height="10" fill="${entry.colour}"/>`)
      body.push(`<text x="${left + 16}" y="${y + 9}">${escape(entry.name)}</text>`)
    })
    top += panel.legend.length * LEGEND_ROW + GAP
    parts.push(`<g class="panel">${body.join('')}</g>`)
  })

  const height = Math.round(top)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif" font-size="12" fill="${ink}">` +
    `<rect width="100%" height="100%" fill="${surface}"/>` +
    `<text x="${left}" y="26" font-size="16" font-weight="600">${escape(title)}</text>` +
    `${parts.join('')}</svg>`
  )
}
