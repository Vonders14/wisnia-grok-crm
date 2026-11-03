import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { OPPS_SEEDED_VIEWS } from '@/data/fixtures'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import { DEAL_INTERESTS, HEALTH_COLOR, INVESTOR_STATUSES } from '@/lib/enums'
import {
  investorStatusDot,
  mapOppRow,
  resolveHealth,
  type MappedOpp,
} from '@/lib/opp-rules'
import { Avatar } from '@/icons/Icon'
import { StatusDot, TagChip } from '@/ui/Button'
import { TopBar, ViewBar } from '@/ui/ViewChrome'
import { BulkBar } from '@/ui/BulkBar'
import { exportCsv } from '@/lib/csv'
import { toast } from '@/ui/Toaster'
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
  const queryInterest = interests.length ? interests : seeded?.interest?.length ? seeded.interest : undefined
  const queryHeat = seeded?.heat && seeded.heat !== 'all' ? seeded.heat : heat

  const { data: prices } = useQuery({
    queryKey: ['deal-prices'],
    queryFn: () => client.dealPrices(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['opps', queryHeat, search, deal, stages.join(','), (queryInterest || []).join(','), sort, dir, page],
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

  const columns: GridColumn<MappedOpp>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Opportunity',
        width: 260,
        sticky: true,
        accessor: (r) => r.name,
        cell: (r) => (
          <div className="rn">
            <Avatar name={r.contactName || r.name} />
            <Link to={`/opps/${r.id}`} onClick={(e) => e.stopPropagation()}>
              {r.name}
            </Link>
          </div>
        ),
      },
      {
        key: 'company',
        label: 'Company',
        width: 160,
        accessor: (r) => r.company,
        cell: (r) => (r.company ? <TagChip label={r.company} color="#3b82f6" /> : <span className="empty-v">—</span>),
      },
      {
        key: 'email',
        label: 'Email',
        width: 200,
        accessor: (r) => r.email,
      },
      {
        key: 'stage',
        label: 'Stage',
        width: 170,
        accessor: (r) => r.stage,
        cell: (r) =>
          r.stage ? (
            <StatusDot color={investorStatusDot(r.stage)} label={r.stage} />
          ) : (
            <span className="empty-v">—</span>
          ),
      },
      {
        key: 'dealInterest',
        label: 'Interest',
        width: 140,
        accessor: (r) => r.dealInterest,
        cell: (r) =>
          r.dealInterest ? (
            <StatusDot
              color={r.dealInterest.includes('Not') ? '#94a3b8' : '#22c55e'}
              label={r.dealInterest}
            />
          ) : (
            <span className="empty-v">—</span>
          ),
      },
      {
        key: 'heat',
        label: 'Heat',
        width: 90,
        accessor: (r) => r.heat,
        cell: (r) => (
          <span className="st">
            <span className={`heat-dot ${r.heat}`} />
            {r.heat}
          </span>
        ),
      },
      {
        key: 'engagementScore',
        label: 'Score',
        width: 70,
        align: 'center',
        accessor: (r) => r.engagementScore,
      },
      {
        key: 'health',
        label: 'Health',
        width: 130,
        accessor: (r) => resolveHealth(r._raw),
        cell: (r) => {
          const h = resolveHealth(r._raw)
          if (!h) return <span className="empty-v">—</span>
          return <StatusDot color={HEALTH_COLOR[h] || '#64748b'} label={h} />
        },
      },
      {
        key: 'dealName',
        label: 'Deal',
        width: 140,
        accessor: (r) => r.dealName,
        cell: (r) => (r.dealName ? <TagChip label={r.dealName} color="#f59e0b" /> : <span className="empty-v">—</span>),
      },
      {
        key: 'daysSilent',
        label: 'Days silent',
        width: 100,
        align: 'center',
        accessor: (r) => r.daysSilent,
        cell: (r) => (
          <span className="num muted">{r.daysSilent == null ? 'never' : r.daysSilent}</span>
        ),
      },
    ],
    [],
  )

  function patch(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.set('page', '0')
    setParams(next)
  }

  const chips = [
    heat !== 'all' ? { id: 'heat', label: `Heat: ${heat}` } : null,
    ...stages.map((s) => ({ id: `stage:${s}`, label: s })),
    ...interests.map((s) => ({ id: `interest:${s}`, label: s })),
    deal ? { id: 'deal', label: deal } : null,
    viewId ? { id: 'view', label: seeded?.name || viewId } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  const total = data?.total ?? 0

  return (
    <div className="view-fill">
      <TopBar icon="pipeline" iconColor="#266df0" title="Opps" />
      <ViewBar
        viewLabel={seeded?.name || 'All Opps'}
        viewIcon="pipeline"
        viewColor="#266df0"
        count={total}
        chips={chips}
        onClearChip={(id) => {
          if (id === 'heat') patch({ heat: null })
          else if (id === 'deal') patch({ deal: null })
          else if (id === 'view') patch({ view: null, interest: null })
          else if (id.startsWith('stage:'))
            patch({ stage: stages.filter((s) => s !== id.slice(6)).join(',') || null })
          else if (id.startsWith('interest:'))
            patch({ interest: interests.filter((s) => s !== id.slice(9)).join(',') || null })
        }}
        sortLabel={sort === 'updated_at' ? 'Updated' : sort}
        sortOptions={[
          { key: 'updated_at', label: 'Updated' },
          { key: 'wisai_score', label: 'Score' },
          { key: 'days_since_inbound', label: 'Days silent' },
          { key: 'topic', label: 'Topic' },
        ]}
        onSortPick={(key) => patch({ sort: key, dir: 'desc' })}
        filterSlot={
          <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="pin"
              placeholder="Search…"
              value={search}
              onChange={(e) => patch({ q: e.target.value || null })}
            />
            <div className="mlabel">Heat</div>
            {(['all', 'hot', 'warm', 'cold'] as const).map((h) => (
              <div key={h} className="mi" onClick={() => patch({ heat: h === 'all' ? null : h })}>
                {h}
              </div>
            ))}
            <div className="mlabel">Saved views</div>
            {OPPS_SEEDED_VIEWS.map((v) => (
              <div
                key={v.id}
                className="mi"
                onClick={() =>
                  patch({
                    view: v.id,
                    heat: v.heat === 'all' ? null : v.heat,
                    interest: v.interest.join(',') || null,
                  })
                }
              >
                {v.name}
              </div>
            ))}
            <div className="mlabel">Stage</div>
            {INVESTOR_STATUSES.slice(0, 8).map((s) => (
              <label key={s} className="mi" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={stages.includes(s)}
                  onChange={() => {
                    const set = new Set(stages)
                    if (set.has(s)) set.delete(s)
                    else set.add(s)
                    patch({ stage: [...set].join(',') || null })
                  }}
                />
                {s}
              </label>
            ))}
            <div className="mlabel">Interest (exact)</div>
            {DEAL_INTERESTS.map((s) => (
              <label key={s} className="mi">
                <input
                  type="checkbox"
                  checked={interests.includes(s)}
                  onChange={() => {
                    const set = new Set(interests)
                    if (set.has(s)) set.delete(s)
                    else set.add(s)
                    patch({ interest: [...set].join(',') || null })
                  }}
                />
                {s}
              </label>
            ))}
          </div>
        }
        primaryLabel="New opportunity"
        extra={
          <span className="muted" style={{ fontSize: 12 }}>
            {isLoading ? 'Loading…' : `Page ${page + 1}`}
          </span>
        }
      />

      <div className="view-split">
        <div className="grid-host">
          <DataGrid
            rows={mapped}
            columns={columns}
            rowId={(r) => r.id}
            sortKey={sort}
            sortDir={dir}
            onSort={(key) =>
              patch({ sort: key, dir: sort === key && dir === 'desc' ? 'asc' : 'desc' })
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
          <BulkBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onExport={() => {
              const rows = mapped
                .filter((r) => selected.has(r.id))
                .map((r) => ({
                  id: r.id,
                  topic: r.name,
                  contact: r.contactName,
                  email: r.email,
                  company: r.company,
                  stage: r.stage,
                  interest: r.dealInterest,
                  heat: r.heat,
                  score: r.engagementScore,
                }))
              exportCsv('opps-selected.csv', rows)
              toast(`Exported ${rows.length} opps`)
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '6px 12px',
              borderTop: '1px solid var(--b)',
              color: 'var(--t3)',
              fontSize: 12.5,
            }}
          >
            <button type="button" className="btn sm" disabled={page <= 0} onClick={() => patch({ page: String(page - 1) })}>
              Prev
            </button>
            <button
              type="button"
              className="btn sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => patch({ page: String(page + 1) })}
            >
              Next
            </button>
            <span>
              Showing {total ? page * PAGE_SIZE + 1 : 0}–
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
            </span>
          </div>
        </div>
        {oppId && <OppPanel oppId={oppId} raw={data?.rows.find((r) => r.d365_opportunity_id === oppId)} />}
      </div>
    </div>
  )
}
