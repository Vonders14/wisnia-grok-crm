import type { OppRaw, MissiveEmail } from '@/lib/opp-rules'

export type { OppRaw, MissiveEmail }

export interface Deal {
  id: string
  deal_name: string
  account_name?: string | null
  status?: string | null
  stage?: string | null
  asset_type?: string | null
  city?: string | null
  state?: string | null
  asking_price?: number | null
  cap_rate?: number | null
  total_capacity_mw?: number | null
  commission?: number | null
  next_step?: string | null
  data_room_url_external?: string | null
  notes?: string | null
  industry?: string | null
  investment_strategy?: string | null
  tenancy?: string | null
  status_reason?: string | null
  last_activity_date?: string | null
  d365_deal_id?: string | null
  [key: string]: unknown
}

export interface Account {
  d365_account_id: string
  name?: string | null
  website?: string | null
  domain?: string | null
  industry?: string | null
  state?: string | null
  city?: string | null
  engagement_score?: number | null
  investor_criteria?: string | null
  apollo_id?: string | null
  updated_at?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export interface Contact {
  d365_contact_id: string
  full_name?: string | null
  email?: string | null
  title?: string | null
  d365_account_id?: string | null
  account_name?: string | null
  phone?: string | null
  linkedin_url?: string | null
  contact_stage?: string | null
  engagement_score?: number | null
  apollo_id?: string | null
  updated_at?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export interface Task {
  id: string
  title?: string | null
  status?: string | null
  due_at?: string | null
  snoozed_until?: string | null
  d365_opportunity_id?: string | null
  deal_id?: string | null
  deal_name?: string | null
  notes?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export interface Call {
  id: string
  deal_id?: string | null
  d365_opportunity_id?: string | null
  subject?: string | null
  notes?: string | null
  called_at?: string | null
  duration_sec?: number | null
  [key: string]: unknown
}

export interface DealDoc {
  id: string
  deal_id: string
  path: string
  name: string
  size_bytes?: number | null
  content_type?: string | null
  uploaded_at?: string | null
  [key: string]: unknown
}

export interface SavedView {
  id: string
  tab: string
  name: string
  payload: Record<string, unknown>
  created_at?: string | null
}

export interface CampaignRollup {
  deal_name: string
  campaigns: number
  members: number
  replied: number
}

export type ProspectKind = 'accounts' | 'contacts'

export interface ProspectFilter {
  key: string
  type: 'enum' | 'num' | 'bool' | 'date' | 'text' | 'idlist' | 'notidlist'
  op?: string
  values?: string[]
  text?: string
  min?: number | null
  max?: number | null
}

export interface ProspectPageParams {
  kind: ProspectKind
  deal?: string | null
  mode?: string | null
  search?: string
  sort?: string
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
  filters?: ProspectFilter[]
}

export interface ProspectPageResult<T> {
  rows: T[]
  total: number
}

export interface OppListParams {
  heat?: 'all' | 'hot' | 'warm' | 'cold'
  search?: string
  deal?: string | null
  stage?: string[]
  interest?: string[]
  sort?: string
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
  /** Exact-match interest values (e.g. Interested). */
  interestExact?: boolean
}

export interface OppListResult {
  rows: OppRaw[]
  total: number
}

export interface DealListParams {
  search?: string
  status?: string[]
  stage?: string[]
  sort?: string
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
  includeClosed?: boolean
}

export interface GlobalSearchResult {
  accounts: Account[]
  contacts: Contact[]
  deals: Deal[]
  opps: OppRaw[]
  emails: MissiveEmail[]
}

export interface KeywordSweepParams {
  columns: string[]
  groups: { op: 'AND' | 'OR'; terms: string[] }[]
  kind?: ProspectKind
}

export interface KeywordSweepHit {
  id: string
  matched: string[]
}
