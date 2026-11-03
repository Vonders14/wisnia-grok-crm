import { describe, expect, it } from 'vitest'
import {
  canBumpToAddedToSequence,
  exactInterestMatch,
  heatFromAi,
  isLiveOpp,
  mapOppRow,
  resolveHealth,
  scopeOppEmails,
  wisaiScore10,
} from './opp-rules'

describe('heatFromAi', () => {
  it('maps Hot/Warm/Engaged/else', () => {
    expect(heatFromAi('Hot')).toBe('hot')
    expect(heatFromAi('Warm')).toBe('warm')
    expect(heatFromAi('Engaged')).toBe('warm')
    expect(heatFromAi('Touched')).toBe('cold')
    expect(heatFromAi(null)).toBe('cold')
  })
})

describe('wisaiScore10', () => {
  it('rounds score/10 and clamps 1–10', () => {
    expect(wisaiScore10(null)).toBeNull()
    expect(wisaiScore10(55)).toBe(6)
    expect(wisaiScore10(5)).toBe(1)
    expect(wisaiScore10(200)).toBe(10)
  })
})

describe('exactInterestMatch', () => {
  it('does not let Interested match Not Interested/Dead', () => {
    expect(exactInterestMatch('Interested', 'Interested')).toBe(true)
    expect(exactInterestMatch('Not Interested/Dead', 'Interested')).toBe(false)
  })
})

describe('isLiveOpp', () => {
  it('hides is_dead true', () => {
    expect(isLiveOpp({ d365_opportunity_id: '1', is_dead: true })).toBe(false)
    expect(isLiveOpp({ d365_opportunity_id: '1', is_dead: false })).toBe(true)
    expect(isLiveOpp({ d365_opportunity_id: '1' })).toBe(true)
  })
})

describe('resolveHealth', () => {
  it('prefers DB column and derives Dead', () => {
    expect(
      resolveHealth({
        d365_opportunity_id: '1',
        opportunity_health: 'Waiting on Us',
      }),
    ).toBe('Waiting on Us')
    expect(
      resolveHealth({
        d365_opportunity_id: '1',
        deal_interest: 'Not Interested/Dead',
      }),
    ).toBe('Dead')
  })
})

describe('scopeOppEmails', () => {
  it('uses tagged emails first', () => {
    const tagged = [{ id: 'a', d365_opportunity_id: 'opp1' }]
    expect(
      scopeOppEmails({
        oppId: 'opp1',
        contactEmail: 'a@example.test',
        tagged,
        contactEmails: [{ id: 'b' }],
        liveOppCountForContact: 1,
      }),
    ).toEqual(tagged)
  })

  it('falls back only for single-opp contacts and drops other-opp tags', () => {
    const out = scopeOppEmails({
      oppId: 'opp1',
      contactEmail: 'a@example.test',
      tagged: [],
      contactEmails: [
        { id: 'ok', d365_opportunity_id: null },
        { id: 'leak', d365_opportunity_id: 'opp2' },
      ],
      liveOppCountForContact: 1,
    })
    expect(out.map((e) => e.id)).toEqual(['ok'])
  })

  it('skips fallback when contact has multiple live opps', () => {
    expect(
      scopeOppEmails({
        oppId: 'opp1',
        contactEmail: 'a@example.test',
        tagged: [],
        contactEmails: [{ id: 'x' }],
        liveOppCountForContact: 2,
      }),
    ).toEqual([])
  })
})

describe('canBumpToAddedToSequence', () => {
  it('only blank or New', () => {
    expect(canBumpToAddedToSequence(null)).toBe(true)
    expect(canBumpToAddedToSequence('New - Need to Send')).toBe(true)
    expect(canBumpToAddedToSequence('Replied')).toBe(false)
  })
})

describe('mapOppRow', () => {
  it('maps heat, score, awaitingReply', () => {
    const o = mapOppRow(
      {
        d365_opportunity_id: 'opp-1',
        topic: 'T',
        wisai_heat: 'Hot',
        wisai_score: 80,
        last_inbound_at: '2026-10-28T12:00:00.000Z',
        last_outbound_at: '2026-10-20T12:00:00.000Z',
        deal_name: 'Fake Solar Alpha',
      },
      { 'Fake Solar Alpha': 1_000_000 },
    )
    expect(o.heat).toBe('hot')
    expect(o.engagementScore).toBe(8)
    expect(o.awaitingReply).toBe(true)
    expect(o.estimatedRevenue).toBe(1_000_000)
  })
})
