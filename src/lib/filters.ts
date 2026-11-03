import { domain } from './data-contract'
import { PG_CONSUMER } from './enums'
import { exactInterestMatch } from './opp-rules'

export type FilterOp = 'contains' | 'is' | 'is_empty' | 'is_not_empty'

export interface ColumnFilter {
  key: string
  op?: FilterOp
  /** When true (default for deal_interest "Interested"), whole-value match. */
  exact?: boolean
  values?: string[]
  text?: string
  min?: number | null
  max?: number | null
  from?: string | null
  to?: string | null
}

export function matchEnumFilter(
  cell: string | null | undefined,
  filter: ColumnFilter,
): boolean {
  const v = cell ?? ''
  if (filter.op === 'is_empty') return !v
  if (filter.op === 'is_not_empty') return !!v
  if (!filter.values?.length) return true
  if (filter.exact || filter.op === 'is') {
    return filter.values.some((f) => exactInterestMatch(v, f))
  }
  const lower = v.toLowerCase()
  return filter.values.some((f) => lower.includes(f.toLowerCase()))
}

export function matchTextFilter(cell: unknown, filter: ColumnFilter): boolean {
  if (filter.op === 'is_empty') return cell == null || String(cell).trim() === ''
  if (filter.op === 'is_not_empty') return !(cell == null || String(cell).trim() === '')
  if (!filter.text) return true
  return String(cell ?? '')
    .toLowerCase()
    .includes(filter.text.toLowerCase())
}

export function matchNumFilter(cell: unknown, filter: ColumnFilter): boolean {
  if (cell == null || cell === '') {
    return filter.op === 'is_empty'
  }
  const n = Number(cell)
  if (!Number.isFinite(n)) return false
  if (filter.min != null && n < filter.min) return false
  if (filter.max != null && n > filter.max) return false
  return true
}

/** Paste-list domain/email matching with consumer-domain skip + boundary match. */
export function parsePasteList(raw: string): { domains: string[]; emails: string[]; ids: string[] } {
  const domains: string[] = []
  const emails: string[] = []
  const ids: string[] = []
  for (const part of raw.split(/[\s,;]+/)) {
    const t = part.trim().toLowerCase()
    if (!t) continue
    if (t.includes('@')) {
      emails.push(t)
      const host = domain(t)
      if (host && !PG_CONSUMER.has(host)) domains.push(host)
    } else if (/^[0-9a-f-]{36}$/i.test(t)) {
      ids.push(t)
    } else {
      const host = domain(t) || t.replace(/^www\./, '')
      if (host && !PG_CONSUMER.has(host)) domains.push(host)
    }
  }
  return {
    domains: [...new Set(domains)],
    emails: [...new Set(emails)],
    ids: [...new Set(ids)],
  }
}

export function domainBoundaryMatch(haystack: string | null | undefined, needle: string): boolean {
  const h = domain(haystack) || String(haystack ?? '').toLowerCase()
  if (!h || !needle) return false
  return h === needle || h.endsWith(`.${needle}`)
}
