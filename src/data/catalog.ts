// The N55 parameter catalog as typed app data. `catalog.json` is a generated copy of the
// root JSON file: edit that one and run `npm run catalog:sync`.
import catalogJson from './catalog.json'

export const ROLES = [
  'core',
  'standard',
  'flag',
  'counter',
  'raw',
  'redundant',
  'static',
  'broken',
] as const
export type Role = (typeof ROLES)[number]

export const CONFIDENCES = ['high', 'medium', 'low'] as const
export type Confidence = (typeof CONFIDENCES)[number]

export interface CatalogParameter {
  index: number
  label: string
  key: string
  category: string
  description: string
  unit: string
  role: Role
  confidence: Confidence
  presets: string[]
  note: string
}

export interface CatalogMeta {
  /** The car the catalog was written for. */
  vehicle: string
  /** The log the labels were taken from. */
  source: string
  fields: Record<string, string>
}

export interface Catalog {
  meta: CatalogMeta
  parameters: CatalogParameter[]
}

// The cast is safe: catalog.test.ts validates the data against the runtime schema.
export const catalog = catalogJson as Catalog
export const catalogMeta = catalog.meta
export const parameters: readonly CatalogParameter[] = catalog.parameters
