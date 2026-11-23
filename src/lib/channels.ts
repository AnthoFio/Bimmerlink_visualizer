// Links the columns of a log to the parameter catalog, by label and never by position.
import type { CatalogParameter, Confidence, Role } from '../data/catalog.ts'

export const OTHER_CATEGORY = 'Other'

export interface Channel {
  /** Stable across logs and label casing; unique within a log. */
  id: string
  /** The header label, numbered when it occurs more than once. */
  name: string
  /** The header label as it is in the file. */
  label: string
  /** Position in `LogDataset.columns`. */
  column: number
  matched: boolean
  category: string
  presets: readonly string[]
  key: string | undefined
  unit: string | undefined
  description: string | undefined
  role: Role | undefined
  confidence: Confidence | undefined
}

/** Lower case, with runs of punctuation and whitespace as one space. */
export function normaliseLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const compact = (label: string) => label.toLowerCase().replace(/\s+/g, ' ').trim()

function indexBy(
  parameters: readonly CatalogParameter[],
  keyOf: (label: string) => string,
): Map<string, CatalogParameter[]> {
  const index = new Map<string, CatalogParameter[]>()
  for (const parameter of parameters) {
    const key = keyOf(parameter.label)
    index.set(key, [...(index.get(key) ?? []), parameter])
  }
  return index
}

export function describeChannels(
  labels: readonly string[],
  parameters: readonly CatalogParameter[],
): Channel[] {
  const exact = indexBy(parameters, compact)
  const loose = indexBy(parameters, normaliseLabel)
  const usedParameters = new Set<CatalogParameter>()
  const usedIds = new Set<string>()

  return labels.map((label, column) => {
    // The exact label wins, because two catalog labels differ only in punctuation.
    const candidates = [
      ...(exact.get(compact(label)) ?? []),
      ...(loose.get(normaliseLabel(label)) ?? []),
    ]
    const match = candidates.find((parameter) => !usedParameters.has(parameter)) ?? candidates[0]
    if (match) usedParameters.add(match)

    const base = label || 'Unnamed column'
    let name = base
    let copy = 1
    while (usedIds.has(compact(name))) name = `${base} (${++copy})`
    const id = compact(name)
    usedIds.add(id)

    return {
      id,
      name,
      label,
      column,
      matched: match !== undefined,
      category: match?.category ?? OTHER_CATEGORY,
      presets: match?.presets ?? [],
      key: match?.key,
      unit: match?.unit,
      description: match?.description,
      role: match?.role,
      confidence: match?.confidence,
    }
  })
}
