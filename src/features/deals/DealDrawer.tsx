import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { ComingSoonButton, ReadOnlyNotice } from '@/components/ComingSoon'

export function DealDrawer({ dealId }: { dealId: string }) {
  const client = getCrmClient()

  const { data: deal } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => client.getDeal(dealId),
  })

  const { data: docs } = useQuery({
    queryKey: ['deal-docs', dealId],
    queryFn: () => client.listDealDocs(dealId),
    enabled: !!deal,
  })

  const { data: investors } = useQuery({
    queryKey: ['deal-investors', deal?.deal_name],
    queryFn: () => client.listDealInvestors(deal!.deal_name),
    enabled: !!deal,
  })

  const { data: timeline } = useQuery({
    queryKey: ['deal-timeline', dealId],
    queryFn: () => client.listDealTimeline(dealId),
    enabled: !!deal,
  })

  if (!deal) {
    return (
      <aside className="panel">
        <div className="empty">Deal not found</div>
      </aside>
    )
  }

  return (
    <aside className="panel" data-testid="deal-drawer">
      <div className="panel-header">
        <h2 className="title">{deal.deal_name}</h2>
        <div className="panel-meta">
          {deal.account_name} · {deal.status} · {deal.stage}
        </div>
      </div>
      <div className="panel-actions">
        <ComingSoonButton>Edit deal</ComingSoonButton>
        <ComingSoonButton>Suggest next step</ComingSoonButton>
        <ComingSoonButton>Add task</ComingSoonButton>
        <ComingSoonButton>Upload docs</ComingSoonButton>
        <ComingSoonButton>Re-index</ComingSoonButton>
        {deal.data_room_url_external && (
          <a className="btn" href={deal.data_room_url_external} target="_blank" rel="noreferrer">
            External data room ↗
          </a>
        )}
        <Link className="btn" to={`/deals/record/${deal.id}`}>
          Full record
        </Link>
      </div>
      <div className="panel-body">
        <ReadOnlyNotice compact />
        {[
          ['Asset', deal.asset_type],
          ['Location', [deal.city, deal.state].filter(Boolean).join(', ')],
          ['Asking', deal.asking_price != null ? `$${deal.asking_price.toLocaleString()}` : null],
          ['Cap rate', deal.cap_rate],
          ['MW', deal.total_capacity_mw],
          ['Next step', deal.next_step],
          ['Notes', deal.notes],
        ].map(([k, v]) => (
          <div className="field-row" key={String(k)}>
            <div className="k">{k}</div>
            <div className="v">{v == null || v === '' ? '—' : String(v)}</div>
          </div>
        ))}

        <h3 style={h3}>Investors ({investors?.length ?? 0})</h3>
        {(investors || []).slice(0, 40).map((o) => (
          <div key={o.d365_opportunity_id} style={{ padding: '4px 0' }}>
            <Link to={`/opps/${o.d365_opportunity_id}`}>{o.contact_name || o.topic}</Link>
            <span style={{ color: 'var(--muted)' }}> · {o.investor_status}</span>
          </div>
        ))}

        <h3 style={h3}>Tasks</h3>
        {(timeline?.tasks || []).map((t) => (
          <div key={t.id} style={{ padding: '4px 0' }}>
            {t.title}{' '}
            <span style={{ color: 'var(--muted)' }}>{t.due_at?.slice(0, 10)}</span>
          </div>
        ))}
        {!timeline?.tasks?.length && <div style={{ color: 'var(--muted)' }}>No open tasks</div>}

        <h3 style={h3}>Timeline</h3>
        {(timeline?.calls || []).map((c) => (
          <div key={c.id} style={{ padding: '4px 0' }}>
            Call · {c.subject} · {c.called_at?.slice(0, 10)}
          </div>
        ))}
        {(timeline?.emails || []).slice(0, 10).map((e) => (
          <div key={e.id} style={{ padding: '4px 0' }}>
            Email · {e.subject} · {e.received_at?.slice(0, 10)}
          </div>
        ))}

        <h3 style={h3}>Data room (read)</h3>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>
          Folder convention from original code: <code>{`"<deal name> (<deal id>)"`}</code> —
          confirm with Devon (CLAUDE.md said brackets).
        </p>
        {(docs || []).map((d) => (
          <div key={d.id} style={{ padding: '4px 0' }}>
            {d.name}{' '}
            <span style={{ color: 'var(--muted)' }}>
              {d.size_bytes != null ? `${Math.round(d.size_bytes / 1024)} KB` : ''}
            </span>
          </div>
        ))}
        {!docs?.length && <div style={{ color: 'var(--muted)' }}>No files</div>}
      </div>
    </aside>
  )
}

const h3: CSSProperties = {
  marginTop: 18,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}
