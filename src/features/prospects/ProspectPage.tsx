import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import { footRange } from '@/lib/pg-page'
import { parsePasteList } from '@/lib/filters'
import { PG_NOEDIT } from '@/lib/enums'
import type { Account, Contact, ProspectKind } from '@/data/types'
import { Avatar, CompanyTile, Icon } from '@/icons/Icon'
import { Btn, StatusDot, TagChip } from '@/ui/Button'
import { TopBar, ViewBar } from '@/ui/ViewChrome'
import { BulkBar } from '@/ui/BulkBar'
import { exportCsv } from '@/lib/csv'
import { toast } from '@/ui/Toaster'

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

const STAGE_COLOR: Record<string, string> = {
  '4. Interested': '#22c55e',
  '3. Replied': '#266df0',
  '2. Approaching': '#f59e0b',
  '1. Cold': '#94a3b8',
}

export function AccountsPage() {
  return <ProspectGrid kind="accounts" title="Accounts" icon="building" color="#3b82f6" />
}

export function ContactsPage() {
  return <ProspectGrid kind="contacts" title="Contacts" icon="user" color="#8b5cf6" />
}

function ProspectGrid({
  kind,
  title,
  icon,
  color,
}: {
  kind: ProspectKind
  title: string
  icon: string
  color: string
}) {
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
    const filters = []
    if (parsed.ids.length) {
      filters.push({
        key: kind === 'accounts' ? 'd365_account_id' : 'd365_contact_id',
        type: 'idlist' as const,
        values: parsed.ids,
      })
    }
    if (parsed.domains.length) {
      filters.push({ key: '__paste_domains', type: 'text' as const, values: parsed.domains })
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
        columns:
          kind === 'accounts'
            ? ['name', 'industry', 'investor_criteria']
            : ['full_name', 'title', 'email'],
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
          label: 'Company',
          width: 220,
          sticky: true,
          accessor: (r) => (r as Account).name,
          cell: (r) => (
            <div className="rn">
              <CompanyTile name={(r as Account).name} />
              <Link
                to={`/companies/${(r as Account).d365_account_id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {(r as Account).name}
              </Link>
            </div>
          ),
        },
        {
          key: 'domain',
          label: 'Domain',
          width: 160,
          accessor: (r) => (r as Account).domain,
          cell: (r) =>
            (r as Account).domain ? (
              <span className="chip dom">{(r as Account).domain}</span>
            ) : (
              <span className="empty-v">—</span>
            ),
        },
        {
          key: 'industry',
          label: 'Industry',
          width: 130,
          accessor: (r) => (r as Account).industry,
          cell: (r) =>
            (r as Account).industry ? (
              <TagChip label={(r as Account).industry!} color="#6366f1" />
            ) : (
              <span className="empty-v">—</span>
            ),
        },
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
          label: 'Criteria',
          width: 220,
          accessor: (r) => (r as Account).investor_criteria,
          cell: (r) => {
            const c = (r as Account).investor_criteria
            if (!c) return <span className="empty-v">—</span>
            return (
              <div className="tags">
                {c.split(',').slice(0, 3).map((t) => (
                  <TagChip key={t} label={t.trim()} color="#8b5cf6" />
                ))}
              </div>
            )
          },
        },
      ]
    }
    return [
      {
        key: 'full_name',
        label: 'Person',
        width: 180,
        sticky: true,
        accessor: (r) => (r as Contact).full_name,
        cell: (r) => (
          <div className="rn">
            <Avatar name={(r as Contact).full_name} />
            <Link
              to={`/people/${(r as Contact).d365_contact_id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {(r as Contact).full_name}
            </Link>
          </div>
        ),
      },
      {
        key: 'account_name',
        label: 'Company',
        width: 180,
        accessor: (r) => (r as Contact).account_name,
        cell: (r) =>
          (r as Contact).account_name ? (
            <span className="chip rel">
              <CompanyTile name={(r as Contact).account_name} />
              {(r as Contact).account_name}
            </span>
          ) : (
            <span className="empty-v">—</span>
          ),
      },
      { key: 'email', label: 'Email', width: 210, accessor: (r) => (r as Contact).email },
      {
        key: 'contact_stage',
        label: 'Contact stage',
        width: 140,
        accessor: (r) => (r as Contact).contact_stage,
        cell: (r) => {
          const s = (r as Contact).contact_stage
          if (!s) return <span className="empty-v">—</span>
          return <StatusDot color={STAGE_COLOR[s] || '#94a3b8'} label={s.replace(/^\d+\.\s*/, '')} />
        },
      },
      { key: 'title', label: 'Job title', width: 140, accessor: (r) => (r as Contact).title },
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

  const chips = [
    search ? { id: 'q', label: `Search: ${search}` } : null,
    deal ? { id: 'deal', label: `Deal: ${deal}` } : null,
    mode !== 'all' ? { id: 'mode', label: mode } : null,
    paste ? { id: 'paste', label: 'Paste list' } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="view-fill">
      <TopBar icon={icon} iconColor={color} title={title} />
      <ViewBar
        viewLabel={`All ${title}`}
        viewIcon={icon}
        viewColor={color}
        count={total}
        chips={chips}
        onClearChip={(id) => {
          if (id === 'q') patch({ q: null })
          if (id === 'deal') patch({ deal: null })
          if (id === 'mode') patch({ mode: null })
          if (id === 'paste') patch({ paste: null })
        }}
        sortOptions={[
          { key: 'updated_at', label: 'Updated' },
          { key: 'engagement_score', label: 'Engagement' },
          { key: kind === 'accounts' ? 'name' : 'full_name', label: 'Name' },
        ]}
        onSortPick={() => undefined}
        filterSlot={
          <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="pin"
              placeholder="Fast search…"
              value={search}
              onChange={(e) => patch({ q: e.target.value || null })}
            />
            <div className="mlabel">Deal targeting</div>
            <select className="pin" value={deal} onChange={(e) => patch({ deal: e.target.value || null })}>
              <option value="">Any deal</option>
              {(deals?.rows || []).map((d) => (
                <option key={d.id} value={d.deal_name}>
                  {d.deal_name}
                </option>
              ))}
            </select>
            <select className="pin" value={mode} onChange={(e) => patch({ mode: e.target.value })}>
              {DEAL_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="mlabel">Paste list</div>
            <textarea
              className="pin"
              style={{ minHeight: 64 }}
              placeholder="domains, emails, or ids…"
              value={paste}
              onChange={(e) => patch({ paste: e.target.value || null })}
            />
            <div className="mlabel">Keyword sweep</div>
            <input className="pin" placeholder="AND terms…" value={kw} onChange={(e) => setKw(e.target.value)} />
            {kwHits && <div className="muted">{kwHits.length} hits</div>}
            <div className="muted" style={{ fontSize: 11 }}>
              Never editable: investor_criteria (sacred), ids, timestamps…
            </div>
          </div>
        }
        primaryLabel="New record"
        extra={isLoading ? <span className="muted">Loading…</span> : null}
      />

      <div className="view-split">
        <div className="grid-host">
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
            onToggleSelectAll={() => {
              setSelected((prev) => {
                if (rows.every((r) => prev.has(String(r[idKey])))) return new Set()
                return new Set(rows.map((r) => String(r[idKey])))
              })
            }}
          />
          <BulkBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onExport={() => {
              const picked = rows.filter((r) => selected.has(String(r[idKey])))
              exportCsv(`${kind}-selected.csv`, picked as Record<string, unknown>[])
              toast(`Exported ${picked.length} rows`)
            }}
          />
          <div style={{ display: 'flex', gap: 8, padding: '6px 12px', borderTop: '1px solid var(--b)', color: 'var(--t3)', fontSize: 12.5 }}>
            <button type="button" className="btn sm" disabled={foot.prevDisabled} onClick={() => patch({ page: String(page - 1) })}>
              Prev
            </button>
            <button type="button" className="btn sm" disabled={foot.nextDisabled} onClick={() => patch({ page: String(page + 1) })}>
              Next
            </button>
            <span>{foot.label}</span>
          </div>
        </div>

        {drawerId && drawerRow && (
          <aside className="drawer" data-testid="prospect-drawer">
            <div className="rh">
              <div className="nm">
                {kind === 'accounts' ? (
                  <CompanyTile name={(drawerRow as Account).name} size="md" />
                ) : (
                  <Avatar name={(drawerRow as Contact).full_name} size="lg" />
                )}
                {kind === 'accounts'
                  ? (drawerRow as Account).name
                  : (drawerRow as Contact).full_name}
              </div>
              <div className="sub">{drawerId}</div>
              <div className="racts">
                <Btn soon icon="sparkle">
                  AI auto-fill
                </Btn>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    navigate(kind === 'accounts' ? `/companies/${drawerId}` : `/people/${drawerId}`)
                  }
                >
                  Open record
                </button>
                <button type="button" className="btn ghost" onClick={() => setDrawerId(null)}>
                  <Icon name="x" size="sm" />
                </button>
              </div>
            </div>
            <div className="rsec">
              <h4>Attributes</h4>
              {Object.entries(drawerRow)
                .slice(0, 20)
                .map(([k, v]) => (
                  <div className="ar ro" key={k}>
                    <div className="l">
                      {k}
                      {PG_NOEDIT.has(k) ? ' 🔒' : ''}
                    </div>
                    <div className="v">{v == null || v === '' ? <span className="empty-v">—</span> : String(v)}</div>
                  </div>
                ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
