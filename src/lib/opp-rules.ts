/**
 * Opportunity mapping + display rules from wisnia-crm.html (§6 of SPEC).
 */

export type Heat = 'hot' | 'warm' | 'cold'

export type Urgency = 'today' | 'this week' | 'this month' | 'none'

export interface OppRaw {
  d365_opportunity_id: string
  topic?: string | null
  account_name?: string | null
  contact_name?: string | null
  contact_email?: string | null
  deal_name?: string | null
  investor_status?: string | null
  deal_interest?: string | null
  next_steps?: string | null
  contact_stage?: string | null
  is_dead?: boolean | null
  dead_at?: string | null
  wisai_heat?: string | null
  wisai_score?: number | null
  wisai_intent?: string | null
  wisai_reply_urgency?: string | null
  wisai_summary?: string | null
  wisai_next_step?: string | null
  wisai_scored_at?: string | null
  last_inbound_at?: string | null
  last_outbound_at?: string | null
  last_call_at?: string | null
  days_since_inbound?: number | null
  days_since_outbound?: number | null
  followups_no_reply?: number | null
  opportunity_health?: string | null
  opportunity_at_risk?: boolean | null
  updated_at?: string | null
  created_at?: string | null
  d365_modified_on?: string | null
  d365_account_id?: string | null
  d365_contact_id?: string | null
  account_website?: string | null
  data_room_link?: string | null
  nda_link?: string | null
  is_signed?: boolean | null
  snoozed_until?: string | null
  last_email_preview?: string | null
  last_email_preview_at?: string | null
  [key: string]: unknown
}

export interface MappedOpp {
  id: string
  _raw: OppRaw
  name: string
  contactName: string | null | undefined
  company: string | null | undefined
  email: string | null | undefined
  dealName: string | null | undefined
  stage: string | null | undefined
  dealInterest: string | null | undefined
  nextSteps: string | null | undefined
  heat: Heat
  engagementScore: number | null
  replyUrgency: Urgency
  awaitingReply: boolean
  lastInbound: string | null | undefined
  lastOutbound: string | null | undefined
  daysSilent: number | null
  daysSinceOutbound: number | null
  lastModified: string | null
  intent: string
  aiSummary: string
  estimatedRevenue: number
}

export function heatFromAi(h: string | null | undefined): Heat {
  if (!h) return 'cold'
  return (
    ({ Hot: 'hot', Warm: 'warm', Engaged: 'warm', Touched: 'cold', Cold: 'cold', Dead: 'cold' } as const)[
      h as 'Hot'
    ] ?? 'cold'
  )
}

/** Display score is round(wisai_score / 10) clamped to 1–10. */
export function wisaiScore10(v: number | null | undefined): number | null {
  if (v == null) return null
  return Math.max(1, Math.min(10, Math.round(Number(v) / 10)))
}

export function mapWisaiUrgency(u: string | null | undefined): Urgency | null {
  if (!u) return null
  return (
    ({ Today: 'today', 'This Week': 'this week', 'This Month': 'this month', None: 'none' } as const)[
      u as 'Today'
    ] ?? null
  )
}

function daysVal(iso: string | null | undefined): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function deriveUrgency(o: {
  awaitingReply: boolean
  heat: Heat
  lastModified: string | null
}): Urgency {
  if (o.awaitingReply || o.heat === 'hot') return 'today'
  if (o.heat === 'warm') return 'this week'
  if (o.lastModified && daysVal(o.lastModified) > 30) return 'none'
  return 'this month'
}

export function mapOppRow(r: OppRaw, dealPrices: Record<string, number> = {}): MappedOpp {
  const heat = heatFromAi(r.wisai_heat)
  const sc = wisaiScore10(r.wisai_score)
  const _ts = [r.last_inbound_at, r.last_outbound_at, r.last_call_at]
    .filter(Boolean)
    .map((x) => new Date(x as string).getTime())
  const lastTouch = _ts.length ? new Date(Math.max(..._ts)).toISOString() : null
  const last = lastTouch || r.updated_at || r.d365_modified_on || r.created_at || null
  const intent = r.wisai_intent || ''
  const awaitingReply = !!(
    r.last_inbound_at &&
    (!r.last_outbound_at || new Date(r.last_inbound_at) > new Date(r.last_outbound_at))
  )
  const o: MappedOpp = {
    id: r.d365_opportunity_id,
    _raw: r,
    name: r.topic || r.account_name || '(no name)',
    contactName: r.contact_name,
    company: r.account_name,
    email: r.contact_email,
    dealName: r.deal_name,
    stage: r.investor_status,
    dealInterest: r.deal_interest,
    nextSteps: r.next_steps,
    heat,
    engagementScore: sc,
    replyUrgency: mapWisaiUrgency(r.wisai_reply_urgency) || 'this month',
    awaitingReply,
    lastInbound: r.last_inbound_at,
    lastOutbound: r.last_outbound_at,
    daysSilent: r.days_since_inbound != null ? Number(r.days_since_inbound) : null,
    daysSinceOutbound:
      r.days_since_outbound != null
        ? Number(r.days_since_outbound)
        : r.last_outbound_at
          ? daysVal(r.last_outbound_at)
          : null,
    lastModified: last,
    intent,
    aiSummary: (r.wisai_next_step || r.wisai_summary || '') as string,
    estimatedRevenue: (r.deal_name && dealPrices[r.deal_name]) || 0,
  }
  if (!mapWisaiUrgency(r.wisai_reply_urgency)) o.replyUrgency = deriveUrgency(o)
  return o
}

/**
 * Health display rules (SPEC §3.1 / §6). Prefer DB `opportunity_health` when present;
 * otherwise derive for fixtures that omit the column.
 */
export function resolveHealth(r: OppRaw): string | null {
  if (r.opportunity_health) return r.opportunity_health
  if (r.deal_interest === 'Not Interested/Dead' || r.is_dead) return 'Dead'
  const di = r.days_since_inbound
  const doo = r.days_since_outbound
  const followups = Number(r.followups_no_reply ?? 0)
  const repliedLast =
    !!r.last_inbound_at &&
    (!r.last_outbound_at || new Date(r.last_inbound_at) > new Date(r.last_outbound_at))
  if (di != null && di <= 7 && repliedLast) return 'Hot'
  if (repliedLast && di != null && di >= 8) return 'Waiting on Us'
  if (!repliedLast && doo != null && doo >= 8 && doo <= 21 && followups >= 1 && followups <= 2)
    return 'Going Quiet'
  if (followups >= 3 || (doo != null && doo >= 22)) return 'Cold'
  return null
}

/** Exact-match helper so "Interested" does not match "Not Interested/Dead". */
export function exactInterestMatch(
  value: string | null | undefined,
  filter: string,
): boolean {
  return (value ?? '') === filter
}

/** Dead rows are hidden via is_dead not true. */
export function isLiveOpp(r: OppRaw): boolean {
  return r.is_dead !== true
}

export interface MissiveEmail {
  id: string
  d365_opportunity_id?: string | null
  from_email?: string | null
  to_email?: string | null
  subject?: string | null
  body_preview?: string | null
  received_at?: string | null
  email_class?: string | null
  missive_conversation_id?: string | null
  direction?: string | null
}

/**
 * Email-thread scoping: tagged emails first; contact fallback only when the
 * contact has exactly one live opp; never show emails claimed by another opp.
 */
export function scopeOppEmails(opts: {
  oppId: string
  contactEmail: string | null | undefined
  tagged: MissiveEmail[]
  contactEmails: MissiveEmail[]
  liveOppCountForContact: number
}): MissiveEmail[] {
  if (opts.tagged.length) return opts.tagged
  if (!opts.contactEmail) return []
  if (opts.liveOppCountForContact > 1) return []
  return opts.contactEmails.filter(
    (e) => !e.d365_opportunity_id || e.d365_opportunity_id === opts.oppId,
  )
}

/** Sequence bump only from blank or "New - Need to Send". */
export function canBumpToAddedToSequence(status: string | null | undefined): boolean {
  return !status || status === 'New - Need to Send'
}

export function investorStatusDot(s: string | null | undefined): string {
  s = s || ''
  if (s.startsWith('EN -')) return '#94a3b8'
  if (/Under Contract|LOI Submitted/.test(s)) return '#059669'
  if (/Pricing Sent/.test(s)) return '#d97706'
  if (/Engaged|Viewed Data Room|Sent Data Room/.test(s)) return '#db2777'
  if (/Executed NDA|Sent OM|Sent NDA|Clicked NDA/.test(s)) return '#7c3aed'
  if (s === 'Replied') return '#0d9488'
  if (s === 'Sent Email') return '#2563eb'
  if (s === 'Added to Sequence') return '#60a5fa'
  return '#3b82f6'
}

export function isClosedDealStatus(status: string | null | undefined): boolean {
  const s = (status || '').toLowerCase()
  return /closed|lost|dead|won|cancelled/.test(s)
}
