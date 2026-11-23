import type { Channel } from './channels.ts'
import { unitLabel } from './units.ts'

export interface ChannelFilter {
  query: string
  /** The empty string is any. */
  category: string
  /** As `unitLabel` shows it, so that "unit unknown" can be chosen. */
  unit: string
  role: string
}

export const NO_FILTER: ChannelFilter = { query: '', category: '', unit: '', role: '' }

export function isFiltering({ query, category, unit, role }: ChannelFilter): boolean {
  return Boolean(query.trim() || category || unit || role)
}

/** All criteria must hold. */
export function filterChannels(
  channels: readonly Channel[],
  { query, category, unit, role }: ChannelFilter,
): Channel[] {
  const text = query.trim().toLowerCase()
  return channels.filter(
    (channel) =>
      (!category || channel.category === category) &&
      (!unit || unitLabel(channel.unit) === unit) &&
      (!role || channel.role === role) &&
      (!text || channel.name.toLowerCase().includes(text) || !!channel.key?.includes(text)),
  )
}
