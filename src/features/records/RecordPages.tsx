import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { ComingSoonButton, ReadOnlyNotice } from '@/components/ComingSoon'
import { mapOppRow, resolveHealth } from '@/lib/opp-rules'

export function CompanyRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['account', id], queryFn: () => client.getAccount(id) })
  const [tab, setTab] = useState('Overview')
  return (
    <RecordShell
      title={data?.name || id}
      subtitle="Company"
      tabs={['Overview', 'People', 'Deals', 'Emails', 'Notes', 'Tasks', 'All Fields']}
      tab={tab}
      setTab={setTab}
      back="/accounts"
    >
      {!data && <div className="empty">Not found</div>}
      {data && tab === 'Overview' && (
        <>
          <Field k="Website" v={data.website} />
          <Field k="Industry" v={data.industry} />
          <Field k="Location" v={[data.city, data.state].filter(Boolean).join(', ')} />
          <Field k="Engagement" v={data.engagement_score} />
          <Field
            k="Investor criteria"
            v={data.investor_criteria || '—'}
            hint="Sacred — edit only after lock toggle (write stubbed)."
          />
          <ComingSoonButton>Apollo enrich</ComingSoonButton>
          <ComingSoonButton>AI summary</ComingSoonButton>
        </>
      )}
      {data && tab === 'All Fields' && <AllFields row={data} />}
      {tab !== 'Overview' && tab !== 'All Fields' && (
        <div className="empty">Read-only stub — wire remaining tabs when writes/notes are approved.</div>
      )}
    </RecordShell>
  )
}

export function PersonRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['contact', id], queryFn: () => client.getContact(id) })
  const [tab, setTab] = useState('Overview')
  return (
    <RecordShell
      title={data?.full_name || id}
      subtitle="Person"
      tabs={['Overview', 'Company', 'Emails', 'Sequences', 'Notes', 'Tasks', 'All Fields']}
      tab={tab}
      setTab={setTab}
      back="/contacts"
    >
      {!data && <div className="empty">Not found</div>}
      {data && tab === 'Overview' && (
        <>
          <Field k="Email" v={data.email} />
          <Field k="Title" v={data.title} />
          <Field k="Account" v={data.account_name} />
          <Field k="Stage" v={data.contact_stage} />
          <Field k="Phone" v={data.phone} />
          {data.d365_account_id && (
            <Link to={`/companies/${data.d365_account_id}`}>Open company →</Link>
          )}
        </>
      )}
      {data && tab === 'All Fields' && <AllFields row={data} />}
      {tab !== 'Overview' && tab !== 'All Fields' && (
        <div className="empty">Read-only stub for this tab.</div>
      )}
    </RecordShell>
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
    <RecordShell
      title={data?.deal_name || id}
      subtitle="Deal"
      tabs={['Overview', 'Investors', 'Tasks', 'Files', 'All Fields']}
      tab={tab}
      setTab={setTab}
      back="/deals"
    >
      {!data && <div className="empty">Not found</div>}
      {data && tab === 'Overview' && (
        <>
          <Field k="Status" v={data.status} />
          <Field k="Stage" v={data.stage} />
          <Field k="Asking" v={data.asking_price} />
          <Field k="Next step" v={data.next_step} />
          <ComingSoonButton>Log a call</ComingSoonButton>
        </>
      )}
      {data && tab === 'Investors' &&
        (investors || []).map((o) => (
          <div key={o.d365_opportunity_id} style={{ padding: '6px 0' }}>
            <Link to={`/opportunities/${o.d365_opportunity_id}`}>{o.topic}</Link>
          </div>
        ))}
      {data && tab === 'All Fields' && <AllFields row={data} />}
    </RecordShell>
  )
}

export function OpportunityRecord() {
  const { id = '' } = useParams()
  const client = getCrmClient()
  const { data } = useQuery({ queryKey: ['opp', id], queryFn: () => client.getOpp(id) })
  const [tab, setTab] = useState('Overview')
  const mapped = data ? mapOppRow(data) : null
  return (
    <RecordShell
      title={mapped?.name || id}
      subtitle="Opportunity"
      tabs={['Overview', 'Emails', 'Notes', 'Tasks', 'All Fields']}
      tab={tab}
      setTab={setTab}
      back="/opps"
    >
      {!data && <div className="empty">Not found</div>}
      {mapped && tab === 'Overview' && (
        <>
          <Field k="Heat" v={mapped.heat} />
          <Field k="Health" v={resolveHealth(data!)} />
          <Field k="Stage" v={mapped.stage} />
          <Field k="Interest" v={mapped.dealInterest} />
          <Field k="Contact" v={`${mapped.contactName} <${mapped.email}>`} />
          <ComingSoonButton>Log a call</ComingSoonButton>
          <ComingSoonButton>Save note</ComingSoonButton>
        </>
      )}
      {data && tab === 'All Fields' && <AllFields row={data} />}
      {tab !== 'Overview' && tab !== 'All Fields' && (
        <div className="empty">Open the Opps side panel for email thread in this build.</div>
      )}
    </RecordShell>
  )
}

function RecordShell({
  title,
  subtitle,
  tabs,
  tab,
  setTab,
  back,
  children,
}: {
  title: string
  subtitle: string
  tabs: string[]
  tab: string
  setTab: (t: string) => void
  back: string
  children: ReactNode
}) {
  return (
    <div className="record-page">
      <ReadOnlyNotice compact />
      <div style={{ marginBottom: 8 }}>
        <Link to={back}>← Back</Link>
        <span style={{ color: 'var(--muted)', marginLeft: 10 }}>{subtitle}</span>
      </div>
      <h1>{title}</h1>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}

function Field({ k, v, hint }: { k: string; v: unknown; hint?: string }) {
  return (
    <div className="field-row">
      <div className="k">{k}</div>
      <div className="v">
        {v == null || v === '' ? '—' : String(v)}
        {hint && <div style={{ color: 'var(--muted)', fontSize: 11 }}>{hint}</div>}
      </div>
    </div>
  )
}

function AllFields({ row }: { row: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(row).map(([k, v]) => (
        <Field key={k} k={k} v={typeof v === 'object' ? JSON.stringify(v) : v} />
      ))}
    </>
  )
}
