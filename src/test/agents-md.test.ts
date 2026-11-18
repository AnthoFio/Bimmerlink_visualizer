/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// AGENTS.md is the single source of truth for agents. This test keeps it honest:
// every command and path it documents must really exist, unless the line is marked
// "(planned, story #n)" (see the "Documentation conventions" section of AGENTS.md).

// Vitest runs from the repository root (where vite.config.ts lives).
const root = `${process.cwd()}/`
const read = (relativePath: string) => readFileSync(`${root}${relativePath}`, 'utf8')

const agents = read('AGENTS.md')
const claude = read('CLAUDE.md')
const pkg = JSON.parse(read('package.json')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}
const catalog = JSON.parse(read('bimmerlink_n55_parameter_catalog.json')) as {
  parameters: { category: string; role: string }[]
}

const isPlanned = (line: string) => /\(planned, story #\d+\)/.test(line)
const documentedLines = agents.split('\n').filter((line) => !isPlanned(line))
const plannedLines = agents.split('\n').filter(isPlanned)

// Inline code that looks like a concrete path: contains a "/" or a known file extension,
// and no placeholder, glob or space characters.
const pathLike = /^[\w.@-][\w./@-]*$/
const knownExtension = /\.(md|json|csv|ts|tsx|js|mjs|yml|yaml|html|css|svg|ps1)$/
const pathsIn = (lines: string[]) =>
  lines
    .flatMap((line) => [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]!))
    .filter((token) => pathLike.test(token))
    .filter((token) => token.includes('/') || knownExtension.test(token))
    .filter((token) => !token.startsWith('@')) // import syntax such as @AGENTS.md
const scriptsIn = (lines: string[]) =>
  lines.flatMap((line) => [...line.matchAll(/npm run ([a-z][\w:-]*)/g)].map((match) => match[1]!))

describe('AGENTS.md commands', () => {
  it('only mentions npm scripts that exist in package.json', () => {
    const mentioned = scriptsIn(documentedLines)

    expect(mentioned.length).toBeGreaterThan(0)
    for (const script of new Set(mentioned)) {
      expect(pkg.scripts, `npm run ${script}`).toHaveProperty(script)
    }
  })

  it('documents install, dev, test, lint, typecheck, build and check', () => {
    expect(agents).toContain('npm ci')
    for (const script of ['dev', 'test', 'lint', 'typecheck', 'build', 'check']) {
      expect(agents, `npm run ${script}`).toContain(`npm run ${script}`)
    }
  })

  it('documents the e2e command (planned items are checked by the guard below)', () => {
    expect(agents).toContain('npm run e2e')
  })
})

describe('AGENTS.md planned markers', () => {
  // A "(planned, story #n)" line promises something that does not exist yet. Once the story
  // lands, the marker is stale: the path or script is real and the line must become a normal one.
  it('writes every planned marker as "(planned, story #<number>)"', () => {
    const malformed = agents
      .split('\n')
      .filter((line) => /\(planned\b/i.test(line) && !isPlanned(line) && !line.includes('#n)'))

    expect(malformed).toEqual([])
  })

  it('only marks as planned what does not exist yet', () => {
    for (const script of new Set(scriptsIn(plannedLines))) {
      expect(
        pkg.scripts,
        `npm run ${script} exists: remove its "(planned, ...)" marker`,
      ).not.toHaveProperty(script)
    }
    for (const plannedPath of new Set(pathsIn(plannedLines))) {
      expect(
        existsSync(`${root}${plannedPath}`),
        `${plannedPath} exists: remove the "(planned, ...)" marker and describe it as real`,
      ).toBe(false)
    }
  })
})

describe('AGENTS.md paths', () => {
  const documentedPaths = pathsIn(documentedLines)

  it('documents a non-trivial list of paths', () => {
    expect(documentedPaths).toEqual(
      expect.arrayContaining([
        'package.json',
        'src/lib/',
        'src/features/',
        'Example/',
        '.claude/skills/',
        '.agents/skills/',
        '.github/workflows/ci.yml',
        'docs/ci.md',
        'docs/process/labels-and-board.md',
        'tests/fixtures/',
        'src/test/fixtures.ts',
        'scripts/set-project-status.ps1',
      ]),
    )
  })

  it.each([...new Set(documentedPaths)])('exists on disk: %s', (documentedPath) => {
    expect(existsSync(`${root}${documentedPath}`), documentedPath).toBe(true)
  })
})

describe('AGENTS.md skills', () => {
  const skillDirs = (dir: string) =>
    readdirSync(`${root}${dir}`, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

  it('documents every skill installed in .claude/skills and .agents/skills', () => {
    const installed = [...new Set([...skillDirs('.claude/skills'), ...skillDirs('.agents/skills')])]

    expect(installed.length).toBeGreaterThan(0)
    for (const skill of installed) {
      expect(agents, `skill ${skill}`).toContain(`\`${skill}\``)
    }
  })
})

describe('AGENTS.md facts', () => {
  it('quotes the real catalog numbers', () => {
    const categories = new Set(catalog.parameters.map((parameter) => parameter.category))
    const roles = new Set(catalog.parameters.map((parameter) => parameter.role))

    expect(agents).toContain(`${catalog.parameters.length} parameters`)
    expect(agents).toContain(`${categories.size} categories`)
    for (const role of roles) {
      expect(agents, `role ${role}`).toContain(role)
    }
  })

  it('docs do not claim that every channel starts at 0 (some Example logs start non-zero)', () => {
    const exampleDir = `${root}Example`
    const initialValues = new Set<string>()
    for (const file of readdirSync(exampleDir).filter((name) => name.endsWith('.csv'))) {
      const firstRow = readFileSync(`${exampleDir}/${file}`, 'utf8').split('\n')[1] ?? ''
      for (const cell of firstRow.split(',').slice(1)) {
        if (Number(cell) !== 0) initialValues.add(cell)
      }
    }

    expect(initialValues.size, 'the Example logs have non-zero first samples').toBeGreaterThan(0)
    // Same facts must hold in every doc that talks about the ramp-up, not just AGENTS.md.
    for (const doc of ['AGENTS.md', 'tests/fixtures/README.md']) {
      const text = read(doc)
      expect(text, `${doc} must not say every channel starts at 0`).not.toMatch(
        /every channel starts at/i,
      )
      expect(text, `${doc} must not say channels start at 0 without "most"`).not.toMatch(
        /(?<!most )channels start at `?0/i,
      )
      for (const value of initialValues) {
        expect(text, `${doc}: non-zero initial value ${value}`).toContain(value)
      }
    }
  })

  it('only claims skills are excluded from ESLint if eslint.config.js ignores them', () => {
    if (/excluded from ESLint/i.test(agents)) {
      const eslintConfig = read('eslint.config.js')
      expect(eslintConfig).toContain("'.claude'")
      expect(eslintConfig).toContain("'.agents'")
    }
  })

  it('documents the board status helper that exists in scripts/', () => {
    const helper = read('scripts/set-project-status.ps1')

    expect(agents).toContain('scripts/set-project-status.ps1')
    expect(agents).toContain('-Issue')
    expect(agents).toContain('-Status')
    expect(agents).toMatch(/\bproject\b[^\n]*scope/i)
    expect(helper).toMatch(/\.SYNOPSIS/)
    expect(helper).toMatch(/\.EXAMPLE/)
  })

  it('explains the TypeScript 6 / 7 split with the real aliases', () => {
    expect(pkg.devDependencies.typescript).toContain('typescript6')
    expect(pkg.devDependencies.typescript7).toContain('typescript@')
    expect(agents).toContain('typescript7')
    expect(agents).toMatch(/npm run typecheck[^\n]*authoritative/)
  })
})

describe('CLAUDE.md', () => {
  it('imports AGENTS.md instead of duplicating it', () => {
    expect(claude).toMatch(/^@AGENTS\.md$/m)
    expect(claude.split('\n').length).toBeLessThan(20)
  })
})
