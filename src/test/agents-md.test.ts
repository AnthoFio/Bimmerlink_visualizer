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

const isPlanned = (line: string) => /\(planned\b/i.test(line)
const documentedLines = agents.split('\n').filter((line) => !isPlanned(line))

describe('AGENTS.md commands', () => {
  it('only mentions npm scripts that exist in package.json', () => {
    const mentioned = documentedLines.flatMap((line) =>
      [...line.matchAll(/npm run ([a-z][\w:-]*)/g)].map((match) => match[1]!),
    )

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

  it('mentions e2e only as planned', () => {
    expect(agents).toMatch(/e2e[^\n]*\(planned, story #10\)/i)
  })
})

describe('AGENTS.md paths', () => {
  // Inline code that looks like a concrete path: contains a "/" or a known file extension,
  // and no placeholder, glob or space characters.
  const pathLike = /^[\w.@-][\w./@-]*$/
  const knownExtension = /\.(md|json|csv|ts|tsx|js|mjs|yml|yaml|html|css|svg|ps1)$/

  const documentedPaths = documentedLines
    .flatMap((line) => [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1]!))
    .filter((token) => pathLike.test(token))
    .filter((token) => token.includes('/') || knownExtension.test(token))
    .filter((token) => !token.startsWith('@')) // import syntax such as @AGENTS.md

  it('documents a non-trivial list of paths', () => {
    expect(documentedPaths).toEqual(
      expect.arrayContaining([
        'package.json',
        'src/lib/',
        'src/features/',
        'Example/',
        '.claude/skills/',
        '.agents/skills/',
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
