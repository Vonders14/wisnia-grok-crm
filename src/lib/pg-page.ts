/** Typed port of pg_page.js — prospect grid footer / load-all helpers. */

export const SHOW_ALL_MAX = 2000

export function shouldLoadAllMatching(total: number): boolean {
  const n = Number(total)
  return n > 0 && n <= SHOW_ALL_MAX
}

export function needsFullFetch(total: number, loadedCount: number): boolean {
  const n = Number(total) || 0
  const have = Number(loadedCount) || 0
  return shouldLoadAllMatching(n) && have < n
}

export function footRange(
  total: number,
  loadedCount: number,
  pageNum: number,
  pageSize: number,
): {
  from: number
  to: number
  label: string
  prevDisabled: boolean
  nextDisabled: boolean
} {
  const n = Number(total) || 0
  const have = Number(loadedCount) || 0
  const page = Number(pageNum) || 0
  const size = Number(pageSize) || 50
  if (n <= 0) {
    return { from: 0, to: 0, label: '0 results', prevDisabled: true, nextDisabled: true }
  }
  if (shouldLoadAllMatching(n) && have >= n) {
    return {
      from: 1,
      to: n,
      label: `Showing 1–${n.toLocaleString()} of ${n.toLocaleString()}`,
      prevDisabled: true,
      nextDisabled: true,
    }
  }
  const from = page * size + 1
  const to = Math.min((page + 1) * size, n)
  return {
    from,
    to,
    label: `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${n.toLocaleString()}`,
    prevDisabled: page <= 0,
    nextDisabled: to >= n,
  }
}
