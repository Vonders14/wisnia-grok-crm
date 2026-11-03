import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { DataGrid } from '@/grid/DataGrid'
import type { GridColumn } from '@/grid/types'
import type { Deal } from '@/data/types'
import { CompanyTile, Icon } from '@/icons/Icon'
import { Btn, StatusDot, TagChip } from '@/ui/Button'
import { TopBar, ViewBar } from '@/ui/ViewChrome'
import { BulkBar } from '@/ui/BulkBar'
import { exportCsv } from '@/lib/csv'
import { toast } from '@/ui/Toaster'
import { DealDrawer } from './DealDrawer'
import { DealsKanban } from './DealsKanban'

const STAGE_COLOR: Record<string, string> = {
  Marketing: '#3b82f6',
  Underwriting: '#8b5cf6',
  Closed: '#22c55e',
  Lead: '#f59e0b',
  'NDA Sent': '#266df0',
  Diligence: '#a855f7',
  LOI: '#f97316',
}

export function DealsPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const client = getCrmClient()
  const search = params.get('q') || ''
  const includeClosed = params.get('closed') === '1'
  const layout = params.get('layout') === 'board' ? 'board' : 'table'
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

  const columns: GridColumn<Deal>[] = useMemo(
    () => [
      {
        key: 'deal_name',
        label: 'Deal',
        width: 220,
        sticky: true,
        accessor: (r) => r.deal_name,
        cell: (r) => (
          <div className="rn">
            <span className="oic" style={{ background: '#f59e0b' }}>
              <Icon name="deal" size="sm" />
            </span>
            <Link to={`/deals/${r.id}`} onClick={(e) => e.stopPropagation()}>
              {r.deal_name}
            </Link>
          </div>
        ),
      },
      {
        key: 'stage',
        label: 'Stage',
        width: 130,
        accessor: (r) => r.stage,
        cell: (r) =>
          r.stage ? (
            <StatusDot color={STAGE_COLOR[r.stage] || '#94a3b8'} label={r.stage} />
          ) : (
            <span className="empty-v">—</span>
          ),
      },
      {
        key: 'asking_price',
        label: 'Value',
        width: 120,
        align: 'right',
        accessor: (r) => r.asking_price,
        cell: (r) => (
          <span className="num" style={{ fontWeight: 600 }}>
            {r.asking_price != null ? `$${r.asking_price.toLocaleString()}` : '—'}
          </span>
        ),
      },
      {
        key: 'asset_type',
        label: 'Asset',
        width: 120,
        accessor: (r) => r.asset_type,
        cell: (r) =>
          r.asset_type ? <TagChip label={r.asset_type} color="#8b5cf6" /> : <span className="empty-v">—</span>,
      },
      {
        key: 'location',
        label: 'Location',
        width: 120,
        accessor: (r) => [r.city, r.state].filter(Boolean).join(', '),
      },
      {
        key: 'account_name',
        label: 'Developer',
        width: 180,
        accessor: (r) => r.account_name,
        cell: (r) =>
          r.account_name ? (
            <span className="chip rel">
              <CompanyTile name={r.account_name} />
              {r.account_name}
            </span>
          ) : (
            <span className="empty-v">—</span>
          ),
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
        accessor: (r) => rollups?.find((x) => x.deal_name === r.deal_name)?.campaigns ?? 0,
      },
      {
        key: 'status',
        label: 'Status',
        width: 110,
        accessor: (r) => r.status,
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

  const chips = [
    includeClosed ? { id: 'closed', label: 'Include closed' } : null,
    ...statuses.map((s) => ({ id: `status:${s}`, label: s })),
    search ? { id: 'q', label: `Search: ${search}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="view-fill">
      <TopBar icon="deal" iconColor="#f59e0b" title="Deals" />
      <ViewBar
        viewLabel="All Deals"
        viewIcon="deal"
        viewColor="#f59e0b"
        count={data?.total}
        chips={chips}
        onClearChip={(id) => {
          if (id === 'closed') patch({ closed: null })
          if (id === 'q') patch({ q: null })
          if (id.startsWith('status:'))
            patch({ status: statuses.filter((s) => s !== id.slice(7)).join(',') || null })
        }}
        sortOptions={[
          { key: 'last_activity_date', label: 'Last activity' },
          { key: 'asking_price', label: 'Value' },
          { key: 'deal_name', label: 'Name' },
        ]}
        onSortPick={() => undefined}
        filterSlot={
          <div style={{ padding: 6 }}>
            <input
              className="pin"
              placeholder="Deal or account…"
              value={search}
              onChange={(e) => patch({ q: e.target.value || null })}
            />
            <label className="mi" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={includeClosed}
                onChange={(e) => patch({ closed: e.target.checked ? '1' : null })}
              />
              Include closed
            </label>
          </div>
        }
        layoutToggle={
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn
              icon="table"
              variant={layout === 'table' ? 'active' : 'default'}
              onClick={() => patch({ layout: null })}
            >
              Table
            </Btn>
            <Btn
              icon="kanban"
              variant={layout === 'board' ? 'active' : 'default'}
              onClick={() => patch({ layout: 'board' })}
            >
              Board
            </Btn>
          </div>
        }
        primaryLabel="New deal"
        extra={isLoading ? <span className="muted">Loading…</span> : null}
      />

      <div className="view-split">
        <div className="grid-host">
          {layout === 'board' ? (
            <DealsKanban
              deals={data?.rows || []}
              onOpen={(id) => navigate(`/deals/${id}?${params.toString()}`)}
            />
          ) : (
            <>
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
                onToggleSelectAll={() => {
                  const rows = data?.rows || []
                  setSelected((prev) => {
                    if (rows.every((r) => prev.has(r.id))) return new Set()
                    return new Set(rows.map((r) => r.id))
                  })
                }}
              />
              <BulkBar
                count={selected.size}
                onClear={() => setSelected(new Set())}
                onExport={() => {
                  const rows = (data?.rows || [])
                    .filter((r) => selected.has(r.id))
                    .map((r) => ({
                      id: r.id,
                      deal_name: r.deal_name,
                      status: r.status,
                      stage: r.stage,
                      asking_price: r.asking_price,
                      account_name: r.account_name,
                    }))
                  exportCsv('deals-selected.csv', rows)
                  toast(`Exported ${rows.length} deals`)
                }}
              />
            </>
          )}
        </div>
        {dealId && <DealDrawer dealId={dealId} />}
      </div>
    </div>
  )
}
