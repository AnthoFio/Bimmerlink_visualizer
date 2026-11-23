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
interface Job {
  name?: string
  'continue-on-error'?: boolean
  needs?: string | string[]
  steps: Step[]
}

const jobs = (parse(read('.github/workflows/ci.yml')) as { jobs: Record<string, Job> }).jobs
const steps = jobs.ci!.steps
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

describe('perf job', () => {
  const perf = jobs.perf
  const perfSteps = perf?.steps ?? []
  const indexOfPerfRun = (text: string) => perfSteps.findIndex((step) => step.run?.includes(text))

  it('runs the perf test in its own job, after a build and the browser install', () => {
    expect(pkg.scripts['e2e:perf']).toMatch(/^playwright test --project=perf/)
    expect(indexOfPerfRun('npm ci')).toBeGreaterThan(-1)
    expect(indexOfPerfRun('npm run build')).toBeGreaterThan(indexOfPerfRun('npm ci'))
    expect(indexOfPerfRun('playwright install --with-deps')).toBeGreaterThan(-1)
    expect(indexOfPerfRun('npm run e2e:perf')).toBeGreaterThan(indexOfPerfRun('npm run build'))
    expect(indexOfPerfRun('npm run e2e:perf')).toBeGreaterThan(
      indexOfPerfRun('playwright install --with-deps'),
    )
  })

  it('is non-blocking and leaves the required check CI alone', () => {
    expect(perf?.['continue-on-error']).toBe(true)
    expect(perf?.name).not.toBe('CI')
    expect(jobs.ci!.name).toBe('CI')
    expect(jobs.ci!['continue-on-error']).toBeUndefined()
    expect(steps.some((step) => step.run?.includes('e2e:perf'))).toBe(false)
  })

  it('uploads the measured numbers whatever the result', () => {
    const upload = perfSteps.find((step) => step.uses?.startsWith('actions/upload-artifact@'))

    expect(upload?.if).toContain('always()')
    expect(String(upload?.with?.path)).toContain('test-results')
    expect(indexOfPerfRun('npm run e2e:perf')).toBeLessThan(perfSteps.indexOf(upload!))
  })
})
