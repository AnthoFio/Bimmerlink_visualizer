import { describe, expect, it } from 'vitest'
import { parameters } from '../data/catalog.ts'
import { loadFixtureText } from '../test/fixtures.ts'
import { describeChannels } from './channels.ts'
import { chartSvg, exportModel, logTitle, niceTicks } from './chartSvg.ts'
import { parseLogText } from './parseLog.ts'
import { addPanel, assignPanel, defaultView, setAxisRange } from './view.ts'

const dataset = parseLogText(loadFixtureText('trimmed_2026-10-25_09-33-22.csv'))
const channels = describeChannels(
  dataset.columns.map((column) => column.name),
  parameters,
)
const colours = new Map(channels.map((channel) => [channel.id, '#1f6fd0']))
const twoPanels = (() => {
  let view = addPanel(defaultView(['engine speed', 'oil temperature']))
  view = assignPanel(view, 'oil temperature', view.panels[1]!.id)
  return setAxisRange(view, view.panels[0]!.id, 'unit:rpm', [100, 900])
})()

const svgOf = (window = { min: 1, max: 3 }) =>
  chartSvg(exportModel({ dataset, channels, colours, view: twoPanels, windowOf: () => window }), {
    title: logTitle('2026-10-25_09-33-22.csv'),
    theme: 'light',
    width: 1000,
  })

describe('chart export', () => {
  it('has every panel with its series, legend and axis titles', () => {
    const svg = svgOf()

    expect(svg.match(/<path class="series"/g)).toHaveLength(2)
    expect(svg.match(/<g class="panel"/g)).toHaveLength(2)
    expect(svg).toContain('>rpm<')
    expect(svg).toContain('>°C<')
    expect(svg).toContain('>Engine Speed (rpm)<')
    expect(svg).toContain('>Oil Temperature (°C)<')
  })

  it('names the log and its date', () => {
    expect(svgOf()).toContain('2026-10-25_09-33-22.csv, recorded 2026-10-25 09:33:22')
    expect(logTitle('drive.csv')).toBe('drive.csv')
  })

  it('reflects the zoom and the scales', () => {
    const zoomed = svgOf({ min: 1, max: 2 })

    expect(zoomed).toContain('>1.0 s<')
    expect(zoomed).toContain('>2.0 s<')
    expect(zoomed).not.toContain('>3.0 s<')
    // The manual range of rpm (100 to 900); its automatic range would be around 0.
    expect(zoomed).toContain('>800<')
  })

  it('escapes text', () => {
    expect(chartSvg({ panels: [] }, { title: '<script>&', theme: 'dark', width: 400 })).toContain(
      '&lt;script&gt;&amp;',
    )
  })

  it('is a standalone SVG document', () => {
    expect(svgOf()).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1000" height="\d+"/,
    )
  })
})

describe('niceTicks', () => {
  it.each([
    [0, 100, [0, 20, 40, 60, 80, 100]],
    [100, 900, [200, 400, 600, 800]],
    [0.95, 1.05, [0.96, 0.98, 1, 1.02, 1.04]],
  ])('gives round ticks from %s to %s', (min, max, ticks) => {
    expect(niceTicks(min, max, 6).map((tick) => Number(tick.toFixed(6)))).toEqual(ticks)
  })
})
