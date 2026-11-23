import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

// Names that analytics, telemetry and error-reporting packages go by.
const TRACKING =
  /analytic|telemetry|tracking|tracker|gtag|google-tag|segment|mixpanel|amplitude|posthog|plausible|matomo|hotjar|fullstory|sentry|datadog|bugsnag|rollbar|logrocket|newrelic|honeybadger|clarity|heap|umami|fathom|vercel\/insights|speed-insights|web-vitals/i

describe('privacy by design', () => {
  it('ships no analytics, telemetry or error reporting', () => {
    const shipped = Object.keys(manifest.dependencies ?? {})
    const tools = Object.keys(manifest.devDependencies ?? {})
    expect([...shipped, ...tools].filter((name) => TRACKING.test(name))).toEqual([])
  })

  it('bundles nothing at run time but React and uPlot', () => {
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(['react', 'react-dom', 'uplot'])
  })
})
