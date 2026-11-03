import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import { FilterRail, RailChecks, RailSection } from '@/components/FilterRail'
import { ComingSoonButton } from '@/components/ComingSoon'
import type { Deal } from '@/data/types'
import { DealDrawer } from './DealDrawer'

export function DealsPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const client = getCrmClient()
  const search = params.get('q') || ''
  const includeClosed = params.get('closed') === '1'
  const statuses = (params.get('status') || '').split(',').filter(Boolean)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['deals', search, includeClosed, statuses.join(',')],
    queryFn: () =>
      client.listDeals({
        search,
        includeClosed,
        status: statuses,
        limit: 200,
      }),
  })

  const { data: rollups } = useQuery({
    queryKey: ['campaign-rollups'],
    queryFn: () => client.listCampaignRollups(),
  })

  const { data: investorCounts } = useQuery({
    queryKey: ['deal-investor-counts', (data?.rows || []).map((d) => d.deal_name).join('|')],
    queryFn: async () => {
      const map: Record<string, number> = {}
      await Promise.all(
        (data?.rows || []).map(async (d) => {
          const inv = await client.listDealInvestors(d.deal_name)
          map[d.deal_name] = inv.length
        }),
      )
      return map
    },
    enabled: !!data?.rows?.length,
  })

  const statusOptions = useMemo(() => {
    const s = new Set<string>()
    for (const d of data?.rows || []) if (d.status) s.add(d.status)
    s.add('Active')
    s.add('Closed - Won')
    return [...s]
  }, [data])

  const columns: GridColumn<Deal>[] = useMemo(
    () => [
      {
        key: 'deal_name',
        label: 'Deal',
        width: 180,
        sticky: true,
        accessor: (r) => r.deal_name,
        cell: (r) => (
          <Link to={`/deals/${r.id}`} onClick={(e) => e.stopPropagation()}>
            {r.deal_name}
          </Link>
        ),
      },
      {
        key: 'account_name',
        label: 'Account',
        width: 150,
        accessor: (r) => r.account_name,
      },
      {
        key: 'status',
        label: 'Status',
        width: 120,
        accessor: (r) => r.status,
      },
      {
        key: 'stage',
        label: 'Stage',
        width: 120,
        accessor: (r) => r.stage,
      },
      {
        key: 'asset_type',
        label: 'Asset',
        width: 90,
        accessor: (r) => r.asset_type,
      },
      {
        key: 'investors',
        label: 'Investors',
        width: 90,
        align: 'center',
        accessor: (r) => investorCounts?.[r.deal_name] ?? '…',
      },
      {
        key: 'campaigns',
        label: 'Campaigns',
        width: 100,
        align: 'center',
        accessor: (r) =>
          rollups?.find((x) => x.deal_name === r.deal_name)?.campaigns ?? 0,
      },
      {
        key: 'asking_price',
        label: 'Asking',
        width: 110,
        align: 'right',
        accessor: (r) => r.asking_price,
        cell: (r) => (
          <span className="itxt">
            {r.asking_price != null ? `$${(r.asking_price / 1e6).toFixed(1)}M` : '—'}
          </span>
        ),
      },
      {
        key: 'state',
        label: 'State',
        width: 70,
        accessor: (r) => r.state,
      },
      {
        key: 'last_activity_date',
        label: 'Last activity',
        width: 110,
        accessor: (r) => r.last_activity_date?.slice(0, 10),
      },
      {
        key: 'next_step',
        label: 'Next step',
        width: 180,
        accessor: (r) => r.next_step,
      },
    ],
    [investorCounts, rollups],
  )

  function patch(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k)
      else next.set(k, v)
    }
    setParams(next)
  }

  return (
    <>
      <div className="topbar">
        <h1>Deals</h1>
        <span style={{ color: 'var(--muted)' }}>
          {isLoading ? 'Loading…' : `${data?.total ?? 0} deals`}
        </span>
        <div className="spacer" />
        <ComingSoonButton>Bulk set status</ComingSoonButton>
        <ComingSoonButton>Bulk set stage</ComingSoonButton>
      </div>

      <div className={`view-body${dealId ? ' with-panel' : ''}`}>
        <FilterRail onReset={() => setParams(new URLSearchParams())}>
          <RailSection title="Search">
            <input
              type="search"
              value={search}
              placeholder="Deal or account…"
              onChange={(e) => patch({ q: e.target.value || null })}
            />
          </RailSection>
          <RailSection title="Saved views">
            <SavedViews tab="deals" />
          </RailSection>
          <RailSection title="Status">
            <label className="rail-check">
              <input
                type="checkbox"
                checked={includeClosed}
                onChange={(e) => patch({ closed: e.target.checked ? '1' : null })}
              />
              Include closed
            </label>
            <RailChecks
              options={statusOptions}
              selected={statuses}
              onToggle={(v) => {
                const set = new Set(statuses)
                if (set.has(v)) set.delete(v)
                else set.add(v)
                patch({ status: [...set].join(',') || null })
              }}
            />
          </RailSection>
        </FilterRail>

        <div className="grid-pane">
          <DataGrid
            rows={data?.rows || []}
            columns={columns}
            rowId={(r) => r.id}
            selectedIds={selected}
            activeId={dealId || null}
            onRowClick={(row) => navigate(`/deals/${row.id}?${params.toString()}`)}
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
            Investor counts load from live opps (fixed vs original Deals-first bug).
          </div>
        </div>

        {dealId && <DealDrawer dealId={dealId} />}
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
      <ComingSoonButton>Save view…</ComingSoonButton>
    </div>
  )
}
