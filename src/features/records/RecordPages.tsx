import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { mapOppRow, resolveHealth } from '@/lib/opp-rules'
import { Avatar, CompanyTile, Icon } from '@/icons/Icon'
import { Btn, StatusDot, TagChip } from '@/ui/Button'

export function CompanyRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['account', id], queryFn: () => client.getAccount(id) })
  const [tab, setTab] = useState('Overview')
  return (
    <RecordLayout
      crumb={<Link to="/accounts">Accounts</Link>}
      title={data?.name || id}
      subtitle={data?.domain || data?.industry || ''}
      avatar={<CompanyTile name={data?.name} size="md" />}
      tabs={['Overview', 'Activity', 'People', 'Emails', 'Notes', 'Tasks', 'Files']}
      tab={tab}
      setTab={setTab}
      details={
        data && (
          <>
            <Attr icon="building" label="Name" value={data.name} />
            <Attr icon="link" label="Website" value={data.website} />
            <Attr icon="list" label="Industry" value={data.industry} />
            <Attr icon="layers" label="Location" value={[data.city, data.state].filter(Boolean).join(', ')} />
            <Attr icon="chart" label="Engagement" value={data.engagement_score} />
            <div className="ar ro">
              <div className="l">
                <Icon name="star" size="sm" />
                Criteria
              </div>
              <div className="v">
                {data.investor_criteria ? (
                  <div className="tags">
                    {String(data.investor_criteria)
                      .split(',')
                      .map((t) => (
                        <TagChip key={t} label={t.trim()} color="#8b5cf6" />
                      ))}
                  </div>
                ) : (
                  <span className="empty-v">—</span>
                )}
                <span className="muted" style={{ fontSize: 11, width: '100%' }}>
                  Sacred — write locked
                </span>
              </div>
            </div>
          </>
        )
      }
    >
      {!data && <Empty>Not found</Empty>}
      {data && tab === 'Overview' && (
        <div className="hl">
          <Kpi label="Engagement" value={data.engagement_score} />
          <Kpi label="Industry" value={data.industry} />
          <Kpi label="State" value={data.state} />
        </div>
      )}
      {data && tab === 'All Fields' && <AllFields row={data} />}
      {tab !== 'Overview' && <Stub />}
    </RecordLayout>
  )
}

export function PersonRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['contact', id], queryFn: () => client.getContact(id) })
  const { data: emails } = useQuery({
    queryKey: ['person-search-emails', data?.email],
    queryFn: () => client.globalSearch(data!.email || ''),
    enabled: !!data?.email,
  })
  const [tab, setTab] = useState('Activity')
  return (
    <RecordLayout
      crumb={<Link to="/contacts">People</Link>}
      title={data?.full_name || id}
      subtitle={
        data ? (
          <>
            {data.title}
            {data.account_name && (
              <>
                {' at '}
                <span className="chip rel">
                  <CompanyTile name={data.account_name} />
                  {data.account_name}
                </span>
              </>
            )}
          </>
        ) : (
          ''
        )
      }
      avatar={<Avatar name={data?.full_name} size="lg" />}
      actions={
        <>
          <Btn soon icon="mail">
            Draft reply
          </Btn>
          <Btn soon icon="star">
            Update investor criteria
          </Btn>
          <Btn soon icon="task">
            Create task
          </Btn>
          <Btn soon icon="send">
            Add to sequence
          </Btn>
        </>
      }
      tabs={['Overview', 'Activity', 'Emails', 'Calls', 'Company', 'Notes', 'Tasks', 'Files']}
      tab={tab}
      setTab={setTab}
      details={
        data && (
          <>
            <Attr icon="user" label="Name" value={data.full_name} />
            <Attr icon="mail" label="Email" value={data.email} />
            <Attr icon="building" label="Company" value={data.account_name} />
            <Attr icon="list" label="Job title" value={data.title} />
            <div className="ar ro">
              <div className="l">
                <Icon name="chart" size="sm" />
                Stage
              </div>
              <div className="v">
                {data.contact_stage ? (
                  <StatusDot color="#22c55e" label={data.contact_stage} />
                ) : (
                  <span className="empty-v">—</span>
                )}
              </div>
            </div>
            <Attr icon="phone" label="Phone" value={data.phone} />
          </>
        )
      }
    >
      {!data && <Empty>Not found</Empty>}
      {data && tab === 'Overview' && (
        <div className="hl">
          <Kpi label="Stage" value={data.contact_stage} />
          <Kpi label="Engagement" value={data.engagement_score} />
        </div>
      )}
      {data && tab === 'Activity' && (
        <>
          <div className="tch">
            <h3>Activity</h3>
            <Btn soon icon="task" size="sm">
              Add task
            </Btn>
          </div>
          <div className="grp">This month</div>
          {(emails?.emails || []).slice(0, 5).map((e) => (
            <div key={e.id} className="tli">
              <div className="ic">
                <Icon name="mail" size="sm" />
              </div>
              <div className="body">
                <div className="head">
                  <span className="who">
                    <b>{e.subject || '(no subject)'}</b>
                  </span>
                  <span className="when">{e.received_at?.slice(0, 10)}</span>
                </div>
                <div className="ecard" style={{ ['--bar' as string]: '#266df0' }}>
                  <div className="p">{e.body_preview}</div>
                </div>
              </div>
            </div>
          ))}
          {!emails?.emails?.length && (
            <div className="muted">No activity in fixtures for this contact.</div>
          )}
        </>
      )}
      {tab !== 'Overview' && tab !== 'Activity' && <Stub />}
    </RecordLayout>
  )
}

export function DealRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['deal', id], queryFn: () => client.getDeal(id) })
  const { data: investors } = useQuery({
    queryKey: ['deal-investors-rec', data?.deal_name],
    queryFn: () => client.listDealInvestors(data!.deal_name),
    enabled: !!data,
  })
  const [tab, setTab] = useState('Overview')
  return (
    <RecordLayout
      crumb={<Link to="/deals">Deals</Link>}
      title={data?.deal_name || id}
      subtitle={`${data?.status || ''} · ${data?.stage || ''}`}
      avatar={
        <span className="co md" style={{ background: '#f59e0b' }}>
          <Icon name="deal" />
        </span>
      }
      tabs={['Overview', 'Investors', 'Activity', 'Tasks', 'Files']}
      tab={tab}
      setTab={setTab}
      details={
        data && (
          <>
            <Attr icon="list" label="Status" value={data.status} />
            <Attr icon="kanban" label="Stage" value={data.stage} />
            <Attr
              icon="deal"
              label="Asking"
              value={data.asking_price != null ? `$${data.asking_price.toLocaleString()}` : null}
            />
            <Attr icon="note" label="Next step" value={data.next_step} />
          </>
        )
      }
    >
      {!data && <Empty>Not found</Empty>}
      {data && tab === 'Overview' && (
        <div className="hl">
          <Kpi
            label="Value"
            value={data.asking_price != null ? `$${(data.asking_price / 1e6).toFixed(1)}M` : '—'}
          />
          <Kpi label="Asset" value={data.asset_type} />
          <Kpi label="Location" value={[data.city, data.state].filter(Boolean).join(', ')} />
        </div>
      )}
      {data && tab === 'Investors' &&
        (investors || []).map((o) => (
          <div key={o.d365_opportunity_id} className="rli">
            <Avatar name={o.contact_name} />
            <Link to={`/opportunities/${o.d365_opportunity_id}`}>{o.topic}</Link>
          </div>
        ))}
      {tab !== 'Overview' && tab !== 'Investors' && <Stub />}
    </RecordLayout>
  )
}

export function OpportunityRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['opp', id], queryFn: () => client.getOpp(id) })
  const [tab, setTab] = useState('Overview')
  const mapped = data ? mapOppRow(data) : null
  return (
    <RecordLayout
      crumb={<Link to="/opps">Opps</Link>}
      title={mapped?.name || id}
      subtitle={`${mapped?.company || ''} · ${mapped?.dealName || ''}`}
      avatar={<Avatar name={mapped?.contactName || mapped?.name} size="lg" />}
      tabs={['Overview', 'Activity', 'Emails', 'Notes', 'Tasks', 'Files']}
      tab={tab}
      setTab={setTab}
      details={
        mapped && (
          <>
            <Attr icon="zap" label="Heat" value={mapped.heat} />
            <Attr icon="chart" label="Health" value={resolveHealth(data!)} />
            <Attr icon="list" label="Stage" value={mapped.stage} />
            <Attr icon="star" label="Interest" value={mapped.dealInterest} />
            <Attr icon="user" label="Contact" value={`${mapped.contactName} <${mapped.email}>`} />
          </>
        )
      }
    >
      {!data && <Empty>Not found</Empty>}
      {mapped && tab === 'Overview' && (
        <div className="hl">
          <Kpi label="Score" value={mapped.engagementScore} />
          <Kpi label="Urgency" value={mapped.replyUrgency} />
          <Kpi label="Days silent" value={mapped.daysSilent ?? 'never'} />
        </div>
      )}
      {tab !== 'Overview' && <Stub />}
    </RecordLayout>
  )
}

function RecordLayout({
  crumb,
  title,
  subtitle,
  avatar,
  actions,
  tabs,
  tab,
  setTab,
  details,
  children,
}: {
  crumb: ReactNode
  title: string
  subtitle: ReactNode
  avatar: ReactNode
  actions?: ReactNode
  tabs: string[]
  tab: string
  setTab: (t: string) => void
  details?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="view-fill" data-testid="record-page">
      <div className="top">
        <div className="crumb">
          {crumb}
          <span className="sep">/</span>
          <span>{title}</span>
        </div>
        <div className="right">
          <Btn soon icon="share">
            Share
          </Btn>
          <Btn soon icon="sparkle">
            Ask AI
          </Btn>
        </div>
      </div>
      <div className="rec">
        <div className="rl">
          <div className="rh">
            <div className="nm">
              {avatar}
              {title}
              <span className="star tip" data-tip="Coming soon (read-only)">
                <Icon name="star" />
              </span>
            </div>
            <div className="sub">{subtitle}</div>
            <div className="racts">
              {actions || (
                <>
                  <Btn soon icon="mail">
                    Draft reply
                  </Btn>
                  <Btn soon icon="task">
                    Create task
                  </Btn>
                  <Btn soon icon="phone">
                    Log a call
                  </Btn>
                </>
              )}
            </div>
          </div>
          <div className="rsec">
            <h4>Details</h4>
            {details}
          </div>
        </div>
        <div className="rr">
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                className={`tab${tab === t ? ' on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="tc">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Attr({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value?: unknown
}) {
  return (
    <div className="ar ro">
      <div className="l">
        <Icon name={icon} size="sm" />
        {label}
      </div>
      <div className="v">{value == null || value === '' ? <span className="empty-v">—</span> : String(value)}</div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="hlc">
      <div className="k">{label}</div>
      <div className="val">{value == null || value === '' ? '—' : String(value)}</div>
    </div>
  )
}

function AllFields({ row }: { row: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(row).map(([k, v]) => (
        <Attr key={k} icon="list" label={k} value={typeof v === 'object' ? JSON.stringify(v) : v} />
      ))}
    </>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="muted">{children}</div>
}

function Stub() {
  return <div className="muted">Read-only stub — remaining tab content wires up when writes are approved.</div>
}
