import { describe, expect, it } from 'vitest'

// ADR 0001 records the charting-library decision (ticket #4). These tests keep the record honest:
// it must exist, have the agreed structure and name exactly one of the compared candidates as the choice.
const ADR_PATH = '../../docs/adr/0001-charting-library.md'
const files = import.meta.glob('../../docs/adr/0001-charting-library.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const adr = files[ADR_PATH]

const CANDIDATES = ['uPlot', 'Apache ECharts', 'Plotly.js', 'Recharts'] as const

/** Returns the body of a `## <heading>` section (heading matched by prefix, case-insensitive). */
function section(markdown: string, heading: string): string | undefined {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((l) => l.toLowerCase().startsWith(`## ${heading.toLowerCase()}`))
  if (start === -1) return undefined
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => /^## /.test(l))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n')
}

describe('ADR 0001: charting library', () => {
  it('exists at docs/adr/0001-charting-library.md and is not empty', () => {
    expect(adr, `${ADR_PATH} is missing`).toBeTypeOf('string')
    expect(adr!.trim().length).toBeGreaterThan(500)
  })

  it('has a title and an accepted status', () => {
    expect(adr).toMatch(/^# .*ADR 0001/m)
    expect(adr).toMatch(/^Status:\s*(Accepted|Proposed)/m)
  })

  it.each([
    'Context',
    'Options considered',
    'Evidence',
    'Decision',
    'Consequences',
    'How this unblocks',
    'Risks and fallback',
  ])('has a non-empty "%s" section', (heading) => {
    const body = section(adr ?? '', heading)
    expect(body, `missing "## ${heading}" section`).toBeDefined()
    expect(body!.trim().length).toBeGreaterThan(40)
  })

  it('compares all four candidates in the options section and the evidence table', () => {
    const options = section(adr ?? '', 'Options considered') ?? ''
    const evidence = section(adr ?? '', 'Evidence') ?? ''
    for (const lib of CANDIDATES) {
      expect(options, `options section does not mention ${lib}`).toContain(lib)
      expect(evidence, `evidence section does not mention ${lib}`).toContain(lib)
    }
    // The evidence is a markdown table that covers the criteria named in the ticket.
    expect(evidence).toMatch(/^\|.*\|$/m)
    for (const criterion of [
      /fps|frame/i,
      /gzip/i,
      /multi.*y|y.*axes/i,
      /zoom/i,
      /React 19/i,
      /export/i,
      /licen[cs]e/i,
    ]) {
      expect(evidence).toMatch(criterion)
    }
  })

  it('states a decision that names exactly one candidate library', () => {
    const decision = section(adr ?? '', 'Decision') ?? ''
    const line = decision.split(/\r?\n/).find((l) => /^\*\*Chosen library:\*\*/i.test(l.trim()))
    expect(line, 'Decision section needs a "**Chosen library:** <name>" line').toBeDefined()
    const named = CANDIDATES.filter((lib) => line!.toLowerCase().includes(lib.toLowerCase()))
    expect(named).toHaveLength(1)
  })

  it('records a fallback option and links the decision to the unblocked stories', () => {
    expect(section(adr ?? '', 'Risks and fallback')).toMatch(/fallback/i)
    const unblocks = section(adr ?? '', 'How this unblocks') ?? ''
    for (const issue of [
      '#24',
      '#25',
      '#26',
      '#27',
      '#28',
      '#29',
      '#36',
      '#42',
      '#43',
      '#44',
      '#45',
      '#46',
      '#50',
    ]) {
      expect(unblocks, `no mention of ${issue}`).toContain(issue)
    }
  })

  it('does not overstate the uPlot result: reports its observed fps range and the missing run 1', () => {
    const evidence = section(adr ?? '', 'Evidence') ?? ''
    expect(evidence).toMatch(/33 to 60 fps/)
    expect(evidence).toMatch(/decimate.run1/)
    expect(evidence).toMatch(/uPlot[^.]*variance|variance[^.]*uPlot/i)
  })

  it('flags that the heap, hover and update numbers are not like-for-like', () => {
    const evidence = section(adr ?? '', 'Evidence') ?? ''
    expect(evidence).toMatch(/like-for-like/i)
    expect(evidence).toMatch(/Float64Array/)
    expect(evidence).toMatch(/minimap/i)
    const decision = section(adr ?? '', 'Decision') ?? ''
    expect(decision).not.toMatch(/5 to 9 times/)
  })

  it('lists touch / pinch (#43) as not prototyped in the risks', () => {
    const risks = section(adr ?? '', 'Risks and fallback') ?? ''
    expect(risks).toMatch(/touch/i)
    expect(risks).toMatch(/pinch/i)
    expect(risks).toMatch(/not prototyped|unprototyped/i)
  })

  it('keeps the raw measurements (machine, browser, dataset) in the ADR', () => {
    const evidence = section(adr ?? '', 'Evidence') ?? ''
    expect(evidence).toMatch(/i7-1250U|CPU/)
    expect(evidence).toMatch(/Chromium/)
    expect(evidence).toMatch(/51[,.\s]?019|51k/)
  })
})
