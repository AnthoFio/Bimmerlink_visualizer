// Runtime schema of the parameter catalog. Test-only, so the app ships no validator.
import { CONFIDENCES, ROLES } from '../data/catalog.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown) => typeof value === 'string'
const filled = (value: unknown) => typeof value === 'string' && value !== ''

const PARAMETER: Record<string, (value: unknown) => boolean> = {
  index: (value) => Number.isInteger(value) && Number(value) > 0,
  label: filled,
  key: (value) => typeof value === 'string' && /^[a-z0-9_]+$/.test(value),
  category: filled,
  description: text,
  unit: filled,
  role: (value) => ROLES.some((role) => role === value),
  confidence: (value) => CONFIDENCES.some((confidence) => confidence === value),
  presets: (value) =>
    Array.isArray(value) && value.every((preset) => /^([1-6]|1b)$/.test(String(preset))),
  note: text,
}

/** The paths that break the schema; empty when the catalog is valid. */
export function validateCatalog(value: unknown): string[] {
  if (!isRecord(value)) return ['catalog']
  const { meta, parameters } = value
  const errors: string[] = []
  if (!isRecord(meta) || !filled(meta.vehicle) || !filled(meta.source) || !isRecord(meta.fields)) {
    errors.push('meta')
  }
  if (!Array.isArray(parameters)) return [...errors, 'parameters']
  for (const [i, parameter] of (parameters as unknown[]).entries()) {
    for (const [field, isValid] of Object.entries(PARAMETER)) {
      if (!isRecord(parameter) || !isValid(parameter[field])) {
        errors.push(`parameters[${i}].${field}`)
      }
    }
  }
  return errors
}
