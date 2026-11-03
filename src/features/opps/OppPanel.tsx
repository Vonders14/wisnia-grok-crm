import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { ComingSoonButton, ReadOnlyNotice } from '@/components/ComingSoon'
import { HEALTH_COLOR, HEALTH_RULES } from '@/lib/enums'
import { mapOppRow, resolveHealth, type OppRaw } from '@/lib/opp-rules'

export function OppPanel({ oppId, raw }: { oppId: string; raw?: OppRaw }) {
  const client = getCrmClient()

  const { data: opp } = useQuery({
    queryKey: ['opp', oppId],
    queryFn: () => client.getOpp(oppId),
    initialData: raw,
  })

  const { data: emails } = useQuery({
    queryKey: ['opp-emails', oppId],
    queryFn: () => client.listOppEmails(oppId),
  })

  const { data: tasks } = useQuery({
    queryKey: ['opp-tasks', oppId],
    queryFn: () => client.listOppTasks(oppId),
  })

  const { data: calls } = useQuery({
    queryKey: ['opp-calls', oppId],
    queryFn: () => client.listOppCalls(oppId),
  })

  if (!opp) {
    return (
      <aside className="panel">
        <div className="empty">Opportunity not found</div>
      </aside>
    )
  }

  const mapped = mapOppRow(opp)
  const health = resolveHealth(opp)
  const healthColor = health ? HEALTH_COLOR[health] : undefined

  return (
    <aside className="panel" data-testid="opp-panel">
      <div className="panel-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span className={`pill pill-${mapped.heat}`}>{mapped.heat}</span>
          {health && (
            <span
              className="pill"
              style={{
                color: healthColor,
                background: (healthColor || '') + '1a',
                borderColor: (healthColor || '') + '33',
              }}
              title={HEALTH_RULES[health]}
            >
              {health}
            </span>
          )}
          {mapped.engagementScore != null && (
            <span style={{ color: 'var(--muted)' }}>Score {mapped.engagementScore}/10</span>
          )}
        </div>
        <h2 className="title">{mapped.name}</h2>
        <div className="panel-meta">
          {mapped.contactName} · {mapped.email}
          <br />
          {mapped.company} · {mapped.dealName}
        </div>
      </div>

      <div className="panel-actions">
        <ComingSoonButton>Reply / AI draft</ComingSoonButton>
        <ComingSoonButton>Snooze</ComingSoonButton>
        <ComingSoonButton>+ Task</ComingSoonButton>
        <ComingSoonButton>Log call</ComingSoonButton>
        <ComingSoonButton>Log note</ComingSoonButton>
        <ComingSoonButton>Mark dead</ComingSoonButton>
        <ComingSoonButton>Save changes</ComingSoonButton>
        <a className="btn" href={`https://mail.missiveapp.com/`} target="_blank" rel="noreferrer">
          Missive ↗
        </a>
        <Link className="btn" to={`/opportunities/${oppId}`}>
          Full record
        </Link>
      </div>

      <div className="panel-body">
        <ReadOnlyNotice compact />

        <div className="field-row">
          <div className="k">Stage</div>
          <div className="v">{mapped.stage || '—'}</div>
        </div>
        <div className="field-row">
          <div className="k">Interest</div>
          <div className="v">{mapped.dealInterest || '—'}</div>
        </div>
        <div className="field-row">
          <div className="k">Contact stage</div>
          <div className="v">
            {opp.contact_stage || '—'}
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
              Lifetime stage is a hint only — per-opp contact_stage is never overwritten.
            </div>
          </div>
        </div>
        <div className="field-row">
          <div className="k">Next steps</div>
          <div className="v">{mapped.nextSteps || '—'}</div>
        </div>
        <div className="field-row">
          <div className="k">Urgency</div>
          <div className="v">{mapped.replyUrgency}</div>
        </div>
        <div className="field-row">
          <div className="k">Days silent</div>
          <div className="v">
            {mapped.daysSilent == null ? 'never replied' : mapped.daysSilent}
          </div>
        </div>
        <div className="field-row">
          <div className="k">Intent</div>
          <div className="v">{mapped.intent || '—'}</div>
        </div>
        <div className="field-row">
          <div className="k">AI summary</div>
          <div className="v">{mapped.aiSummary || '—'}</div>
        </div>
        {health && (
          <div className="field-row">
            <div className="k">Health rule</div>
            <div className="v">{HEALTH_RULES[health]}</div>
          </div>
        )}

        <h3 style={{ marginTop: 18, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Email thread
        </h3>
        {!emails?.length && <div className="empty" style={{ padding: 8 }}>No emails in scope</div>}
        {emails?.map((e) => (
          <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--cg-border-faint)' }}>
            <div style={{ fontWeight: 600 }}>{e.subject || '(no subject)'}</div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
              {e.direction || ''} · {e.from_email} → {e.to_email} ·{' '}
              {e.received_at?.slice(0, 16)?.replace('T', ' ')}
            </div>
            <div style={{ marginTop: 4 }}>{e.body_preview}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <ComingSoonButton>Move</ComingSoonButton>
              <ComingSoonButton>Reassign</ComingSoonButton>
              <ComingSoonButton>Unlink</ComingSoonButton>
            </div>
          </div>
        ))}

        <h3 style={{ marginTop: 18, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Tasks
        </h3>
        {!tasks?.length && <div style={{ color: 'var(--muted)' }}>No open tasks</div>}
        {tasks?.map((t) => (
          <div key={t.id} style={{ padding: '6px 0' }}>
            {t.title}{' '}
            <span style={{ color: 'var(--muted)' }}>{t.due_at?.slice(0, 10)}</span>
          </div>
        ))}

        <h3 style={{ marginTop: 18, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Calls
        </h3>
        {!calls?.length && <div style={{ color: 'var(--muted)' }}>No calls</div>}
        {calls?.map((c) => (
          <div key={c.id} style={{ padding: '6px 0' }}>
            <strong>{c.subject}</strong>
            <div style={{ color: 'var(--muted)' }}>{c.notes}</div>
          </div>
        ))}

        <h3 style={{ marginTop: 18, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Compose
        </h3>
        <textarea disabled placeholder="Compose disabled in read-only build" style={{ width: '100%', height: 80 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <ComingSoonButton>AI Draft</ComingSoonButton>
          <ComingSoonButton>Send</ComingSoonButton>
          <ComingSoonButton>Save draft</ComingSoonButton>
        </div>
      </div>
    </aside>
  )
}
