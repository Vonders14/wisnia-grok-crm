import { useMemo, useState } from 'react'
import type { Deal } from '@/data/types'
import { Avatar, CompanyTile, Icon } from '@/icons/Icon'
import { TagChip } from '@/ui/Button'
import { toast } from '@/ui/Toaster'

const COLUMNS = ['Marketing', 'Underwriting', 'Closed', 'Lead', 'NDA Sent', 'Diligence', 'LOI']

const STAGE_COLOR: Record<string, string> = {
  Marketing: '#3b82f6',
  Underwriting: '#8b5cf6',
  Closed: '#22c55e',
  Lead: '#f59e0b',
  'NDA Sent': '#266df0',
  Diligence: '#a855f7',
  LOI: '#f97316',
}

export function DealsKanban({
  deals,
  onOpen,
}: {
  deals: Deal[]
  onOpen: (id: string) => void
}) {
  // Local-only stage overrides — never persisted / no Supabase writes.
  const [localStage, setLocalStage] = useState<Record<string, string>>({})

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {}
    for (const col of COLUMNS) map[col] = []
    map.Other = []
    for (const d of deals) {
      const stage = localStage[d.id] || d.stage || 'Other'
      if (!map[stage]) map[stage] = []
      map[stage].push(d)
    }
    return map
  }, [deals, localStage])

  const stages = COLUMNS.filter((c) => (byStage[c] || []).length || c === 'Marketing' || c === 'Underwriting' || c === 'Closed')

  return (
    <div className="kanban-host" data-testid="deals-kanban">
      <div className="board">
        {stages.map((stage) => {
          const cards = byStage[stage] || []
          const sum = cards.reduce((s, d) => s + (d.asking_price || 0), 0)
          return (
            <div
              key={stage}
              className="col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/deal-id')
                if (!id) return
                setLocalStage((prev) => ({ ...prev, [id]: stage }))
                toast('Stage moved locally (not saved — read-only)')
              }}
            >
              <div className="colh">
                <span className="dot" style={{ background: STAGE_COLOR[stage] || '#94a3b8' }} />
                {stage}
                <span className="c">{cards.length}</span>
                <span className="sum">${(sum / 1e6).toFixed(1)}M</span>
              </div>
              <div className="cards">
                {cards.map((d) => (
                  <div
                    key={d.id}
                    className="card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/deal-id', d.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => onOpen(d.id)}
                  >
                    <div className="t">
                      <Icon name="deal" size="sm" />
                      {d.deal_name}
                    </div>
                    <div className="r" style={{ fontWeight: 600, color: 'var(--t)' }}>
                      {d.asking_price != null ? `$${d.asking_price.toLocaleString()}` : '—'}
                    </div>
                    {d.account_name && (
                      <div className="r">
                        <CompanyTile name={d.account_name} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.account_name}
                        </span>
                      </div>
                    )}
                    <div className="tags" style={{ marginTop: 6 }}>
                      {d.asset_type && <TagChip label={d.asset_type} color="#8b5cf6" />}
                      {(d.city || d.state) && (
                        <TagChip
                          label={[d.city, d.state].filter(Boolean).join(', ')}
                          color="#64748b"
                        />
                      )}
                    </div>
                    <div className="f">
                      <span>
                        <Icon name="task" size="sm" />
                      </span>
                      <span>
                        <Icon name="mail" size="sm" />
                      </span>
                      <span>
                        <Icon name="file" size="sm" />
                      </span>
                      <span className="tis">
                        <Avatar name={d.account_name} />
                        {d.last_activity_date
                          ? `${Math.max(0, Math.floor((Date.now() - new Date(d.last_activity_date).getTime()) / 86400000))}d`
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="addcard tip"
                data-tip="Coming soon (read-only)"
                onClick={() => toast('Coming soon (read-only)')}
              >
                <Icon name="plus" size="sm" /> New deal
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
