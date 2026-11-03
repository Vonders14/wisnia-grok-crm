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

/**
 * Read-only CRM data access. Implementations MUST NOT expose write methods
 * (no insert/update/delete/RPC-write). UI write actions are stubbed as Coming Soon.
 */
export interface CrmDataClient {
  readonly mode: 'mock' | 'supabase-readonly'

  listOpps(params?: OppListParams): Promise<OppListResult>
  getOpp(id: string): Promise<OppRaw | null>
  listOppEmails(oppId: string): Promise<MissiveEmail[]>
  listOppTasks(oppId: string): Promise<Task[]>
  listOppCalls(oppId: string): Promise<Call[]>

  listDeals(params?: DealListParams): Promise<{ rows: Deal[]; total: number }>
  getDeal(id: string): Promise<Deal | null>
  listDealDocs(dealId: string): Promise<DealDoc[]>
  listDealTasks(dealId: string): Promise<Task[]>
  listDealTimeline(dealId: string): Promise<{
    tasks: Task[]
    emails: MissiveEmail[]
    calls: Call[]
  }>
  listCampaignRollups(): Promise<CampaignRollup[]>
  /** Investor opps for a deal_name (live only). */
  listDealInvestors(dealName: string): Promise<OppRaw[]>

  prospectPage(
    params: ProspectPageParams,
  ): Promise<ProspectPageResult<Account | Contact>>
  getAccount(id: string): Promise<Account | null>
  getContact(id: string): Promise<Contact | null>
  keywordSweep(params: KeywordSweepParams): Promise<KeywordSweepHit[]>

  listSavedViews(tab: string): Promise<SavedView[]>
  globalSearch(q: string): Promise<GlobalSearchResult>
  dealPrices(): Promise<Record<string, number>>
}
