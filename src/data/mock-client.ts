import {
  FIXTURE_ACCOUNTS,
  FIXTURE_CALLS,
  FIXTURE_CAMPAIGN_ROLLUPS,
  FIXTURE_CONTACTS,
  FIXTURE_DEAL_DOCS,
  FIXTURE_DEALS,
  FIXTURE_EMAILS,
  FIXTURE_OPPS,
  FIXTURE_SAVED_VIEWS,
  FIXTURE_TASKS,
} from './fixtures'
import type { CrmDataClient } from './client'
import type {
  Account,
  Contact,
  DealListParams,
  GlobalSearchResult,
  KeywordSweepHit,
  KeywordSweepParams,
  OppListParams,
  OppListResult,
  OppRaw,
  ProspectPageParams,
  ProspectPageResult,
} from './types'
import { domainBoundaryMatch, matchEnumFilter, parsePasteList } from '@/lib/filters'
import { isClosedDealStatus, isLiveOpp, scopeOppEmails } from '@/lib/opp-rules'

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  sort: string | undefined,
  dir: 'asc' | 'desc' = 'desc',
): T[] {
  if (!sort) return rows
  const mul = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[sort]
    const bv = b[sort]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul
    return String(av).localeCompare(String(bv)) * mul
  })
}

export class MockCrmClient implements CrmDataClient {
  readonly mode = 'mock' as const

  async listOpps(params: OppListParams = {}): Promise<OppListResult> {
    let rows = FIXTURE_OPPS.filter(isLiveOpp)
    if (params.heat && params.heat !== 'all') {
      const want = params.heat
      rows = rows.filter((r) => {
        const h = (r.wisai_heat || '').toLowerCase()
        if (want === 'hot') return h === 'hot'
        if (want === 'warm') return h === 'warm' || h === 'engaged'
        return !h || h === 'cold' || h === 'touched' || h === 'dead'
      })
    }
    if (params.deal) rows = rows.filter((r) => r.deal_name === params.deal)
    if (params.stage?.length) {
      rows = rows.filter((r) => params.stage!.includes(r.investor_status || ''))
    }
    if (params.interest?.length) {
      rows = rows.filter((r) =>
        matchEnumFilter(r.deal_interest, {
          key: 'deal_interest',
          values: params.interest,
          exact: params.interestExact !== false,
        }),
      )
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      rows = rows.filter(
        (r) =>
          (r.topic || '').toLowerCase().includes(q) ||
          (r.account_name || '').toLowerCase().includes(q) ||
          (r.contact_name || '').toLowerCase().includes(q) ||
          (r.contact_email || '').toLowerCase().includes(q) ||
          (r.deal_name || '').toLowerCase().includes(q),
      )
    }
    rows = sortRows(rows as OppRaw[], params.sort || 'updated_at', params.dir || 'desc') as OppRaw[]
    const total = rows.length
    const offset = params.offset ?? 0
    const limit = params.limit ?? 50
    return { rows: rows.slice(offset, offset + limit), total }
  }

  async getOpp(id: string) {
    return FIXTURE_OPPS.find((o) => o.d365_opportunity_id === id) ?? null
  }

  async listOppEmails(oppId: string) {
    const opp = await this.getOpp(oppId)
    if (!opp) return []
    const tagged = FIXTURE_EMAILS.filter((e) => e.d365_opportunity_id === oppId)
    const contactEmails = FIXTURE_EMAILS.filter(
      (e) =>
        e.from_email?.toLowerCase() === (opp.contact_email || '').toLowerCase() ||
        e.to_email?.toLowerCase() === (opp.contact_email || '').toLowerCase(),
    )
    const liveOppCountForContact = FIXTURE_OPPS.filter(
      (o) =>
        isLiveOpp(o) &&
        (o.contact_email || '').toLowerCase() === (opp.contact_email || '').toLowerCase(),
    ).length
    return scopeOppEmails({
      oppId,
      contactEmail: opp.contact_email,
      tagged,
      contactEmails,
      liveOppCountForContact,
    })
  }

  async listOppTasks(oppId: string) {
    return FIXTURE_TASKS.filter(
      (t) => t.d365_opportunity_id === oppId && !t.snoozed_until,
    )
  }

  async listOppCalls(oppId: string) {
    return FIXTURE_CALLS.filter((c) => c.d365_opportunity_id === oppId)
  }

  async listDeals(params: DealListParams = {}) {
    let rows = [...FIXTURE_DEALS]
    if (!params.includeClosed) {
      rows = rows.filter((d) => !isClosedDealStatus(d.status))
    }
    if (params.status?.length) {
      rows = rows.filter((d) => params.status!.includes(d.status || ''))
    }
    if (params.stage?.length) {
      rows = rows.filter((d) => params.stage!.includes(d.stage || ''))
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      rows = rows.filter(
        (d) =>
          d.deal_name.toLowerCase().includes(q) ||
          (d.account_name || '').toLowerCase().includes(q),
      )
    }
    rows = sortRows(
      rows,
      params.sort || 'last_activity_date',
      params.dir || 'desc',
    ) as typeof rows
    const total = rows.length
    const offset = params.offset ?? 0
    const limit = params.limit ?? 200
    return { rows: rows.slice(offset, offset + limit), total }
  }

  async getDeal(id: string) {
    return FIXTURE_DEALS.find((d) => d.id === id) ?? null
  }

  async listDealDocs(dealId: string) {
    return FIXTURE_DEAL_DOCS.filter((d) => d.deal_id === dealId)
  }

  async listDealTasks(dealId: string) {
    const deal = await this.getDeal(dealId)
    return FIXTURE_TASKS.filter(
      (t) =>
        !t.snoozed_until &&
        (t.deal_id === dealId || (deal && t.deal_name === deal.deal_name)),
    )
  }

  async listDealTimeline(dealId: string) {
    const deal = await this.getDeal(dealId)
    const investors = deal ? await this.listDealInvestors(deal.deal_name) : []
    const oppIds = new Set(investors.map((o) => o.d365_opportunity_id))
    return {
      tasks: await this.listDealTasks(dealId),
      emails: FIXTURE_EMAILS.filter((e) => e.d365_opportunity_id && oppIds.has(e.d365_opportunity_id)),
      calls: FIXTURE_CALLS.filter((c) => c.deal_id === dealId),
    }
  }

  async listCampaignRollups() {
    return FIXTURE_CAMPAIGN_ROLLUPS
  }

  async listDealInvestors(dealName: string) {
    return FIXTURE_OPPS.filter((o) => isLiveOpp(o) && o.deal_name === dealName)
  }

  async prospectPage(
    params: ProspectPageParams,
  ): Promise<ProspectPageResult<Account | Contact>> {
    const isAccounts = params.kind === 'accounts'
    let rows: (Account | Contact)[] = isAccounts
      ? [...FIXTURE_ACCOUNTS]
      : [...FIXTURE_CONTACTS]

    if (params.search) {
      const q = params.search.toLowerCase()
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
    }

    for (const f of params.filters || []) {
      if (f.type === 'enum' && f.values?.length) {
        rows = rows.filter((r) => f.values!.includes(String(r[f.key] ?? '')))
      }
      if (f.type === 'text' && f.text) {
        const t = f.text.toLowerCase()
        rows = rows.filter((r) => String(r[f.key] ?? '').toLowerCase().includes(t))
      }
      if (f.type === 'idlist' && f.values?.length) {
        const idKey = isAccounts ? 'd365_account_id' : 'd365_contact_id'
        const set = new Set(f.values.map((v) => v.toLowerCase()))
        rows = rows.filter((r) => set.has(String(r[idKey] ?? '').toLowerCase()))
      }
      if (f.type === 'text' && f.key === '__paste_domains' && f.values?.length) {
        rows = rows.filter((r) => {
          const site = String(
            (r as Account).website || (r as Account).domain || (r as Contact).email || '',
          )
          return f.values!.some((d) => domainBoundaryMatch(site, d))
        })
      }
    }

    // Deal targeting modes are stubbed as no-op filters on fixtures except "all".
    rows = sortRows(
      rows as Record<string, unknown>[],
      params.sort || 'updated_at',
      params.dir || 'desc',
    ) as (Account | Contact)[]

    const total = rows.length
    const offset = params.offset ?? 0
    const limit = params.limit ?? 50
    return { rows: rows.slice(offset, offset + limit), total }
  }

  async getAccount(id: string) {
    return (
      FIXTURE_ACCOUNTS.find(
        (a) => a.d365_account_id.toLowerCase() === id.toLowerCase(),
      ) ?? null
    )
  }

  async getContact(id: string) {
    return (
      FIXTURE_CONTACTS.find(
        (c) => c.d365_contact_id.toLowerCase() === id.toLowerCase(),
      ) ?? null
    )
  }

  async keywordSweep(params: KeywordSweepParams): Promise<KeywordSweepHit[]> {
    const pool =
      params.kind === 'contacts' ? FIXTURE_CONTACTS : FIXTURE_ACCOUNTS
    const idKey = params.kind === 'contacts' ? 'd365_contact_id' : 'd365_account_id'
    const hits: KeywordSweepHit[] = []
    for (const row of pool) {
      const matched: string[] = []
      for (const group of params.groups) {
        const groupHits = group.terms.filter((term) => {
          const t = term.toLowerCase()
          return params.columns.some((col) =>
            String(row[col] ?? '')
              .toLowerCase()
              .includes(t),
          )
        })
        const ok = group.op === 'AND' ? groupHits.length === group.terms.length : groupHits.length > 0
        if (ok) matched.push(...groupHits)
        else if (params.groups.length === 1) {
          // single failing group → no hit
        }
      }
      // All groups must pass (AND across groups), approximating crm_keyword_sweep_exact.
      let allGroups = true
      for (const group of params.groups) {
        const groupOk =
          group.op === 'AND'
            ? group.terms.every((term) =>
                params.columns.some((col) =>
                  String(row[col] ?? '')
                    .toLowerCase()
                    .includes(term.toLowerCase()),
                ),
              )
            : group.terms.some((term) =>
                params.columns.some((col) =>
                  String(row[col] ?? '')
                    .toLowerCase()
                    .includes(term.toLowerCase()),
                ),
              )
        if (!groupOk) {
          allGroups = false
          break
        }
      }
      if (allGroups && params.groups.length) {
        hits.push({ id: String(row[idKey]), matched: [...new Set(matched)] })
      }
    }
    return hits
  }

  async listSavedViews(tab: string) {
    return FIXTURE_SAVED_VIEWS.filter((v) => v.tab === tab)
  }

  async globalSearch(q: string): Promise<GlobalSearchResult> {
    const s = q.trim().toLowerCase()
    if (!s) {
      return { accounts: [], contacts: [], deals: [], opps: [], emails: [] }
    }
    return {
      accounts: FIXTURE_ACCOUNTS.filter((a) => JSON.stringify(a).toLowerCase().includes(s)).slice(
        0,
        8,
      ),
      contacts: FIXTURE_CONTACTS.filter((c) => JSON.stringify(c).toLowerCase().includes(s)).slice(
        0,
        8,
      ),
      deals: FIXTURE_DEALS.filter((d) => JSON.stringify(d).toLowerCase().includes(s)).slice(0, 8),
      opps: FIXTURE_OPPS.filter((o) => isLiveOpp(o) && JSON.stringify(o).toLowerCase().includes(s)).slice(
        0,
        8,
      ),
      emails: FIXTURE_EMAILS.filter((e) => JSON.stringify(e).toLowerCase().includes(s)).slice(0, 8),
    }
  }

  async dealPrices() {
    const out: Record<string, number> = {}
    for (const d of FIXTURE_DEALS) {
      if (d.asking_price != null) out[d.deal_name] = d.asking_price
    }
    return out
  }
}

/** Helper exported for paste-list UI against mock. */
export function applyPasteListToFilters(raw: string) {
  return parsePasteList(raw)
}
