import { describe, expect, it } from 'vitest'
import { MockCrmClient } from './mock-client'
import { FIXTURE_OPPS } from './fixtures'

describe('MockCrmClient', () => {
  const client = new MockCrmClient()

  it('hides dead opps', async () => {
    const { rows, total } = await client.listOpps({ limit: 500 })
    expect(rows.every((r) => r.is_dead !== true)).toBe(true)
    expect(total).toBe(FIXTURE_OPPS.filter((o) => o.is_dead !== true).length)
  })

  it('exact interest filter', async () => {
    const { rows } = await client.listOpps({
      interest: ['Interested'],
      interestExact: true,
      limit: 500,
    })
    expect(rows.every((r) => r.deal_interest === 'Interested')).toBe(true)
    expect(rows.some((r) => r.deal_interest === 'Not Interested/Dead')).toBe(false)
  })

  it('scopes emails without cross-deal leak', async () => {
    const emails = await client.listOppEmails('opp-fake-0003')
    expect(emails.every((e) => !e.d365_opportunity_id || e.d365_opportunity_id === 'opp-fake-0003')).toBe(
      true,
    )
  })

  it('has no write methods on the interface instance', () => {
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
    expect(keys.some((k) => /patch|insert|update|delete|write/i.test(k))).toBe(false)
  })
})
