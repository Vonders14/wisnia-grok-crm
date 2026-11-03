import { describe, expect, it } from 'vitest'
import { domain, email, website } from './data-contract'

describe('website normalization', () => {
  it('always returns http://www.{host}', () => {
    expect(website('https://Fake-Investor-1.example.test/path')).toBe(
      'http://www.fake-investor-1.example.test',
    )
    expect(website('www.foo.com')).toBe('http://www.foo.com')
    expect(website(null)).toBeNull()
  })
})

describe('domain + email', () => {
  it('extracts domain from email and url', () => {
    expect(domain('Pat <pat@Acme.Co.uk>')).toBe('acme.co.uk')
    expect(domain('https://www.acme.co.uk/x')).toBe('acme.co.uk')
    expect(email('  Pat@Example.TEST ')).toBe('pat@example.test')
  })
})
