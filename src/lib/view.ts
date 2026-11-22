// The view: everything the user chose about a log. Plain data and pure updates, so that it can
// be compared, saved and exported. The time window and the cursor are not part of it.

export const PANEL_HEIGHT = { min: 160, max: 900, step: 20, initial: 420, added: 260 }

export const LINE_STYLES = ['auto', 'linear', 'step'] as const
/** `auto` steps flags, counters and the gear. */
export type LineStyle = (typeof LINE_STYLES)[number]

export const FIT_MODES = ['visible', 'all'] as const
/** What automatic Y ranges fit: the visible window or all data. */
export type FitMode = (typeof FIT_MODES)[number]

export interface Panel {
  id: string
  /** Pixels. */
  height: number
  lines: LineStyle
  fit: FitMode
  /** Shares the time window and the cursor with the other panels. */
  synced: boolean
}

/** What the user set for one series; whatever is absent is automatic. */
export interface SeriesSettings {
  panel?: string
}

export interface View {
  /** Leave out the ramp-up rows at the start of the log. */
  trim: boolean
  /** Channel ids. Their order carries no meaning: series follow the order of the log. */
  selected: string[]
  /** Top to bottom; never empty. */
  panels: Panel[]
  /** By channel id. Read it with `settingsOf`: an id can be any label, `constructor` included. */
  series: Record<string, SeriesSettings>
}

export function createPanel(id: string, height: number): Panel {
  return { id, height, lines: 'auto', fit: 'visible', synced: true }
}

export function defaultView(selected: readonly string[]): View {
  return {
    trim: true,
    selected: [...selected],
    panels: [createPanel('p1', PANEL_HEIGHT.initial)],
    series: {},
  }
}

export function setSelected(view: View, ids: readonly string[], on: boolean): View {
  const selected = new Set(view.selected)
  for (const id of ids) {
    if (on) selected.add(id)
    else selected.delete(id)
  }
  return { ...view, selected: [...selected] }
}

export function selectOnly(view: View, ids: readonly string[]): View {
  return { ...view, selected: [...ids] }
}

const NO_SETTINGS: SeriesSettings = {}

export function settingsOf(view: View, id: string): SeriesSettings {
  return Object.hasOwn(view.series, id) ? view.series[id]! : NO_SETTINGS
}

/** Changes settings of one series; `undefined` makes a setting automatic again. */
export function updateSeries(view: View, id: string, change: Partial<SeriesSettings>): View {
  const next = Object.fromEntries(
    Object.entries({ ...settingsOf(view, id), ...change }).filter(([, v]) => v !== undefined),
  ) as SeriesSettings
  // fromEntries, because assigning to the key `__proto__` would not create a property.
  const series = Object.entries(view.series).filter(([key]) => key !== id)
  if (Object.keys(next).length) series.push([id, next])
  return { ...view, series: Object.fromEntries(series) }
}

export function panelOf(view: View, id: string): string {
  const wanted = settingsOf(view, id).panel
  return view.panels.find((panel) => panel.id === wanted)?.id ?? view.panels[0]!.id
}

export function addPanel(view: View): View {
  const used = new Set(view.panels.map((panel) => panel.id))
  let n = 1
  while (used.has(`p${n}`)) n++
  return { ...view, panels: [...view.panels, createPanel(`p${n}`, PANEL_HEIGHT.added)] }
}

export function removePanel(view: View, panelId: string): View {
  if (view.panels.length < 2) return view
  let next: View = { ...view, panels: view.panels.filter((panel) => panel.id !== panelId) }
  // Forget the assignment: a panel added later can get the same id.
  for (const [id, settings] of Object.entries(view.series)) {
    if (settings.panel === panelId) next = updateSeries(next, id, { panel: undefined })
  }
  return next
}

export function movePanel(view: View, panelId: string, by: -1 | 1): View {
  const from = view.panels.findIndex((panel) => panel.id === panelId)
  const to = from + by
  if (from < 0 || to < 0 || to >= view.panels.length) return view

  // Series without an assignment sit on the first panel: pin them, or they would jump panels.
  let next = view
  for (const id of view.selected) next = updateSeries(next, id, { panel: panelOf(view, id) })

  const panels = [...view.panels]
  panels.splice(to, 0, ...panels.splice(from, 1))
  return { ...next, panels }
}

export function updatePanel(view: View, panelId: string, change: Partial<Panel>): View {
  return {
    ...view,
    panels: view.panels.map((panel) => (panel.id === panelId ? { ...panel, ...change } : panel)),
  }
}

export function assignPanel(view: View, id: string, panelId: string): View {
  return setSelected(updateSeries(view, id, { panel: panelId }), [id], true)
}

/** The same JSON for equal views, whatever the order of keys and of the selection. */
function canonical(view: View): string {
  return JSON.stringify({ ...view, selected: [...view.selected].sort() }, (_key, value: unknown) =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)))
      : value,
  )
}

export function viewsEqual(a: View, b: View): boolean {
  return canonical(a) === canonical(b)
}
