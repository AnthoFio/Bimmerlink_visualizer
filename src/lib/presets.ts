import { parameters } from '../data/catalog.ts'
import type { CatalogParameter } from '../data/catalog.ts'
import type { Channel } from './channels.ts'

export interface Preset {
  name: string
  /** Catalog keys. */
  keys: string[]
}

const LOG_PRESETS = ['1', '1b', '2', '3', '4', '5', '6']

const presetOf = (name: string, keep: (parameter: CatalogParameter) => boolean): Preset => ({
  name,
  keys: parameters.filter(keep).map((parameter) => parameter.key),
})

export const PRESETS: readonly Preset[] = [
  ...LOG_PRESETS.map((id) =>
    presetOf(`Log preset ${id}`, (parameter) => parameter.presets.includes(id)),
  ),
  presetOf('Core only', (parameter) => parameter.role === 'core'),
  presetOf('Knock', (parameter) => parameter.category === 'Ignition / knock'),
  presetOf('Misfire', (parameter) => parameter.category === 'Misfire'),
  presetOf('Fuel & lambda', (parameter) => parameter.category === 'Fuel / lambda'),
]

export interface PresetResult {
  /** The channels of this log that the preset selects. */
  ids: string[]
  found: number
  missing: number
}

export function applyPreset(preset: Preset, channels: readonly Channel[]): PresetResult {
  const keys = new Set(preset.keys)
  const ids = channels
    .filter((channel) => channel.key !== undefined && keys.has(channel.key))
    .map((channel) => channel.id)
  return { ids, found: ids.length, missing: preset.keys.length - ids.length }
}
