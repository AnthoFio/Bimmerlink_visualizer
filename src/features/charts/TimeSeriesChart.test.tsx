/// <reference types="node" />
import { act, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { parameters } from '../../data/catalog.ts'
import { describeChannels } from '../../lib/channels.ts'
import { formatAxisTime } from '../../lib/format.ts'
import { parseLogText } from '../../lib/parseLog.ts'
import { createViewport } from '../../lib/viewport.ts'
import { exampleLogNames, loadExampleBytes, loadFixtureText } from '../../test/fixtures.ts'
import { FakeUplot } from '../../test/fakeUplot.ts'
import { TimeSeriesChart } from './TimeSeriesChart.tsx'

function logOf(text: string) {
  const dataset = parseLogText(text)
  const channels = describeChannels(
    dataset.columns.map((column) => column.name),
    parameters,
  )
  return { dataset, channels }
}

const { dataset, channels } = logOf(loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
const LOOK = { colours: new Map<string, string>(), theme: 'light' } as const
const ids = channels.map((channel) => channel.id)
const chart = (selected: string[]) => (
  <TimeSeriesChart dataset={dataset} channels={channels} {...LOOK} selected={new Set(selected)} />
)

beforeEach(() => FakeUplot.reset())

describe('TimeSeriesChart', () => {
  it('draws one line per selected parameter against time', () => {
    render(chart(ids.slice(0, 3)))

    const plot = FakeUplot.last
    expect(plot.series.slice(1).map((series) => series.label)).toEqual(
      channels.slice(0, 3).map((channel) => channel.name),
    )
    expect(Array.from(plot.data[0]!)).toEqual(Array.from(dataset.time))
    expect(Array.from(plot.data[2]!)).toEqual(Array.from(dataset.columns[1]!.values))
    expect(plot.x).toEqual({ min: dataset.time[0], max: dataset.time.at(-1) })
  })

  it('updates the series without remounting the chart', () => {
    const { rerender } = render(chart([ids[0]!]))
    const plot = FakeUplot.last

    rerender(chart([ids[1]!, ids[4]!]))

    expect(FakeUplot.instances).toEqual([plot])
    expect(plot.destroyed).toBe(false)
    expect(plot.series.slice(1).map((series) => series.label)).toEqual([
      channels[1]!.name,
      channels[4]!.name,
    ])
    expect(plot.data).toHaveLength(3)
  })

  it('keeps the chart through an empty selection, with a helpful empty state', () => {
    const { rerender } = render(chart([ids[0]!]))
    const plot = FakeUplot.last

    rerender(chart([]))
    expect(screen.getByText(/select one or more parameters/i)).toBeVisible()

    rerender(chart([ids[2]!]))
    expect(screen.queryByText(/select one or more parameters/i)).toBeNull()
    expect(FakeUplot.instances).toEqual([plot])
  })

  it('draws a blank cell as a gap', () => {
    const gappy = logOf('Time,"A"\n0,1\n1,\n2,3\n')
    render(<TimeSeriesChart {...gappy} {...LOOK} selected={new Set([gappy.channels[0]!.id])} />)

    expect(FakeUplot.last.data[1]).toEqual([1, null, 3])
  })

  it('destroys the chart when it goes away', () => {
    const { unmount } = render(chart([ids[0]!]))
    unmount()

    expect(FakeUplot.last.destroyed).toBe(true)
  })

  it.each(exampleLogNames)('works on %s', (name) => {
    const log = logOf(new TextDecoder().decode(loadExampleBytes(name)))
    render(<TimeSeriesChart {...log} {...LOOK} selected={new Set(log.channels.map((c) => c.id))} />)

    const { data } = FakeUplot.last
    expect(data).toHaveLength(log.channels.length + 1)
    expect(data[0]!.length).toBeGreaterThan(100)
    expect(data.every((column) => column!.length === data[0]!.length)).toBe(true)
  })
})

describe('formatAxisTime', () => {
  it('uses seconds in a log of up to 120 s', () => {
    expect(formatAxisTime(75, 120, 5)).toBe('75 s')
    expect(formatAxisTime(1.5, 4, 0.5)).toBe('1.5 s')
  })

  it('uses mm:ss in a longer log, with decimals when zoomed in', () => {
    expect(formatAxisTime(75, 121, 5)).toBe('01:15')
    expect(formatAxisTime(612.5, 1533, 0.5)).toBe('10:12.5')
    expect(formatAxisTime(59.999, 1533, 0.1)).toBe('01:00.0')
  })
})

describe('the chart engine boundary', () => {
  it('lets only ChartPanel import uplot', () => {
    const importers = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .map((name) => name.replaceAll('\\', '/'))
      .filter(
        (name) => /\.tsx?$/.test(name) && !name.startsWith('test/') && !name.includes('.test.'),
      )
      .filter((name) => /from 'uplot/.test(readFileSync(`src/${name}`, 'utf8')))

    expect(importers).toEqual(['features/charts/ChartPanel.tsx'])
  })
})

describe('units', () => {
  it('shows the unit of each series in the legend', () => {
    render(chart([ids[8]!, ids[9]!]))

    const legend = screen.getByRole('list', { name: 'Legend' })
    expect(legend).toHaveTextContent('°C')
    expect(legend).toHaveTextContent('rpm')
  })

  it('titles the axis with the unit', () => {
    render(chart([ids[9]!]))
    expect(FakeUplot.last.axes[1]!.label).toBe('rpm')
  })
})

describe('axes by unit', () => {
  const plotted = () => FakeUplot.last.series.slice(1).map((series) => series.scale)

  it('puts channels with different units on their own axes', () => {
    render(chart([ids[0]!, ids[1]!, ids[8]!, ids[9]!]))

    const [count1, count2, celsius, rpm] = plotted()
    expect(count1).toBe(count2)
    expect(new Set([count1, celsius, rpm]).size).toBe(3)
    const { axes } = FakeUplot.last
    expect(axes.slice(1, 4).map((axis) => axis.label)).toEqual(['count', '°C', 'rpm'])
    expect(axes.slice(1, 5).map((axis) => axis.side)).toEqual([3, 1, 3, 1])
  })

  it('lists the axes that do not fit under the chart', () => {
    render(chart([ids[0]!, ids[6]!, ids[8]!, ids[9]!, ids[10]!]))

    // Five units: count, bar, °C, rpm, %; the fifth does not fit.
    expect(screen.getByRole('list', { name: 'Further axes' })).toHaveTextContent('%')
  })
})

describe('downsampling', () => {
  it('draws few points for a long log and samples again on zoom', () => {
    const log = logOf(new TextDecoder().decode(loadExampleBytes('2026-10-25_09-33-22.csv')))
    const viewport = createViewport()
    render(
      <TimeSeriesChart
        {...log}
        {...LOOK}
        viewport={viewport}
        selected={new Set([log.channels[0]!.id])}
      />,
    )
    expect(FakeUplot.last.data[0]!.length).toBeLessThan(4000)

    act(() => viewport.set({ window: { min: 600, max: 610 } }))
    const x = Array.from(FakeUplot.last.data[0]!)
    expect(x.length).toBeGreaterThan(300)
    expect(x[0]).toBeGreaterThan(599.8)
    expect(x.at(-1)).toBeLessThan(610.2)
  })
})
