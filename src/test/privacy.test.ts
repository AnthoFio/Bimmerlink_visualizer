import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

// Words that analytics, telemetry and error-reporting packages are named with. A package name
// is split into its words, so that `heap` matches `heap-api` but not `cheap-ruler`.
const TRACKING = new Set([
  'analytics',
  'telemetry',
  'tracking',
  'tracker',
  'gtag',
  'gtm',
  'segment',
  'mixpanel',
  'amplitude',
  'posthog',
  'plausible',
  'matomo',
  'hotjar',
  'fullstory',
  'sentry',
  'datadog',
  'bugsnag',
  'rollbar',
  'logrocket',
  'newrelic',
  'honeybadger',
  'clarity',
  'heap',
  'umami',
  'fathom',
  'insights',
  'vitals',
])

const isTracking = (name: string) =>
  name
    .toLowerCase()
    .split(/[@/._-]+/)
    .some((word) => TRACKING.has(word))

describe('privacy by design', () => {
  it('recognises tracking packages by their words, not by any substring', () => {
    expect(
      ['@sentry/react', 'posthog-js', '@vercel/speed-insights', 'web-vitals', 'heap-api'].every(
        isTracking,
      ),
    ).toBe(true)
    expect(['cheap-ruler', 'segmented-control', 'react-heapmap', 'uplot'].some(isTracking)).toBe(
      false,
    )
  })

  it('ships no analytics, telemetry or error reporting', () => {
    const shipped = Object.keys(manifest.dependencies ?? {})
    const tools = Object.keys(manifest.devDependencies ?? {})
    expect([...shipped, ...tools].filter(isTracking)).toEqual([])
  })

  it('bundles nothing at run time but React and uPlot', () => {
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(['react', 'react-dom', 'uplot'])
  })
})
