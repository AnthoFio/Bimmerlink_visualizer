// Browser storage that cannot break the app: it can be full, disabled, or hold junk.
// Only view settings go in here, never log data.

type Area = 'local' | 'session'

const areaOf = (area: Area) => (area === 'local' ? window.localStorage : window.sessionStorage)

export function readStored(area: Area, key: string): unknown {
  try {
    const text = areaOf(area).getItem(key)
    return text === null ? undefined : (JSON.parse(text) as unknown)
  } catch {
    return undefined
  }
}

/** Says whether it worked. `undefined` removes the entry. */
export function writeStored(area: Area, key: string, value: unknown): boolean {
  try {
    if (value === undefined) areaOf(area).removeItem(key)
    else areaOf(area).setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
