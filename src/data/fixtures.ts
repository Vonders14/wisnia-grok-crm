/**
 * Clearly fake fixture dataset for local/dev/CI.
 * No real customer names, emails, or production ids.
 */
import type {
  Account,
  Call,
  CampaignRollup,
  Contact,
  Deal,
  DealDoc,
  MissiveEmail,
  OppRaw,
  SavedView,
  Task,
} from './types'

const FAKE = 'example.test'

export const FIXTURE_DEALS: Deal[] = [
  {
    id: 'deal-solar-alpha',
    deal_name: 'Fake Solar Alpha',
    account_name: 'Demo Sponsor LLC',
    status: 'Active',
    stage: 'Marketing',
    asset_type: 'Solar',
    city: 'Austin',
    state: 'TX',
    asking_price: 12_500_000,
    cap_rate: 7.2,
    total_capacity_mw: 42,
    commission: 250_000,
    next_step: 'Send OM to shortlist',
    data_room_url_external: 'https://sharepoint.example.test/fake-solar-alpha',
    notes: 'Fixture deal — not real.',
    industry: 'Energy',
    investment_strategy: 'Core+',
    tenancy: 'NNN',
    last_activity_date: '2026-10-28T15:00:00.000Z',
  },
  {
    id: 'deal-wind-beta',
    deal_name: 'Fake Wind Beta',
    account_name: 'Demo Wind Holdco',
    status: 'Active',
    stage: 'Underwriting',
    asset_type: 'Wind',
    city: 'Des Moines',
    state: 'IA',
    asking_price: 28_000_000,
    cap_rate: 6.5,
    total_capacity_mw: 110,
    next_step: 'Schedule IC',
    last_activity_date: '2026-10-20T12:00:00.000Z',
  },
  {
    id: 'deal-storage-gamma',
    deal_name: 'Fake Storage Gamma',
    account_name: 'Demo BESS Co',
    status: 'Closed - Won',
    stage: 'Closed',
    asset_type: 'Storage',
    city: 'Phoenix',
    state: 'AZ',
    asking_price: 9_000_000,
    last_activity_date: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'deal-hydro-delta',
    deal_name: 'Fake Hydro Delta',
    account_name: 'Demo Hydro Partners',
    status: 'Active',
    stage: 'Marketing',
    asset_type: 'Hydro',
    city: 'Portland',
    state: 'OR',
    asking_price: 15_000_000,
    last_activity_date: '2026-10-30T09:00:00.000Z',
  },
]

export const FIXTURE_ACCOUNTS: Account[] = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1
  return {
    d365_account_id: `acct-fake-${String(n).padStart(3, '0')}`,
    name: `Fake Investor ${n} Capital`,
    website: `http://www.fake-investor-${n}.${FAKE}`,
    domain: `fake-investor-${n}.${FAKE}`,
    industry: n % 3 === 0 ? 'Family Office' : n % 3 === 1 ? 'PE' : 'REIT',
    state: ['TX', 'NY', 'CA', 'IL', 'FL'][n % 5],
    city: ['Austin', 'New York', 'San Francisco', 'Chicago', 'Miami'][n % 5],
    engagement_score: (n * 7) % 100,
    investor_criteria: n % 4 === 0 ? 'Solar 5–50MW, TX/OK preferred (FIXTURE)' : null,
    apollo_id: `apollo-acct-fake-${n}`,
    updated_at: `2026-10-${String((n % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
    created_at: '2026-01-15T12:00:00.000Z',
  }
})

export const FIXTURE_CONTACTS: Contact[] = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1
  const acct = FIXTURE_ACCOUNTS[(n - 1) % FIXTURE_ACCOUNTS.length]
  return {
    d365_contact_id: `cont-fake-${String(n).padStart(3, '0')}`,
    full_name: `Pat Fake${n}`,
    email: `pat.fake${n}@fake-investor-${((n - 1) % FIXTURE_ACCOUNTS.length) + 1}.${FAKE}`,
    title: n % 2 === 0 ? 'VP Investments' : 'Analyst',
    d365_account_id: acct.d365_account_id,
    account_name: acct.name,
    phone: `+1-555-010${String(n).padStart(2, '0')}`,
    contact_stage: ['4. Interested', '3. Replied', '2. Approaching', '1. Cold'][n % 4],
    engagement_score: (n * 11) % 100,
    apollo_id: `apollo-cont-fake-${n}`,
    updated_at: `2026-10-${String((n % 28) + 1).padStart(2, '0')}T14:00:00.000Z`,
    created_at: '2026-02-01T12:00:00.000Z',
  }
})

function makeOpp(i: number): OppRaw {
  const n = i + 1
  const contact = FIXTURE_CONTACTS[(n - 1) % FIXTURE_CONTACTS.length]
  const deal = FIXTURE_DEALS[n % 3] // rotate active-ish deals
  const heats = ['Hot', 'Warm', 'Engaged', 'Cold', null] as const
  const interests = ['Interested', 'Asked a Question', 'Provided Investment Criteria', null] as const
  const statuses = [
    'New - Need to Send',
    'Sent Email',
    'Replied',
    'Viewed Data Room',
    'LOI Submitted',
    'Added to Sequence',
  ] as const
  const isDead = n % 17 === 0
  const daysIn = n % 5 === 0 ? null : (n * 3) % 40
  const daysOut = (n * 5) % 35
  const repliedLast = n % 3 === 0
  const lastIn = repliedLast
    ? `2026-10-${String(Math.max(1, 28 - (daysIn ?? 0))).padStart(2, '0')}T16:00:00.000Z`
    : n % 7 === 0
      ? `2026-09-15T12:00:00.000Z`
      : null
  const lastOut = `2026-10-${String(Math.max(1, 28 - daysOut)).padStart(2, '0')}T10:00:00.000Z`

  let health: string | null = null
  if (isDead) health = 'Dead'
  else if (daysIn != null && daysIn <= 7 && repliedLast) health = 'Hot'
  else if (repliedLast && daysIn != null && daysIn >= 8) health = 'Waiting on Us'
  else if (!repliedLast && daysOut >= 8 && daysOut <= 21) health = 'Going Quiet'
  else if (daysOut >= 22) health = 'Cold'

  return {
    d365_opportunity_id: `opp-fake-${String(n).padStart(4, '0')}`,
    topic: `${contact.account_name} · ${deal.deal_name}`,
    account_name: contact.account_name,
    contact_name: contact.full_name,
    contact_email: contact.email,
    deal_name: deal.deal_name,
    investor_status: isDead ? 'Sent Email' : statuses[n % statuses.length],
    deal_interest: isDead ? 'Not Interested/Dead' : interests[n % interests.length],
    next_steps: n % 4 === 0 ? 'Follow up on OM review (fixture)' : null,
    contact_stage: contact.contact_stage,
    is_dead: isDead,
    dead_at: isDead ? '2026-09-01T00:00:00.000Z' : null,
    wisai_heat: heats[n % heats.length],
    wisai_score: 10 + ((n * 13) % 90),
    wisai_intent: n % 3 === 0 ? 'Likely to reply this week (fixture AI)' : null,
    wisai_reply_urgency: n % 4 === 0 ? 'Today' : n % 4 === 1 ? 'This Week' : null,
    wisai_summary: 'Fixture summary — not real AI output.',
    wisai_next_step: 'Ping with updated model.',
    wisai_scored_at: '2026-10-25T12:00:00.000Z',
    last_inbound_at: lastIn,
    last_outbound_at: lastOut,
    last_call_at: n % 11 === 0 ? '2026-10-10T15:00:00.000Z' : null,
    days_since_inbound: daysIn,
    days_since_outbound: daysOut,
    followups_no_reply: n % 5,
    opportunity_health: health,
    opportunity_at_risk: health === 'Going Quiet' && (contact.contact_stage || '').startsWith('4'),
    updated_at: `2026-10-${String((n % 28) + 1).padStart(2, '0')}T18:00:00.000Z`,
    created_at: '2026-06-01T12:00:00.000Z',
    d365_account_id: contact.d365_account_id,
    d365_contact_id: contact.d365_contact_id,
    account_website: `http://www.fake-investor-${((n - 1) % FIXTURE_ACCOUNTS.length) + 1}.${FAKE}`,
    data_room_link: deal.data_room_url_external,
    is_signed: false,
    last_email_preview: n % 2 === 0 ? 'Thanks — reviewing the OM this week.' : null,
    last_email_preview_at: lastIn,
  }
}

/** ~120 fixture opps (incl. dead) — enough for paging/filter demos without claiming 57k. */
export const FIXTURE_OPPS: OppRaw[] = Array.from({ length: 120 }, (_, i) => makeOpp(i))

export const FIXTURE_EMAILS: MissiveEmail[] = [
  {
    id: 'email-fake-1',
    d365_opportunity_id: 'opp-fake-0003',
    from_email: FIXTURE_CONTACTS[2].email,
    to_email: 'devon.fixture@wisnia.example.test',
    subject: 'Re: Fake Solar Alpha — OM',
    body_preview: 'Thanks for sending — reviewing with the team (FIXTURE).',
    received_at: '2026-10-27T16:00:00.000Z',
    email_class: 'conversation',
    missive_conversation_id: 'missive-conv-fake-1',
    direction: 'inbound',
  },
  {
    id: 'email-fake-2',
    d365_opportunity_id: 'opp-fake-0003',
    from_email: 'devon.fixture@wisnia.example.test',
    to_email: FIXTURE_CONTACTS[2].email,
    subject: 'Fake Solar Alpha — OM',
    body_preview: 'Sharing the OM for Fake Solar Alpha (FIXTURE).',
    received_at: '2026-10-20T10:00:00.000Z',
    email_class: 'conversation',
    missive_conversation_id: 'missive-conv-fake-1',
    direction: 'outbound',
  },
  {
    id: 'email-fake-3',
    d365_opportunity_id: 'opp-fake-0006',
    from_email: FIXTURE_CONTACTS[5].email,
    to_email: 'devon.fixture@wisnia.example.test',
    subject: 'Quick question on Fake Wind Beta',
    body_preview: 'What is the interconnection status? (FIXTURE)',
    received_at: '2026-10-15T14:00:00.000Z',
    email_class: 'conversation',
    missive_conversation_id: 'missive-conv-fake-2',
    direction: 'inbound',
  },
  {
    id: 'email-fake-other-deal',
    d365_opportunity_id: 'opp-fake-0009',
    from_email: FIXTURE_CONTACTS[2].email,
    to_email: 'devon.fixture@wisnia.example.test',
    subject: 'Different deal thread (must not leak)',
    body_preview: 'This belongs to another opp (FIXTURE).',
    received_at: '2026-10-12T14:00:00.000Z',
    email_class: 'conversation',
    missive_conversation_id: 'missive-conv-fake-3',
    direction: 'inbound',
  },
]

export const FIXTURE_TASKS: Task[] = [
  {
    id: 'task-fake-1',
    title: 'Follow up on OM (fixture)',
    status: 'open',
    due_at: '2026-11-05T17:00:00.000Z',
    d365_opportunity_id: 'opp-fake-0003',
    deal_id: 'deal-solar-alpha',
    deal_name: 'Fake Solar Alpha',
  },
  {
    id: 'task-fake-2',
    title: 'Send updated model (fixture)',
    status: 'open',
    due_at: '2026-11-08T17:00:00.000Z',
    d365_opportunity_id: 'opp-fake-0006',
    deal_id: 'deal-wind-beta',
    deal_name: 'Fake Wind Beta',
  },
  {
    id: 'task-fake-snoozed',
    title: 'Snoozed fixture task',
    status: 'open',
    snoozed_until: '2099-01-01T00:00:00.000Z',
    deal_id: 'deal-solar-alpha',
    deal_name: 'Fake Solar Alpha',
  },
]

export const FIXTURE_CALLS: Call[] = [
  {
    id: 'call-fake-1',
    deal_id: 'deal-solar-alpha',
    d365_opportunity_id: 'opp-fake-0003',
    subject: 'Intro call (fixture)',
    notes: 'Discussed capacity and offtake. Not a real call.',
    called_at: '2026-10-10T15:00:00.000Z',
    duration_sec: 1800,
  },
]

export const FIXTURE_DEAL_DOCS: DealDoc[] = [
  {
    id: 'doc-fake-1',
    deal_id: 'deal-solar-alpha',
    path: 'Fake Solar Alpha (deal-solar-alpha)/OM/Fake_Solar_Alpha_OM.pdf',
    name: 'Fake_Solar_Alpha_OM.pdf',
    size_bytes: 1_024_000,
    content_type: 'application/pdf',
    uploaded_at: '2026-09-01T12:00:00.000Z',
  },
  {
    id: 'doc-fake-2',
    deal_id: 'deal-solar-alpha',
    path: 'Fake Solar Alpha (deal-solar-alpha)/Financials/model.xlsx',
    name: 'model.xlsx',
    size_bytes: 512_000,
    content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploaded_at: '2026-09-05T12:00:00.000Z',
  },
]

export const FIXTURE_SAVED_VIEWS: SavedView[] = [
  {
    id: 'view-deals-active',
    tab: 'deals',
    name: 'Active deals',
    payload: { status: ['Active'] },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'view-accounts-fo',
    tab: 'pg_accounts',
    name: 'Family offices',
    payload: { filters: [{ key: 'industry', values: ['Family Office'] }] },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'view-contacts-vp',
    tab: 'pg_contacts',
    name: 'VPs',
    payload: { search: 'VP' },
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export const FIXTURE_CAMPAIGN_ROLLUPS: CampaignRollup[] = [
  { deal_name: 'Fake Solar Alpha', campaigns: 2, members: 48, replied: 6 },
  { deal_name: 'Fake Wind Beta', campaigns: 1, members: 22, replied: 2 },
  { deal_name: 'Fake Hydro Delta', campaigns: 0, members: 0, replied: 0 },
]

/** Seven seeded Opps local presets (names only; filters approximated for fixtures). */
export const OPPS_SEEDED_VIEWS = [
  { id: 'focus', name: 'Focus', heat: 'all' as const, interest: [] as string[] },
  {
    id: 'interested-quiet',
    name: 'Interested · gone quiet',
    heat: 'all' as const,
    interest: ['Interested'],
  },
  { id: 'opp-health', name: 'Opportunity Health', heat: 'all' as const, interest: [] as string[] },
  {
    id: 'interested-top',
    name: 'Interested · Top funnel',
    heat: 'all' as const,
    interest: ['Interested'],
  },
  { id: 'hot', name: 'Hot', heat: 'hot' as const, interest: [] as string[] },
  { id: 'stalled', name: 'Stalled · viewed silent', heat: 'cold' as const, interest: [] as string[] },
  {
    id: 'criteria',
    name: 'Criteria provided',
    heat: 'all' as const,
    interest: ['Provided Investment Criteria'],
  },
]
