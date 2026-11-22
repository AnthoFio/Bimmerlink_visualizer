/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(`${process.cwd()}/${path}`, 'utf8')

interface Step {
  run?: string
  uses?: string
  if?: string
  with?: Record<string, unknown>
}

const pkg = JSON.parse(read('package.json')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}
const steps = (parse(read('.github/workflows/ci.yml')) as { jobs: { ci: { steps: Step[] } } }).jobs
  .ci.steps
const indexOfRun = (text: string) => steps.findIndex((step) => step.run?.includes(text))

describe('e2e setup', () => {
  it('pins Playwright exactly and has an e2e script', () => {
    expect(pkg.devDependencies['@playwright/test']).toMatch(/^\d+\.\d+\.\d+$/)
    expect(pkg.scripts.e2e).toMatch(/^playwright test/)
  })

  it('installs the browser and runs the e2e tests headless in CI, after the build', () => {
    expect(indexOfRun('playwright install --with-deps')).toBeGreaterThan(-1)
    expect(indexOfRun('npm run e2e')).toBeGreaterThan(indexOfRun('playwright install --with-deps'))
    expect(indexOfRun('npm run e2e')).toBeGreaterThan(indexOfRun('npm run build'))
    expect(read('playwright.config.ts')).not.toMatch(/headless:\s*false/)
  })

  it('uploads the screenshots when a run fails', () => {
    const upload = steps.find((step) => step.uses?.startsWith('actions/upload-artifact@'))

    expect(upload?.if).toContain('failure()')
    expect(String(upload?.with?.path)).toContain('test-results')
    expect(read('playwright.config.ts')).toContain("screenshot: 'only-on-failure'")
  })
})
