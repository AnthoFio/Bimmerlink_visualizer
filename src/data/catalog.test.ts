/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { catalog, catalogMeta, parameters } from './catalog.ts'
import { validateCatalog } from '../test/catalogSchema.ts'

const root = (name: string) => readFileSync(`${process.cwd()}/${name}`, 'utf8')
const source = JSON.parse(root('bimmerlink_n55_parameter_catalog.json')) as unknown

describe('bundled catalog', () => {
  it('passes the runtime schema', () => {
    expect(validateCatalog(catalog)).toEqual([])
    expect(parameters).toHaveLength(210)
  })

  it('has a schema that rejects broken data', () => {
    const [first] = parameters
    const broken = { meta: catalogMeta, parameters: [{ ...first, role: 'primary', presets: '1' }] }

    expect(validateCatalog(broken)).toEqual(['parameters[0].role', 'parameters[0].presets'])
    expect(validateCatalog(null)).toEqual(['catalog'])
  })

  it('has unique keys', () => {
    expect(new Set(parameters.map((parameter) => parameter.key)).size).toBe(parameters.length)
  })

  it('keeps the provenance note', () => {
    expect(catalogMeta.vehicle).toContain('N55')
    expect(catalogMeta.source).toContain('2026-08-09_15-12-47.csv')
  })

  it('is in sync with the root JSON (else run npm run catalog:sync)', () => {
    expect(catalog).toEqual(source)
  })

  it('is in sync with the root CSV', () => {
    const rows = root('bimmerlink_n55_parameter_catalog.csv').trim().split(/\r?\n/).slice(1)

    expect(rows).toHaveLength(parameters.length)
    for (const [i, parameter] of parameters.entries()) {
      expect(rows[i], parameter.key).toContain(parameter.key)
    }
  })

  it('documents the sync step as an npm script', () => {
    expect(JSON.parse(root('package.json')).scripts['catalog:sync']).toBe(
      'node scripts/sync-catalog.mjs',
    )
  })
})
