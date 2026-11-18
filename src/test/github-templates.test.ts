import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

// Guards the GitHub issue forms and PR template so they cannot silently break:
// GitHub ignores an invalid issue form without any error, the form just disappears.
const rawFiles = import.meta.glob('../../.github/ISSUE_TEMPLATE/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const prTemplate =
  Object.values(
    import.meta.glob('../../.github/pull_request_template.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  )[0] ?? ''

const labelsDoc =
  Object.values(
    import.meta.glob('../../docs/process/labels-and-board.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  )[0] ?? ''

const INPUT_TYPES = ['input', 'textarea', 'dropdown', 'checkboxes', 'markdown'] as const
const BOARD_STATUSES = ['Backlog', 'Ready', 'In progress', 'In review', 'Done']

type FormItem = {
  type: string
  id?: string
  attributes?: { label?: string; value?: string; options?: unknown[]; default?: number }
  validations?: { required?: boolean }
}
type Form = {
  name?: string
  description?: string
  title?: string
  labels?: string[]
  body?: FormItem[]
}

const byFile = (name: string) => name.split('/').pop() ?? name
const forms = Object.entries(rawFiles)
  .filter(([path]) => byFile(path) !== 'config.yml')
  .map(([path, raw]) => ({ file: byFile(path), form: parse(raw) as Form }))

// Type label each form must apply (taxonomy in docs/process/labels-and-board.md).
const TYPE_LABEL: Record<string, string> = {
  'epic.yml': 'epic',
  'feature.yml': 'feature',
  'user-story.yml': 'user-story',
  'bug.yml': 'bug',
}

describe('issue forms', () => {
  it('has one form per issue type: epic, feature, user story and bug', () => {
    expect(forms.map((f) => f.file).sort()).toEqual(Object.keys(TYPE_LABEL).sort())
  })

  it('disables blank issues so every issue starts from a form', () => {
    const configPath = Object.keys(rawFiles).find((p) => byFile(p) === 'config.yml')
    expect(configPath).toBeDefined()
    const config = parse(rawFiles[configPath as string] as string) as {
      blank_issues_enabled?: boolean
    }
    expect(config.blank_issues_enabled).toBe(false)
  })

  describe.each(forms)('$file', ({ file, form }) => {
    it('has the required top-level keys: name, description, body, labels', () => {
      expect(form.name, 'name').toEqual(expect.any(String))
      expect(form.name).not.toBe('')
      expect(form.description, 'description').toEqual(expect.any(String))
      expect(form.description).not.toBe('')
      expect(Array.isArray(form.body), 'body').toBe(true)
      expect(form.body?.length).toBeGreaterThan(0)
      expect(Array.isArray(form.labels), 'labels').toBe(true)
      expect(form.labels?.length).toBeGreaterThan(0)
    })

    it('applies the type label for its issue type', () => {
      expect(form.labels).toContain(TYPE_LABEL[file])
    })

    it('has a title prefix', () => {
      expect(form.title).toMatch(/^\[.+\] $/)
    })

    it('has only valid body items with unique ids and labels', () => {
      const body = form.body ?? []
      const ids: string[] = []
      for (const item of body) {
        expect(INPUT_TYPES, `type ${item.type}`).toContain(item.type)
        if (item.type === 'markdown') {
          expect(item.attributes?.value, 'markdown value').toEqual(expect.any(String))
          continue
        }
        expect(item.id, 'id').toMatch(/^[A-Za-z0-9_-]+$/)
        expect(item.attributes?.label, `label of ${item.id}`).toEqual(expect.any(String))
        ids.push(item.id as string)
      }
      expect(new Set(ids).size).toBe(ids.length)
      expect(
        body.some((i) => i.type !== 'markdown'),
        'at least one input',
      ).toBe(true)
    })

    it('has dropdowns with unique options and a valid default', () => {
      for (const item of (form.body ?? []).filter((i) => i.type === 'dropdown')) {
        const options = item.attributes?.options ?? []
        expect(options.length, `options of ${item.id}`).toBeGreaterThan(0)
        expect(new Set(options).size).toBe(options.length)
        if (item.attributes?.default !== undefined) {
          expect(item.attributes.default).toBeLessThan(options.length)
        }
      }
    })
  })

  it('user story form encodes story, acceptance criteria and definition of done', () => {
    const story = forms.find((f) => f.file === 'user-story.yml')?.form
    const required = (story?.body ?? []).filter((i) => i.validations?.required).map((i) => i.id)
    expect(required).toEqual(
      expect.arrayContaining(['user-story', 'acceptance-criteria', 'definition-of-done']),
    )
  })
})

describe('pull request template', () => {
  it('links the story with Closes #n', () => {
    expect(prTemplate).toMatch(/^Closes #/m)
  })

  it('asks for test evidence, screenshots and the definition of done', () => {
    expect(prTemplate).toMatch(/^## Test evidence/m)
    expect(prTemplate).toMatch(/^## Screenshots/m)
    expect(prTemplate).toMatch(/^## Definition of done/m)
    expect(prTemplate).toMatch(/- \[ \] .*[Ss]creenshots/)
  })
})

describe('labels and board documentation', () => {
  it('documents every label the issue forms apply', () => {
    for (const { form } of forms) {
      for (const label of form.labels ?? []) {
        expect(labelsDoc, `label ${label}`).toContain(`\`${label}\``)
      }
    }
  })

  it('documents the mvp label and the area labels offered by the forms', () => {
    expect(labelsDoc).toContain('`mvp`')
    const story = forms.find((f) => f.file === 'user-story.yml')?.form
    const area = story?.body?.find((i) => i.id === 'area')
    for (const option of (area?.attributes?.options ?? []) as string[]) {
      expect(labelsDoc, `area ${option}`).toContain(`\`${option}\``)
    }
  })

  it('documents the board status flow in order', () => {
    const positions = BOARD_STATUSES.map((s) => labelsDoc.indexOf(s))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(labelsDoc).toContain('Backlog > Ready > In progress > In review > Done')
  })
})
