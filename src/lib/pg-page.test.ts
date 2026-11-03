import { describe, expect, it } from 'vitest'
import { footRange, shouldLoadAllMatching } from './pg-page'

describe('pg page helpers', () => {
  it('loads all when total <= 2000', () => {
    expect(shouldLoadAllMatching(240)).toBe(true)
    expect(shouldLoadAllMatching(5000)).toBe(false)
  })

  it('formats footer', () => {
    expect(footRange(100, 50, 0, 50).label).toBe('Showing 1–50 of 100')
    expect(footRange(100, 100, 0, 50).label).toBe('Showing 1–100 of 100')
  })
})
