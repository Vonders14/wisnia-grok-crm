import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { Avatar, Icon } from '@/icons/Icon'
import { Btn } from '@/ui/Button'

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
      <aside className="drawer" data-testid="deal-drawer">
        <div className="muted" style={{ padding: 24 }}>
          Deal not found
        </div>
      </aside>
    )
  }

  return (
    <aside className="drawer" data-testid="deal-drawer">
      <div className="rh">
        <div className="nm">
          <span className="co md" style={{ background: '#f59e0b' }}>
            <Icon name="deal" />
          </span>
          {deal.deal_name}
        </div>
        <div className="sub">
          {deal.account_name} · {deal.status} · {deal.stage}
        </div>
        <div className="racts">
          <Btn soon icon="note">
            Edit deal
          </Btn>
          <Btn soon icon="sparkle">
            Suggest next step
          </Btn>
          <Btn soon icon="task">
            Add task
          </Btn>
          <Btn soon icon="upload">
            Upload docs
          </Btn>
          {deal.data_room_url_external && (
            <a className="btn" href={deal.data_room_url_external} target="_blank" rel="noreferrer">
              <Icon name="external" size="sm" />
              Data room
            </a>
          )}
          <Link className="btn" to={`/deals/record/${deal.id}`}>
            Full record
          </Link>
        </div>
      </div>

      <div className="rsec">
        <h4>Overview</h4>
        <Attr k="Asset" v={deal.asset_type} />
        <Attr k="Location" v={[deal.city, deal.state].filter(Boolean).join(', ')} />
        <Attr
          k="Asking"
          v={deal.asking_price != null ? `$${deal.asking_price.toLocaleString()}` : null}
        />
        <Attr k="Cap rate" v={deal.cap_rate} />
        <Attr k="MW" v={deal.total_capacity_mw} />
        <Attr k="Next step" v={deal.next_step} />
        <Attr k="Notes" v={deal.notes} />
      </div>

      <div className="rsec">
        <h4>
          Investors <span className="cnt">{investors?.length ?? 0}</span>
        </h4>
        {(investors || []).slice(0, 40).map((o) => (
          <div key={o.d365_opportunity_id} className="rli">
            <Avatar name={o.contact_name} />
            <Link to={`/opps/${o.d365_opportunity_id}`}>{o.contact_name || o.topic}</Link>
            <div className="r">{o.investor_status}</div>
          </div>
        ))}
      </div>

      <div className="rsec">
        <h4>Tasks</h4>
        {(timeline?.tasks || []).map((t) => (
          <div key={t.id} className="tk">
            <span className="circ" />
            <span className="tt">{t.title}</span>
            <span className="due">{t.due_at?.slice(0, 10)}</span>
          </div>
        ))}
        {!timeline?.tasks?.length && (
          <div className="muted" style={{ padding: '4px 8px' }}>
            No open tasks
          </div>
        )}
      </div>

      <div className="rsec">
        <h4>Timeline</h4>
        {(timeline?.calls || []).map((c) => (
          <div key={c.id} className="tli">
            <div className="ic" style={{ background: '#ecfdf5' }}>
              <Icon name="phone" size="sm" />
            </div>
            <div className="body">
              <div className="head">
                <span>
                  Call · {c.subject}
                </span>
                <span className="when">{c.called_at?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
        {(timeline?.emails || []).slice(0, 10).map((e) => (
          <div key={e.id} className="tli">
            <div className="ic">
              <Icon name="mail" size="sm" />
            </div>
            <div className="body">
              <div className="head">
                <span>{e.subject}</span>
                <span className="when">{e.received_at?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rsec">
        <h4>Data room</h4>
        <p className="muted" style={{ fontSize: 12, padding: '0 8px' }}>
          Folder: <code>{`"${deal.deal_name} (${deal.id})"`}</code>
        </p>
        {(docs || []).map((d) => (
          <div key={d.id} className="rli">
            <Icon name="file" size="sm" />
            {d.name}
            <div className="r">
              {d.size_bytes != null ? `${Math.round(d.size_bytes / 1024)} KB` : ''}
            </div>
          </div>
        ))}
        {!docs?.length && (
          <div className="muted" style={{ padding: '4px 8px' }}>
            No files
          </div>
        )}
      </div>
    </aside>
  )
}

function Attr({ k, v }: { k: string; v: unknown }) {
  return (
    <div className="ar ro">
      <div className="l">{k}</div>
      <div className="v">{v == null || v === '' ? <span className="empty-v">—</span> : String(v)}</div>
    </div>
  )
}
