// The view: everything the user chose about a log. Plain data and pure updates, so that it can
// be compared, saved and exported. The time window and the cursor are not part of it.

export interface View {
  /** Leave out the ramp-up rows at the start of the log. */
  trim: boolean
  /** Channel ids. Their order carries no meaning: series follow the order of the log. */
  selected: string[]
}

export function defaultView(selected: readonly string[]): View {
  return { trim: true, selected: [...selected] }
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
