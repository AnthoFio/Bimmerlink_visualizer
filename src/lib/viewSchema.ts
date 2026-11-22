// Reads a view back from storage or a file. Anything can be in there, so every field is checked;
// what is wrong is dropped, and what does not exist in this log is reported.
import { AXIS_CHOICES } from './axes.ts'
import { hash } from './hash.ts'
import { FIT_MODES, LINE_STYLES, NORMALISE_MODES, PANEL_HEIGHT } from './view.ts'
import type { AxisSetting, Panel, SeriesSettings, View } from './view.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const oneOf = <T extends string>(options: readonly T[], value: unknown): T | undefined =>
  options.find((option) => option === value)

const COLOUR = /^#[0-9a-f]{6}$/i

function readPanel(value: unknown): Panel | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) return undefined
  const height = Number(value.height)
  return {
    id: value.id,
    height: Number.isFinite(height)
      ? Math.min(PANEL_HEIGHT.max, Math.max(PANEL_HEIGHT.min, Math.round(height)))
      : PANEL_HEIGHT.initial,
    lines: oneOf(LINE_STYLES, value.lines) ?? 'auto',
    fit: oneOf(FIT_MODES, value.fit) ?? 'visible',
    normalise: oneOf(NORMALISE_MODES, value.normalise) ?? 'off',
    synced: value.synced !== false,
    patterns: value.patterns === true,
  }
}

function readSeries(value: unknown, panels: ReadonlySet<string>): SeriesSettings {
  if (!isRecord(value)) return {}
  const settings: SeriesSettings = {}
  if (typeof value.panel === 'string' && panels.has(value.panel)) settings.panel = value.panel
  const axis = oneOf(AXIS_CHOICES, value.axis)
  if (axis) settings.axis = axis
  if (typeof value.colour === 'string' && COLOUR.test(value.colour)) settings.colour = value.colour
  if (value.hidden === true) settings.hidden = true
  return settings
}

function readAxis(value: unknown, panels: ReadonlySet<string>): AxisSetting | undefined {
  if (!isRecord(value) || typeof value.panel !== 'string' || typeof value.key !== 'string') {
    return undefined
  }
  const { min, max } = value
  if (typeof min !== 'number' || typeof max !== 'number') return undefined
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return undefined
  if (!panels.has(value.panel)) return undefined
  return { panel: value.panel, key: value.key, min, max }
}

export interface ReadView {
  view: View
  /** Parameter ids that the stored view named and this log does not have. */
  skipped: string[]
}

/** The view, or undefined when the value is not a view at all. */
export function readView(value: unknown, ids: readonly string[]): ReadView | undefined {
  if (!isRecord(value) || typeof value.trim !== 'boolean') return undefined
  if (!Array.isArray(value.selected) || !Array.isArray(value.panels)) return undefined

  const panels: Panel[] = []
  for (const candidate of value.panels) {
    const panel = readPanel(candidate)
    if (panel && !panels.some((known) => known.id === panel.id)) panels.push(panel)
  }
  if (panels.length === 0) return undefined
  const panelIds = new Set(panels.map((panel) => panel.id))

  const known = new Set(ids)
  const skipped = new Set<string>()
  const keep = (id: unknown): id is string => {
    if (typeof id !== 'string') return false
    if (!known.has(id)) skipped.add(id)
    return known.has(id)
  }

  const selected = [...new Set(value.selected.filter(keep))]
  // fromEntries, because assigning to the key `__proto__` would not create a property.
  const series = Object.fromEntries(
    Object.entries(isRecord(value.series) ? value.series : {})
      .filter(([id]) => keep(id))
      .map(([id, settings]) => [id, readSeries(settings, panelIds)] as const)
      .filter(([, settings]) => Object.keys(settings).length > 0),
  )
  const axes = (Array.isArray(value.axes) ? value.axes : [])
    .map((axis) => readAxis(axis, panelIds))
    .filter((axis) => axis !== undefined)

  return {
    view: { trim: value.trim, selected, panels, axes, series },
    skipped: [...skipped],
  }
}

/** The storage key of a column layout: the same set of columns, in any order, shares it. */
export function layoutKey(ids: readonly string[]): string {
  return `blv:view:v1:${hash([...ids].sort().join('\n'))
    .toString(16)
    .padStart(8, '0')}`
}
