import { useMemo } from 'react'
import type { Channel } from '../../lib/channels.ts'
import { isFiltering, NO_FILTER } from '../../lib/filter.ts'
import type { ChannelFilter } from '../../lib/filter.ts'
import { unitLabel } from '../../lib/units.ts'

interface Props {
  channels: readonly Channel[]
  filter: ChannelFilter
  matches: number
  onChange: (filter: ChannelFilter) => void
}

const distinct = (values: (string | undefined)[]) =>
  [...new Set(values.filter((value): value is string => value !== undefined))].sort()

export function FilterBar({ channels, filter, matches, onChange }: Props) {
  // Only what this log has: an option without a match helps nobody.
  const menus = useMemo(
    () =>
      [
        ['category', 'Category', distinct(channels.map((channel) => channel.category))],
        ['unit', 'Unit', distinct(channels.map((channel) => unitLabel(channel.unit)))],
        ['role', 'Role', distinct(channels.map((channel) => channel.role))],
      ] as const,
    [channels],
  )

  return (
    <div className="filters">
      <input
        type="search"
        aria-label="Search parameters"
        placeholder="Search name or key"
        value={filter.query}
        onChange={(event) => onChange({ ...filter, query: event.target.value })}
      />
      <div className="filter-menus">
        {menus.map(([field, label, options]) => (
          <select
            key={field}
            aria-label={label}
            value={filter[field]}
            onChange={(event) => onChange({ ...filter, [field]: event.target.value })}
          >
            <option value="">{label}: any</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
      </div>
      {isFiltering(filter) && (
        <div className="filter-state">
          <span role="status">
            Showing {matches} of {channels.length}
          </span>
          <button type="button" onClick={() => onChange(NO_FILTER)}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
