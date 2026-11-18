// THROWAWAY spike code: trivial CSV parser + the panel layout used to compare charting libraries.
// This is NOT the real parser (that is the "CSV upload and parsing" feature).

export interface Log {
  time: Float64Array
  /** column name -> values (same length as time) */
  cols: Map<string, Float64Array>
}

export function parseLog(text: string): Log {
  const lines = text.split(/\r?\n/)
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  const header = (lines[0] ?? '').split(',').map((h) => h.replace(/^"|"$/g, ''))
  const n = lines.length - 1
  const raw = header.map(() => new Float64Array(n))
  for (let i = 0; i < n; i++) {
    const parts = (lines[i + 1] ?? '').split(',')
    for (let c = 0; c < header.length; c++) raw[c]![i] = Number(parts[c])
  }
  const cols = new Map<string, Float64Array>()
  header.forEach((name, c) => {
    if (c > 0) cols.set(name, raw[c]!)
  })
  const time = raw[0]!
  // The example file has 11 channels; the epic's target is 13, so add 2 derived channels.
  const rpm = cols.get('Engine Speed')!
  const avg = new Float64Array(n)
  const W = 33 // ~1 s at 30 ms sampling
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += rpm[i]!
    if (i >= W) acc -= rpm[i - W]!
    avg[i] = acc / Math.min(i + 1, W)
  }
  cols.set('Engine Speed (1 s avg, derived)', avg)
  const actual = cols.get('Filtered Rail Pressure Actual Value (Absolute Pressure)')!
  const target = cols.get('Target Rail Pressure')!
  const err = new Float64Array(n)
  for (let i = 0; i < n; i++) err[i] = actual[i]! - target[i]!
  cols.set('Rail pressure error (derived)', err)
  return { time, cols }
}

export interface SeriesDef {
  name: string
  unit: string
  color: string
  step?: boolean
}
export interface PanelDef {
  id: string
  title: string
  /** relative height weight */
  weight: number
  series: SeriesDef[]
}

// 4 + 3 + 6 = 13 series in 3 stacked panels; panel 1 has three different units => three Y axes.
export const PANELS: PanelDef[] = [
  {
    id: 'engine',
    title: 'Engine',
    weight: 4,
    series: [
      { name: 'Engine Speed', unit: 'rpm', color: '#e6194b' },
      { name: 'Engine Speed (1 s avg, derived)', unit: 'rpm', color: '#f58231' },
      { name: 'Normalized Accelerator Pedal Angle', unit: '%', color: '#3cb44b' },
      { name: 'Oil Temperature', unit: '°C', color: '#4363d8' },
    ],
  },
  {
    id: 'fuel',
    title: 'Fuel rail',
    weight: 3,
    series: [
      { name: 'Filtered Rail Pressure Actual Value (Absolute Pressure)', unit: 'bar', color: '#911eb4' },
      { name: 'Target Rail Pressure', unit: 'bar', color: '#42d4f4' },
      { name: 'Rail pressure error (derived)', unit: 'bar', color: '#f032e6' },
    ],
  },
  {
    id: 'misfire',
    title: 'Misfire counters',
    weight: 3,
    series: [1, 2, 3, 4, 5, 6].map((c, i) => ({
      name: `Misfire Detection Counter Cylinder ${c}`,
      unit: 'count',
      color: ['#9a6324', '#808000', '#469990', '#800000', '#000075', '#a9a9a9'][i]!,
      step: true,
    })),
  },
]

export async function loadLog(): Promise<Log> {
  const res = await fetch('/log.csv')
  return parseLog(await res.text())
}
