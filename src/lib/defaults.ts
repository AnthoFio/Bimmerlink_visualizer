import type { Role } from '../data/catalog.ts'
import type { Channel } from './channels.ts'

const MAX_PRESELECTED = 6
const HIDDEN_ROLES: ReadonlySet<Role> = new Set<Role>(['redundant', 'static', 'broken'])

export function isHiddenByDefault(channel: Channel): boolean {
  return channel.role !== undefined && HIDDEN_ROLES.has(channel.role)
}

/**
 * Up to six core channels, taken one category at a time in log order: the six misfire counters
 * that open many logs would otherwise be the whole first chart.
 */
export function defaultSelection(channels: readonly Channel[]): string[] {
  const byCategory = new Map<string, string[]>()
  for (const { role, category, id } of channels) {
    if (role === 'core') byCategory.set(category, [...(byCategory.get(category) ?? []), id])
  }
  if (byCategory.size === 0) return channels.slice(0, MAX_PRESELECTED).map((channel) => channel.id)

  const groups = [...byCategory.values()]
  const longest = Math.max(...groups.map((group) => group.length))
  const picked: string[] = []
  for (let round = 0; round < longest; round++) {
    for (const group of groups) {
      if (round < group.length) picked.push(group[round]!)
    }
  }
  return picked.slice(0, MAX_PRESELECTED)
}
