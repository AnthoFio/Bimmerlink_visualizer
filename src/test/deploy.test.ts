import { parse } from 'yaml'
import { afterEach, describe, expect, it, vi } from 'vitest'

const rawText = (files: Record<string, string>): string => Object.values(files)[0] ?? ''

const workflowRaw = rawText(
  import.meta.glob('../../.github/workflows/deploy.yml', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
)

const readme = rawText(
  import.meta.glob('../../README.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
)

type Step = { uses?: string; run?: string; if?: string; env?: Record<string, string> }
type Job = {
  needs?: string | string[]
  if?: string
  environment?: string | { name?: string }
  permissions?: Record<string, string>
  steps?: Step[]
}
type Workflow = {
  on: { push?: { branches?: string[] }; pull_request?: unknown }
  permissions?: Record<string, string>
  concurrency?: { group?: string }
  jobs: Record<string, Job>
}

const workflow = parse(workflowRaw) as Workflow

describe('deploy workflow', () => {
  it('triggers on push to main and on pull requests', () => {
    expect(workflow.on.push?.branches).toEqual(['main'])
    expect('pull_request' in workflow.on).toBe(true)
  })

  it('uses a pages concurrency group and read-only default permissions', () => {
    expect(workflow.concurrency?.group).toContain('pages')
    expect(workflow.permissions).toEqual({ contents: 'read' })
  })

  it('has a build job that builds with the repository name as base path', () => {
    const build = workflow.jobs.build
    expect(build).toBeDefined()
    const buildStep = build?.steps?.find((s) => s.run === 'npm run build')
    expect(buildStep?.env?.BASE_PATH).toBe('/${{ github.event.repository.name }}/')
    expect(build?.permissions).toBeUndefined()
  })

  it('uploads the pages artifact on push and a preview artifact on pull requests', () => {
    const steps = workflow.jobs.build?.steps ?? []
    const pages = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact@'))
    const preview = steps.find((s) => s.uses?.startsWith('actions/upload-artifact@'))
    expect(pages?.if).toContain("github.event_name == 'push'")
    expect(preview?.if).toContain("github.event_name == 'pull_request'")
    expect(workflowRaw).toContain('preview-pr-${{ github.event.pull_request.number }}')
    expect(workflowRaw).toContain('retention-days: 7')
  })

  it('deploys only on push to main, with Pages permissions on the deploy job only', () => {
    const deploy = workflow.jobs.deploy
    expect(deploy?.needs).toBe('build')
    expect(deploy?.if).toContain("github.event_name == 'push'")
    expect(deploy?.if).toContain('refs/heads/main')
    const env =
      typeof deploy?.environment === 'string' ? deploy.environment : deploy?.environment?.name
    expect(env).toBe('github-pages')
    expect(deploy?.permissions).toEqual({ pages: 'write', 'id-token': 'write' })
    expect(deploy?.steps?.some((s) => s.uses?.startsWith('actions/deploy-pages@'))).toBe(true)
  })

  it('pins every action to a major version tag', () => {
    const uses = [...workflowRaw.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1] ?? '')
    expect(uses.length).toBeGreaterThan(0)
    for (const u of uses) expect(u).toMatch(/@v\d+$/)
  })
})

describe('README', () => {
  it('shows a badge for the deploy workflow', () => {
    expect(readme).toContain('actions/workflows/deploy.yml/badge.svg')
  })
})

describe('vite base path', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const loadBase = async (): Promise<unknown> => {
    vi.resetModules()
    const mod = await import('../../vite.config.ts')
    return (mod.default as { base?: string }).base
  }

  it('defaults to / when BASE_PATH is unset', async () => {
    vi.stubEnv('BASE_PATH', undefined)
    expect(await loadBase()).toBe('/')
  })

  it('falls back to / when BASE_PATH is blank', async () => {
    vi.stubEnv('BASE_PATH', '')
    expect(await loadBase()).toBe('/')
  })

  it('uses BASE_PATH when set', async () => {
    vi.stubEnv('BASE_PATH', '/Bimmerlink_visualizer/')
    expect(await loadBase()).toBe('/Bimmerlink_visualizer/')
  })
})
