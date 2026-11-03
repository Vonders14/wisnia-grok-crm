import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { HEALTH_COLOR, HEALTH_RULES } from '@/lib/enums'
import { mapOppRow, resolveHealth, type OppRaw } from '@/lib/opp-rules'
import { Avatar, Icon } from '@/icons/Icon'
import { Btn, StatusDot } from '@/ui/Button'

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
      <aside className="drawer" data-testid="opp-panel">
        <div className="empty-v" style={{ padding: 24 }}>
          Opportunity not found
        </div>
      </aside>
    )
  }

  const mapped = mapOppRow(opp)
  const health = resolveHealth(opp)

  return (
    <aside className="drawer" data-testid="opp-panel">
      <div className="rh">
        <div className="nm">
          <Avatar name={mapped.contactName || mapped.name} size="lg" />
          <div style={{ minWidth: 0 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{mapped.name}</div>
            <div className="sub" style={{ marginTop: 4 }}>
              <span className={`heat-dot ${mapped.heat}`} />
              {mapped.heat}
              {mapped.engagementScore != null && <span>· Score {mapped.engagementScore}/10</span>}
              {health && (
                <StatusDot color={HEALTH_COLOR[health] || '#64748b'} label={health} />
              )}
            </div>
          </div>
        </div>
        <div className="sub">
          {mapped.contactName} · {mapped.email}
        </div>
        <div className="sub">
          {mapped.company} · {mapped.dealName}
        </div>
        <div className="racts">
          <Btn soon icon="mail">
            Draft reply
          </Btn>
          <Btn soon icon="task">
            Create task
          </Btn>
          <Btn soon icon="send">
            Add to sequence
          </Btn>
          <Btn soon icon="phone">
            Log call
          </Btn>
          <Btn soon>Mark dead</Btn>
          <a className="btn" href="https://mail.missiveapp.com/" target="_blank" rel="noreferrer">
            <Icon name="external" size="sm" />
            Missive
          </a>
          <Link className="btn" to={`/opportunities/${oppId}`}>
            Full record
          </Link>
        </div>
      </div>

      <div className="rsec">
        <h4>Details</h4>
        <Attr label="Stage" icon="list" value={mapped.stage} />
        <Attr label="Interest" icon="star" value={mapped.dealInterest} />
        <Attr
          label="Contact stage"
          icon="user"
          value={opp.contact_stage}
          hint="Lifetime stage is a hint only"
        />
        <Attr label="Next steps" icon="note" value={mapped.nextSteps} />
        <Attr label="Urgency" icon="clock" value={mapped.replyUrgency} />
        <Attr
          label="Days silent"
          icon="clock"
          value={mapped.daysSilent == null ? 'never replied' : String(mapped.daysSilent)}
        />
        <Attr label="Intent" icon="sparkle" value={mapped.intent} />
        {health && <Attr label="Health rule" icon="chart" value={HEALTH_RULES[health]} />}
      </div>

      <div className="rsec">
        <h4>
          Email thread <span className="cnt">{emails?.length ?? 0}</span>
        </h4>
        {!emails?.length && <div className="muted" style={{ padding: '4px 8px' }}>No emails in scope</div>}
        {emails?.map((e) => (
          <div key={e.id} className="ecard" style={{ margin: '0 6px 8px' }}>
            <div className="s">{e.subject || '(no subject)'}</div>
            <div className="m">
              {e.direction} · {e.received_at?.slice(0, 16)?.replace('T', ' ')}
            </div>
            <div className="p">{e.body_preview}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Btn soon size="sm">
                Move
              </Btn>
              <Btn soon size="sm">
                Unlink
              </Btn>
            </div>
          </div>
        ))}
      </div>

      <div className="rsec">
        <h4>
          Tasks <span className="cnt">{tasks?.length ?? 0}</span>
        </h4>
        {(tasks || []).map((t) => (
          <div key={t.id} className="tk">
            <span className="circ" />
            <span className="tt">{t.title}</span>
            <span className="due">{t.due_at?.slice(0, 10)}</span>
          </div>
        ))}
        {!tasks?.length && <div className="muted" style={{ padding: '4px 8px' }}>No open tasks</div>}
      </div>

      <div className="rsec">
        <h4>
          Calls <span className="cnt">{calls?.length ?? 0}</span>
        </h4>
        {(calls || []).map((c) => (
          <div key={c.id} className="note">
            <div className="h">{c.subject}</div>
            <div className="p">{c.notes}</div>
          </div>
        ))}
      </div>

      <div className="rsec">
        <h4>Compose</h4>
        <textarea className="pin" disabled placeholder="Compose disabled in read-only build" style={{ minHeight: 72 }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <Btn soon icon="sparkle">
            AI Draft
          </Btn>
          <Btn soon icon="send">
            Send
          </Btn>
          <Btn soon>Save draft</Btn>
        </div>
      </div>
    </aside>
  )
}

function Attr({
  label,
  icon,
  value,
  hint,
}: {
  label: string
  icon: string
  value?: string | null
  hint?: string
}) {
  return (
    <div className="ar ro">
      <div className="l">
        <Icon name={icon} size="sm" />
        {label}
      </div>
      <div className="v">
        {value || <span className="empty-v">—</span>}
        {hint && <span className="muted" style={{ fontSize: 11, width: '100%' }}>{hint}</span>}
      </div>
    </div>
  )
}
