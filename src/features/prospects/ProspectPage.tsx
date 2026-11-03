import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import { FilterRail, RailSection } from '@/components/FilterRail'
import { ComingSoonButton } from '@/components/ComingSoon'
import { footRange } from '@/lib/pg-page'
import { parsePasteList } from '@/lib/filters'
import { PG_NOEDIT } from '@/lib/enums'
import type { Account, Contact, ProspectKind } from '@/data/types'

const PAGE_SIZE = 50

const DEAL_MODES = [
  'all',
  'not enrolled',
  'queued',
  'sent',
  'replied',
  'auto reply',
  'no reply',
  'active',
] as const

export function AccountsPage() {
  return <ProspectGrid kind="accounts" title="Accounts" />
}

export function ContactsPage() {
  return <ProspectGrid kind="contacts" title="Contacts" />
}

function ProspectGrid({ kind, title }: { kind: ProspectKind; title: string }) {
  const client = getCrmClient()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const page = Number(params.get('page') || '0')
  const deal = params.get('deal') || ''
  const mode = params.get('mode') || 'all'
  const paste = params.get('paste') || ''
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [kw, setKw] = useState('')
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const pasteFilters = useMemo(() => {
    if (!paste.trim()) return []
    const parsed = parsePasteList(paste)
    if (!parsed.domains.length && !parsed.emails.length && !parsed.ids.length) return []
    const filters = []
    if (parsed.ids.length) {
      filters.push({
        key: kind === 'accounts' ? 'd365_account_id' : 'd365_contact_id',
        type: 'idlist' as const,
        values: parsed.ids,
      })
    }
    if (parsed.domains.length) {
      filters.push({
        key: '__paste_domains',
        type: 'text' as const,
        values: parsed.domains,
      })
    }
    return filters
  }, [paste, kind])

  const { data, isLoading } = useQuery({
    queryKey: ['prospect', kind, search, page, deal, mode, paste],
    queryFn: () =>
      client.prospectPage({
        kind,
        search,
        deal: deal || null,
        mode: mode === 'all' ? null : mode,
        sort: 'updated_at',
        dir: 'desc',
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        filters: pasteFilters,
      }),
  })

  const { data: deals } = useQuery({
    queryKey: ['deals-for-targeting'],
    queryFn: () => client.listDeals({ includeClosed: false, limit: 200 }),
  })

  const { data: kwHits } = useQuery({
    queryKey: ['kw', kind, kw],
    queryFn: () =>
      client.keywordSweep({
        kind,
        columns: kind === 'accounts' ? ['name', 'industry', 'investor_criteria'] : ['full_name', 'title', 'email'],
        groups: [{ op: 'AND', terms: kw.split(/\s+/).filter(Boolean) }],
      }),
    enabled: kw.trim().length >= 2,
  })

  const idKey = kind === 'accounts' ? 'd365_account_id' : 'd365_contact_id'

  const columns: GridColumn<Account | Contact>[] = useMemo(() => {
    if (kind === 'accounts') {
      return [
        {
          key: 'name',
          label: 'Account',
          width: 200,
          sticky: true,
          accessor: (r) => (r as Account).name,
          cell: (r) => (
            <Link
              to={`/companies/${(r as Account).d365_account_id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {(r as Account).name}
            </Link>
          ),
        },
        { key: 'domain', label: 'Domain', width: 160, accessor: (r) => (r as Account).domain },
        { key: 'industry', label: 'Industry', width: 120, accessor: (r) => (r as Account).industry },
        { key: 'state', label: 'State', width: 70, accessor: (r) => (r as Account).state },
        {
          key: 'engagement_score',
          label: 'Engagement',
          width: 100,
          align: 'center',
          accessor: (r) => (r as Account).engagement_score,
        },
        {
          key: 'investor_criteria',
          label: 'Criteria (locked)',
          width: 200,
          accessor: (r) => (r as Account).investor_criteria,
          cell: (r) => (
            <span className="itxt" title="investor_criteria is sacred / never auto-edited">
              {(r as Account).investor_criteria || '—'}
            </span>
          ),
        },
      ]
    }
    return [
      {
        key: 'full_name',
        label: 'Contact',
        width: 160,
        sticky: true,
        accessor: (r) => (r as Contact).full_name,
        cell: (r) => (
          <Link
            to={`/people/${(r as Contact).d365_contact_id}`}
            onClick={(e) => e.stopPropagation()}
          >
            {(r as Contact).full_name}
          </Link>
        ),
      },
      { key: 'email', label: 'Email', width: 200, accessor: (r) => (r as Contact).email },
      { key: 'title', label: 'Title', width: 140, accessor: (r) => (r as Contact).title },
      {
        key: 'account_name',
        label: 'Account',
        width: 160,
        accessor: (r) => (r as Contact).account_name,
      },
      {
        key: 'contact_stage',
        label: 'Stage',
        width: 140,
        accessor: (r) => (r as Contact).contact_stage,
      },
      {
        key: 'engagement_score',
        label: 'Engagement',
        width: 100,
        align: 'center',
        accessor: (r) => (r as Contact).engagement_score,
      },
    ]
  }, [kind])

  function patch(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.set('page', '0')
    setParams(next)
  }

  const rows = (data?.rows || []) as (Account | Contact)[]
  const total = data?.total ?? 0
  const foot = footRange(total, rows.length, page, PAGE_SIZE)
  const drawerRow = rows.find((r) => String(r[idKey]) === drawerId)

  return (
    <>
      <div className="topbar">
        <h1>{title}</h1>
        <span style={{ color: 'var(--muted)' }}>
          {isLoading ? 'Loading…' : `${total.toLocaleString()} matching`}
        </span>
        <div className="spacer" />
        <ComingSoonButton>Create Opportunity</ComingSoonButton>
        <ComingSoonButton>Run Prompt</ComingSoonButton>
        <ComingSoonButton>Find in Apollo</ComingSoonButton>
        <ComingSoonButton>Add to sequence</ComingSoonButton>
        <ComingSoonButton>Export</ComingSoonButton>
      </div>

      <div className={`view-body${drawerId ? ' with-panel' : ''}`}>
        <FilterRail onReset={() => setParams(new URLSearchParams())}>
          <RailSection title="Search">
            <input
              type="search"
              value={search}
              placeholder="Fast search…"
              onChange={(e) => patch({ q: e.target.value || null })}
            />
          </RailSection>

          <RailSection title="Saved views">
            <SavedViews tab={kind === 'accounts' ? 'pg_accounts' : 'pg_contacts'} />
          </RailSection>

          <RailSection title="Deal targeting">
            <select value={deal} onChange={(e) => patch({ deal: e.target.value || null })}>
              <option value="">Any deal</option>
              {(deals?.rows || []).map((d) => (
                <option key={d.id} value={d.deal_name}>
                  {d.deal_name}
                </option>
              ))}
            </select>
            <select value={mode} onChange={(e) => patch({ mode: e.target.value })}>
              {DEAL_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p style={{ color: 'var(--muted)', fontSize: 11 }}>
              Modes feed <code>crm_prospect_page</code> p_deal / p_mode (read).
            </p>
          </RailSection>

          <RailSection title="Paste list">
            <textarea
              placeholder="domains, emails, or ids…"
              value={paste}
              onChange={(e) => patch({ paste: e.target.value || null })}
            />
            <p style={{ color: 'var(--muted)', fontSize: 11 }}>
              Consumer domains (gmail, yahoo, …) ignored. Boundary match on domain.
            </p>
            <ComingSoonButton>Sync to CRM (ghosts)</ComingSoonButton>
          </RailSection>

          <RailSection title="Keyword sweep">
            <input
              type="text"
              placeholder="AND terms…"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
            {kwHits && (
              <div style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                {kwHits.length} exact-ish hits via sweep
              </div>
            )}
          </RailSection>

          <RailSection title="Edit policy">
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>
              Never editable: {[...PG_NOEDIT].slice(0, 5).join(', ')}…
              <br />
              <code>investor_criteria</code> is sacred.
            </p>
            <ComingSoonButton>Inline edit</ComingSoonButton>
          </RailSection>
        </FilterRail>

        <div className="grid-pane">
          <DataGrid
            rows={rows}
            columns={columns}
            rowId={(r) => String(r[idKey])}
            selectedIds={selected}
            activeId={drawerId}
            onRowClick={(row) => setDrawerId(String(row[idKey]))}
            onToggleSelect={(id) => {
              setSelected((prev) => {
                const n = new Set(prev)
                if (n.has(id)) n.delete(id)
                else n.add(id)
                return n
              })
            }}
          />
          <div className="footer-bar">
            <span>{foot.label}</span>
            <button
              type="button"
              className="btn"
              disabled={foot.prevDisabled}
              onClick={() => patch({ page: String(page - 1) })}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn"
              disabled={foot.nextDisabled}
              onClick={() => patch({ page: String(page + 1) })}
            >
              Next
            </button>
            {selected.size > 0 && <span>{selected.size} selected</span>}
          </div>
        </div>

        {drawerId && drawerRow && (
          <aside className="panel" data-testid="prospect-drawer">
            <div className="panel-header">
              <h2 className="title">
                {kind === 'accounts'
                  ? (drawerRow as Account).name
                  : (drawerRow as Contact).full_name}
              </h2>
              <div className="panel-meta">{drawerId}</div>
            </div>
            <div className="panel-actions">
              <ComingSoonButton>AI auto-fill</ComingSoonButton>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  navigate(
                    kind === 'accounts'
                      ? `/companies/${drawerId}`
                      : `/people/${drawerId}`,
                  )
                }
              >
                Open record
              </button>
              <button type="button" className="btn" onClick={() => setDrawerId(null)}>
                Close
              </button>
            </div>
            <div className="panel-body">
              {Object.entries(drawerRow)
                .slice(0, 24)
                .map(([k, v]) => (
                  <div className="field-row" key={k}>
                    <div className="k">
                      {k}
                      {PG_NOEDIT.has(k) ? ' 🔒' : ''}
                    </div>
                    <div className="v">{v == null || v === '' ? '—' : String(v)}</div>
                  </div>
                ))}
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

function SavedViews({ tab }: { tab: string }) {
  const client = getCrmClient()
  const { data } = useQuery({
    queryKey: ['saved-views', tab],
    queryFn: () => client.listSavedViews(tab),
  })
  return (
    <div>
      {(data || []).map((v) => (
        <div key={v.id} className="heat-chip" style={{ display: 'block', marginBottom: 4 }}>
          {v.name}
        </div>
      ))}
    </div>
  )
}
