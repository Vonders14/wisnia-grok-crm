import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { OPPS_SEEDED_VIEWS } from '@/data/fixtures'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import { FilterRail, RailChecks, RailSection } from '@/components/FilterRail'
import { ComingSoonButton } from '@/components/ComingSoon'
import { DEAL_INTERESTS, HEALTH_COLOR, HEALTH_RULES, INVESTOR_STATUSES } from '@/lib/enums'
import {
  investorStatusDot,
  mapOppRow,
  resolveHealth,
  type MappedOpp,
  type OppRaw,
} from '@/lib/opp-rules'
import { OppPanel } from './OppPanel'

const PAGE_SIZE = 50

export function OppsPage() {
  const { oppId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const client = getCrmClient()

  const heat = (params.get('heat') || 'all') as 'all' | 'hot' | 'warm' | 'cold'
  const search = params.get('q') || ''
  const deal = params.get('deal') || ''
  const viewId = params.get('view') || ''
  const page = Number(params.get('page') || '0')
  const sort = params.get('sort') || 'updated_at'
  const dir = (params.get('dir') || 'desc') as 'asc' | 'desc'
  const stages = (params.get('stage') || '').split(',').filter(Boolean)
  const interests = (params.get('interest') || '').split(',').filter(Boolean)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const seeded = OPPS_SEEDED_VIEWS.find((v) => v.id === viewId)

  const queryInterest = interests.length
    ? interests
    : seeded?.interest?.length
      ? seeded.interest
      : undefined
  const queryHeat = seeded?.heat && seeded.heat !== 'all' ? seeded.heat : heat

  const { data: prices } = useQuery({
    queryKey: ['deal-prices'],
    queryFn: () => client.dealPrices(),
  })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'opps',
      queryHeat,
      search,
      deal,
      stages.join(','),
      (queryInterest || []).join(','),
      sort,
      dir,
      page,
    ],
    queryFn: () =>
      client.listOpps({
        heat: queryHeat,
        search,
        deal: deal || null,
        stage: stages,
        interest: queryInterest,
        interestExact: true,
        sort,
        dir,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  })

  const mapped: MappedOpp[] = useMemo(
    () => (data?.rows || []).map((r) => mapOppRow(r, prices || {})),
    [data, prices],
  )

  const dealOptions = useMemo(() => {
    const s = new Set<string>()
    // From current page + known fixtures via prices keys
    for (const r of data?.rows || []) if (r.deal_name) s.add(r.deal_name)
    for (const k of Object.keys(prices || {})) s.add(k)
    return [...s].sort()
  }, [data, prices])

  const columns: GridColumn<MappedOpp>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Topic',
        width: 220,
        sticky: true,
        accessor: (r) => r.name,
        cell: (r) => (
          <span className="itxt">
            <Link to={`/opps/${r.id}`} onClick={(e) => e.stopPropagation()}>
              {r.name}
            </Link>
          </span>
        ),
      },
      {
        key: 'contactName',
        label: 'Contact',
        width: 140,
        accessor: (r) => r.contactName,
      },
      {
        key: 'email',
        label: 'Email',
        width: 180,
        accessor: (r) => r.email,
      },
      {
        key: 'company',
        label: 'Company',
        width: 160,
        accessor: (r) => r.company,
      },
      {
        key: 'dealName',
        label: 'Deal',
        width: 140,
        accessor: (r) => r.dealName,
      },
      {
        key: 'stage',
        label: 'Stage',
        width: 160,
        accessor: (r) => r.stage,
        cell: (r) => (
          <span className="itxt">
            <span className="stage-dot" style={{ background: investorStatusDot(r.stage) }} />
            {r.stage || '—'}
          </span>
        ),
      },
      {
        key: 'dealInterest',
        label: 'Interest',
        width: 150,
        accessor: (r) => r.dealInterest,
      },
      {
        key: 'heat',
        label: 'Heat',
        width: 80,
        align: 'center',
        accessor: (r) => r.heat,
        cell: (r) => <span className={`pill pill-${r.heat}`}>{r.heat}</span>,
      },
      {
        key: 'engagementScore',
        label: 'Score',
        width: 64,
        align: 'center',
        accessor: (r) => r.engagementScore,
      },
      {
        key: 'health',
        label: 'Health',
        width: 120,
        accessor: (r) => resolveHealth(r._raw),
        cell: (r) => {
          const h = resolveHealth(r._raw)
          if (!h) return <span className="itxt">—</span>
          const c = HEALTH_COLOR[h] || '#64748b'
          return (
            <span
              className="pill"
              style={{ color: c, background: c + '1a', borderColor: c + '33' }}
              title={HEALTH_RULES[h]}
            >
              {h}
            </span>
          )
        },
      },
      {
        key: 'daysSilent',
        label: 'Days silent',
        width: 90,
        align: 'center',
        accessor: (r) => r.daysSilent,
        cell: (r) => (
          <span className="itxt">
            {r.daysSilent == null ? 'never' : r.daysSilent}
          </span>
        ),
      },
      {
        key: 'replyUrgency',
        label: 'Urgency',
        width: 100,
        accessor: (r) => r.replyUrgency,
      },
      {
        key: 'nextSteps',
        label: 'Next steps',
        width: 180,
        accessor: (r) => r.nextSteps,
      },
      {
        key: 'lastModified',
        label: 'Updated',
        width: 110,
        accessor: (r) => (r.lastModified ? r.lastModified.slice(0, 10) : ''),
      },
    ],
    [],
  )

  function patchParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.set('page', '0')
    setParams(next)
  }

  function toggleList(key: 'stage' | 'interest', value: string, current: string[]) {
    const set = new Set(current)
    if (set.has(value)) set.delete(value)
    else set.add(value)
    patchParams({ [key]: [...set].join(',') || null })
  }

  const total = data?.total ?? 0
  const from = total ? page * PAGE_SIZE + 1 : 0
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <>
      <div className="topbar">
        <h1>Opps</h1>
        <span style={{ color: 'var(--muted)' }}>
          {isLoading ? 'Loading…' : `${total.toLocaleString()} live`}
        </span>
        <div className="spacer" />
        <button type="button" className="btn" disabled title="Kanban placeholder">
          Kanban <span className="badge-soon">Soon</span>
        </button>
        <ComingSoonButton>Export CSV</ComingSoonButton>
        <ComingSoonButton>Sync D365</ComingSoonButton>
        <button type="button" className="btn" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
          Search
        </button>
      </div>

      <div className={`view-body${oppId ? ' with-panel' : ''}`}>
        <FilterRail
          onReset={() =>
            setParams(new URLSearchParams(heat !== 'all' ? { heat } : undefined))
          }
        >
          <RailSection title="Saved views">
            {OPPS_SEEDED_VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`heat-chip${viewId === v.id ? ' active' : ''}`}
                style={{ display: 'block', width: '100%', marginBottom: 4, textAlign: 'left' }}
                onClick={() =>
                  patchParams({
                    view: v.id,
                    heat: v.heat === 'all' ? null : v.heat,
                    interest: v.interest.join(',') || null,
                  })
                }
              >
                {v.name}
              </button>
            ))}
            <ComingSoonButton>Save view…</ComingSoonButton>
          </RailSection>

          <RailSection title="Search">
            <input
              type="search"
              placeholder="Topic, company, email…"
              value={search}
              onChange={(e) => patchParams({ q: e.target.value || null })}
            />
          </RailSection>

          <RailSection title="Deal">
            <select
              value={deal}
              onChange={(e) => patchParams({ deal: e.target.value || null })}
            >
              <option value="">All deals</option>
              {dealOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </RailSection>

          <RailSection title="Stage">
            <RailChecks
              options={[...INVESTOR_STATUSES]}
              selected={stages}
              onToggle={(v) => toggleList('stage', v, stages)}
            />
          </RailSection>

          <RailSection title="Interest (exact)">
            <RailChecks
              options={[...DEAL_INTERESTS]}
              selected={interests}
              onToggle={(v) => toggleList('interest', v, interests)}
            />
          </RailSection>
        </FilterRail>

        <div className="grid-pane">
          {isError && (
            <div className="empty">Failed to load opps: {(error as Error).message}</div>
          )}
          {!isError && (
            <DataGrid
              rows={mapped}
              columns={columns}
              rowId={(r) => r.id}
              sortKey={sort}
              sortDir={dir}
              onSort={(key) =>
                patchParams({
                  sort: key,
                  dir: sort === key && dir === 'desc' ? 'asc' : 'desc',
                })
              }
              selectedIds={selected}
              activeId={oppId || null}
              onRowClick={(row) => navigate(`/opps/${row.id}?${params.toString()}`)}
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
                  if (mapped.every((r) => prev.has(r.id))) return new Set()
                  return new Set(mapped.map((r) => r.id))
                })
              }}
            />
          )}
          <div className="footer-bar">
            <span>
              Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
            </span>
            <button
              type="button"
              className="btn"
              disabled={page <= 0}
              onClick={() => patchParams({ page: String(page - 1) })}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn"
              disabled={to >= total}
              onClick={() => patchParams({ page: String(page + 1) })}
            >
              Next
            </button>
            {selected.size > 0 && (
              <>
                <span>{selected.size} selected</span>
                <ComingSoonButton>Mass email</ComingSoonButton>
                <ComingSoonButton>Add to sequence</ComingSoonButton>
                <ComingSoonButton>Score intent</ComingSoonButton>
              </>
            )}
          </div>
        </div>

        {oppId && <OppPanel oppId={oppId} raw={data?.rows.find((r) => r.d365_opportunity_id === oppId)} />}
      </div>
    </>
  )
}

export function OppPanelFallback({ opp }: { opp: OppRaw }) {
  return <pre>{JSON.stringify(opp, null, 2)}</pre>
}
