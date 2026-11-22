import { OTHER_CATEGORY } from './channels.ts'
import type { Channel } from './channels.ts'

/** The channels by category: alphabetical, with Other last, log order within a category. */
export function groupByCategory(
  channels: readonly Channel[],
): [category: string, members: Channel[]][] {
  const groups = new Map<string, Channel[]>()
  for (const channel of channels) {
    const members = groups.get(channel.category)
    if (members) members.push(channel)
    else groups.set(channel.category, [channel])
  }
  return [...groups].sort(([a], [b]) => {
    if (a === OTHER_CATEGORY) return 1
    if (b === OTHER_CATEGORY) return -1
    return a < b ? -1 : 1
  })
}
