/// <reference types="node" />
// Node-only helpers for tests: load byte-exact fixtures (tests/fixtures) and
// example logs (Example/) by file name. Not part of the browser bundle.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(import.meta.dirname, '..', '..')

export const fixturesDir = join(repoRoot, 'tests', 'fixtures')
export const exampleDir = join(repoRoot, 'Example')

/** Raw bytes of `tests/fixtures/<name>`. */
export function loadFixtureBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(fixturesDir, name)))
}

/** `tests/fixtures/<name>` decoded as UTF-8, with any BOM and CR/LF left untouched. */
export function loadFixtureText(name: string): string {
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(loadFixtureBytes(name))
}

/** Raw bytes of the full example log `Example/<name>`. */
export function loadExampleBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(exampleDir, name)))
}
