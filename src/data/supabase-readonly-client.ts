import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CrmDataClient } from './client'
import type {
  Account,
  Call,
  CampaignRollup,
  Contact,
  Deal,
  DealDoc,
  DealListParams,
  GlobalSearchResult,
  KeywordSweepHit,
  KeywordSweepParams,
  MissiveEmail,
  OppListParams,
  OppListResult,
  OppRaw,
  ProspectPageParams,
  ProspectPageResult,
  SavedView,
  Task,
} from './types'
import { isClosedDealStatus, isLiveOpp, scopeOppEmails } from '@/lib/opp-rules'

/**
 * Read-only Supabase client.
 * Prefer routing through the server proxy (VITE_API_BASE_URL) so the browser
 * never holds a privileged key. Direct anon+RLS is supported when Devon
 * approves policies — still SELECT-only; no write methods exist on this class.
 */
export class SupabaseReadonlyClient implements CrmDataClient {
  readonly mode = 'supabase-readonly' as const
  private sb: SupabaseClient | null
  private apiBase: string | null

  constructor(opts: {
    supabaseUrl?: string
    supabaseAnonKey?: string
    apiBaseUrl?: string
  }) {
    this.apiBase = opts.apiBaseUrl?.replace(/\/$/, '') || null
    if (opts.supabaseUrl && opts.supabaseAnonKey && !this.apiBase) {
      this.sb = createClient(opts.supabaseUrl, opts.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    } else {
      this.sb = null
    }
  }

  private async proxyGet<T>(path: string, query?: Record<string, string>): Promise<T> {
    if (!this.apiBase) throw new Error('No API base URL configured')
    const url = new URL(this.apiBase + path)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v != null && v !== '') url.searchParams.set(k, v)
      }
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Proxy ${path} failed: ${res.status}`)
    return res.json() as Promise<T>
  }

  async listOpps(params: OppListParams = {}): Promise<OppListResult> {
    if (this.apiBase) {
      return this.proxyGet<OppListResult>('/api/opps', {
        heat: params.heat || 'all',
        search: params.search || '',
        deal: params.deal || '',
        sort: params.sort || 'updated_at',
        dir: params.dir || 'desc',
        limit: String(params.limit ?? 50),
        offset: String(params.offset ?? 0),
        interest: (params.interest || []).join(','),
        stage: (params.stage || []).join(','),
      })
    }
    if (!this.sb) throw new Error('Supabase not configured')
    let q = this.sb
      .from('d365_opportunities')
      .select('*', { count: 'exact' })
      .not('is_dead', 'is', true)
      .order(params.sort || 'updated_at', { ascending: params.dir === 'asc' })
      .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1)
    if (params.deal) q = q.eq('deal_name', params.deal)
    if (params.interest?.length) q = q.in('deal_interest', params.interest)
    if (params.stage?.length) q = q.in('investor_status', params.stage)
    if (params.search) {
      q = q.or(
        `topic.ilike.%${params.search}%,account_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%`,
      )
    }
    const { data, error, count } = await q
    if (error) throw error
    return { rows: (data || []) as OppRaw[], total: count ?? 0 }
  }

  async getOpp(id: string) {
    if (this.apiBase) return this.proxyGet<OppRaw | null>(`/api/opps/${encodeURIComponent(id)}`)
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('d365_opportunities')
      .select('*')
      .eq('d365_opportunity_id', id)
      .maybeSingle()
    if (error) throw error
    return (data as OppRaw) ?? null
  }

  async listOppEmails(oppId: string) {
    if (this.apiBase) {
      return this.proxyGet<MissiveEmail[]>(`/api/opps/${encodeURIComponent(oppId)}/emails`)
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const opp = await this.getOpp(oppId)
    if (!opp) return []
    const { data: tagged } = await this.sb
      .from('missive_emails')
      .select('*')
      .eq('email_class', 'conversation')
      .eq('d365_opportunity_id', oppId)
      .order('received_at', { ascending: true })
      .limit(200)
    if (tagged?.length) return tagged as MissiveEmail[]

    let liveOppCount = 2
    if (opp.contact_email) {
      const { data: live } = await this.sb
        .from('d365_opportunities')
        .select('d365_opportunity_id')
        .not('is_dead', 'is', true)
        .ilike('contact_email', opp.contact_email)
        .limit(5)
      liveOppCount = live?.length ?? 2
      if (liveOppCount <= 1) {
        const { data: fb } = await this.sb
          .from('missive_emails')
          .select('*')
          .eq('email_class', 'conversation')
          .or(`from_email.ilike.${opp.contact_email},to_email.ilike.${opp.contact_email}`)
          .order('received_at', { ascending: true })
          .limit(200)
        return scopeOppEmails({
          oppId,
          contactEmail: opp.contact_email,
          tagged: [],
          contactEmails: (fb || []) as MissiveEmail[],
          liveOppCountForContact: liveOppCount,
        })
      }
    }
    return []
  }

  async listOppTasks(oppId: string) {
    if (this.apiBase) {
      return this.proxyGet<Task[]>(`/api/opps/${encodeURIComponent(oppId)}/tasks`)
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('tasks')
      .select('*')
      .eq('d365_opportunity_id', oppId)
      .is('snoozed_until', null)
      .limit(200)
    if (error) throw error
    return (data || []) as Task[]
  }

  async listOppCalls(oppId: string) {
    if (this.apiBase) {
      return this.proxyGet<Call[]>(`/api/opps/${encodeURIComponent(oppId)}/calls`)
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('calls')
      .select('*')
      .eq('d365_opportunity_id', oppId)
      .limit(100)
    if (error) throw error
    return (data || []) as Call[]
  }

  async listDeals(params: DealListParams = {}) {
    if (this.apiBase) {
      return this.proxyGet<{ rows: Deal[]; total: number }>('/api/deals', {
        search: params.search || '',
        limit: String(params.limit ?? 200),
        offset: String(params.offset ?? 0),
        includeClosed: params.includeClosed ? '1' : '0',
      })
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error, count } = await this.sb
      .from('deals')
      .select('*', { count: 'exact' })
      .order(params.sort || 'last_activity_date', { ascending: params.dir === 'asc' })
      .limit(params.limit ?? 2000)
    if (error) throw error
    let rows = (data || []) as Deal[]
    if (!params.includeClosed) rows = rows.filter((d) => !isClosedDealStatus(d.status))
    return { rows, total: count ?? rows.length }
  }

  async getDeal(id: string) {
    if (this.apiBase) return this.proxyGet<Deal | null>(`/api/deals/${encodeURIComponent(id)}`)
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.from('deals').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return (data as Deal) ?? null
  }

  async listDealDocs(dealId: string) {
    if (this.apiBase) {
      return this.proxyGet<DealDoc[]>(`/api/deals/${encodeURIComponent(dealId)}/docs`)
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.from('deal_docs').select('*').eq('deal_id', dealId)
    if (error) throw error
    return (data || []) as DealDoc[]
  }

  async listDealTasks(dealId: string) {
    if (this.apiBase) {
      return this.proxyGet<Task[]>(`/api/deals/${encodeURIComponent(dealId)}/tasks`)
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('tasks')
      .select('*')
      .eq('deal_id', dealId)
      .is('snoozed_until', null)
      .limit(200)
    if (error) throw error
    return (data || []) as Task[]
  }

  async listDealTimeline(dealId: string) {
    if (this.apiBase) {
      return this.proxyGet<{ tasks: Task[]; emails: MissiveEmail[]; calls: Call[] }>(`/api/deals/${encodeURIComponent(dealId)}/timeline`)
    }
    const [tasks, calls, investors] = await Promise.all([
      this.listDealTasks(dealId),
      this.sb
        ? this.sb.from('calls').select('*').eq('deal_id', dealId).limit(40)
        : Promise.resolve({ data: [] }),
      this.getDeal(dealId).then((d) => (d ? this.listDealInvestors(d.deal_name) : [])),
    ])
    const oppIds = investors.map((o) => o.d365_opportunity_id).slice(0, 60)
    let emails: MissiveEmail[] = []
    if (this.sb && oppIds.length) {
      const { data } = await this.sb
        .from('missive_emails')
        .select('*')
        .in('d365_opportunity_id', oppIds)
        .order('received_at', { ascending: false })
        .limit(40)
      emails = (data || []) as MissiveEmail[]
    }
    return {
      tasks,
      emails,
      calls: ((calls as { data: Call[] | null }).data || []) as Call[],
    }
  }

  async listCampaignRollups(): Promise<CampaignRollup[]> {
    if (this.apiBase) return this.proxyGet<CampaignRollup[]>('/api/campaigns')
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.rpc('crm_campaigns')
    if (error) throw error
    return (data || []) as CampaignRollup[]
  }

  async listDealInvestors(dealName: string) {
    if (this.apiBase) {
      return this.proxyGet<OppListResult>('/api/opps', { deal: dealName, limit: '500', offset: '0' }).then(
        (r: OppListResult) => r.rows,
      )
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('d365_opportunities')
      .select('*')
      .eq('deal_name', dealName)
      .not('is_dead', 'is', true)
      .limit(500)
    if (error) throw error
    return ((data || []) as OppRaw[]).filter(isLiveOpp)
  }

  async prospectPage(
    params: ProspectPageParams,
  ): Promise<ProspectPageResult<Account | Contact>> {
    if (this.apiBase) {
      return this.proxyGet<ProspectPageResult<Account | Contact>>('/api/prospect', {
        kind: params.kind,
        search: params.search || '',
        sort: params.sort || 'updated_at',
        dir: params.dir || 'desc',
        limit: String(params.limit ?? 50),
        offset: String(params.offset ?? 0),
        deal: params.deal || '',
        mode: params.mode || '',
        filters: JSON.stringify(params.filters || []),
      })
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.rpc('crm_prospect_page', {
      p_kind: params.kind,
      p_deal: params.deal ?? null,
      p_mode: params.mode ?? null,
      p_search: params.search ?? '',
      p_sort: params.sort ?? 'updated_at',
      p_dir: params.dir ?? 'desc',
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
      p_filters: params.filters ?? [],
    })
    if (error) throw error
    const payload = data as { rows?: (Account | Contact)[]; total?: number } | (Account | Contact)[]
    if (Array.isArray(payload)) return { rows: payload, total: payload.length }
    return { rows: payload.rows || [], total: payload.total ?? 0 }
  }

  async getAccount(id: string) {
    if (this.apiBase) return this.proxyGet<Account | null>(`/api/accounts/${encodeURIComponent(id)}`)
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('master')
      .select('*')
      .ilike('d365_account_id', id)
      .maybeSingle()
    if (error) throw error
    return (data as Account) ?? null
  }

  async getContact(id: string) {
    if (this.apiBase) return this.proxyGet<Contact | null>(`/api/contacts/${encodeURIComponent(id)}`)
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('contacts')
      .select('*')
      .ilike('d365_contact_id', id)
      .maybeSingle()
    if (error) throw error
    return (data as Contact) ?? null
  }

  async keywordSweep(params: KeywordSweepParams): Promise<KeywordSweepHit[]> {
    if (this.apiBase) {
      const res = await fetch(this.apiBase + '/api/keyword-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error(`keyword-sweep failed: ${res.status}`)
      return res.json()
    }
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.rpc('crm_keyword_sweep_exact', params)
    if (error) throw error
    return (data || []) as KeywordSweepHit[]
  }

  async listSavedViews(tab: string) {
    if (this.apiBase) return this.proxyGet<SavedView[]>('/api/saved-views', { tab })
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb.from('crm_saved_views').select('*').eq('tab', tab)
    if (error) throw error
    return (data || []) as SavedView[]
  }

  async globalSearch(q: string): Promise<GlobalSearchResult> {
    if (this.apiBase) return this.proxyGet<GlobalSearchResult>('/api/search', { q })
    // Direct multi-table search — read-only selects.
    if (!this.sb) throw new Error('Supabase not configured')
    const like = `%${q}%`
    const [accounts, contacts, deals, opps, emails] = await Promise.all([
      this.sb.from('master').select('*').ilike('name', like).limit(8),
      this.sb.from('contacts').select('*').ilike('full_name', like).limit(8),
      this.sb.from('deals').select('*').ilike('deal_name', like).limit(8),
      this.sb
        .from('d365_opportunities')
        .select('*')
        .not('is_dead', 'is', true)
        .ilike('topic', like)
        .limit(8),
      this.sb.from('missive_emails').select('*').ilike('subject', like).limit(8),
    ])
    return {
      accounts: (accounts.data || []) as Account[],
      contacts: (contacts.data || []) as Contact[],
      deals: (deals.data || []) as Deal[],
      opps: (opps.data || []) as OppRaw[],
      emails: (emails.data || []) as MissiveEmail[],
    }
  }

  async dealPrices() {
    if (this.apiBase) return this.proxyGet<Record<string, number>>('/api/deal-prices')
    if (!this.sb) throw new Error('Supabase not configured')
    const { data, error } = await this.sb
      .from('deals')
      .select('deal_name,asking_price')
      .not('asking_price', 'is', null)
      .limit(200)
    if (error) throw error
    const out: Record<string, number> = {}
    for (const d of data || []) {
      if (d.deal_name && d.asking_price != null) out[d.deal_name] = d.asking_price
    }
    return out
  }
}
