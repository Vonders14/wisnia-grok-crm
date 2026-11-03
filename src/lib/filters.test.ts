import { describe, expect, it } from 'vitest'
import { matchEnumFilter, parsePasteList } from './filters'

describe('matchEnumFilter exact Interested', () => {
  it('exact match avoids Not Interested/Dead', () => {
    expect(
      matchEnumFilter('Not Interested/Dead', {
        key: 'deal_interest',
        values: ['Interested'],
        exact: true,
      }),
    ).toBe(false)
    expect(
      matchEnumFilter('Interested', {
        key: 'deal_interest',
        values: ['Interested'],
        exact: true,
      }),
    ).toBe(true)
  })
})

describe('parsePasteList', () => {
  it('drops consumer domains', () => {
    const p = parsePasteList('gmail.com, Fake-Investor-1.example.test, a@yahoo.com, uuid-not')
    expect(p.domains).toContain('fake-investor-1.example.test')
    expect(p.domains).not.toContain('gmail.com')
    expect(p.domains).not.toContain('yahoo.com')
  })
})
