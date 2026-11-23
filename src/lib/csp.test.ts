import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy } from './csp.ts'

const HASH = 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg='

/** The policy as a map from directive to its sources. */
function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split(';').map((part) => {
      const [name = '', ...sources] = part.trim().split(/\s+/)
      return [name, sources]
    }),
  )
}

describe('contentSecurityPolicy', () => {
  const policy = directives(contentSecurityPolicy([HASH]))

  it('allows only the own origin by default', () => {
    expect(policy.get('default-src')).toEqual(["'self'"])
  })

  it('allows the inline scripts by their hash, never by unsafe-inline or eval', () => {
    expect(policy.get('script-src')).toEqual(["'self'", `'sha256-${HASH}'`])
    expect(contentSecurityPolicy([HASH])).not.toMatch(/unsafe-|wasm-|strict-dynamic/)
  })

  it('lets nothing connect, embed, submit or rebase the page', () => {
    expect(policy.get('connect-src')).toEqual(["'none'"])
    expect(policy.get('object-src')).toEqual(["'none'"])
    expect(policy.get('form-action')).toEqual(["'none'"])
    expect(policy.get('base-uri')).toEqual(["'self'"])
  })

  it('allows the images that the PNG export makes in the page', () => {
    expect(policy.get('img-src')).toEqual(["'self'", 'data:', 'blob:'])
  })

  it('names no other origin and leaves out what a meta tag ignores', () => {
    const text = contentSecurityPolicy([HASH])
    expect(text).not.toMatch(/https?:|\*|\/\//)
    expect(policy.has('frame-ancestors')).toBe(false)
    expect(policy.has('report-uri')).toBe(false)
  })

  it('lists every hash and refuses one that is not a base64 sha256 digest', () => {
    expect(
      directives(contentSecurityPolicy([HASH, HASH.toLowerCase()])).get('script-src'),
    ).toHaveLength(3)
    expect(() => contentSecurityPolicy(["abc' 'unsafe-inline"])).toThrow(/sha256/)
    expect(() => contentSecurityPolicy(['abc='])).toThrow(/sha256/)
  })
})
