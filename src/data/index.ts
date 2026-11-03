import type { CrmDataClient } from './client'
import { MockCrmClient } from './mock-client'
import { SupabaseReadonlyClient } from './supabase-readonly-client'

let singleton: CrmDataClient | null = null

export function createCrmClient(): CrmDataClient {
  const mode = (import.meta.env.VITE_DATA_MODE || 'mock').toLowerCase()
  if (mode === 'supabase') {
    return new SupabaseReadonlyClient({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    })
  }
  return new MockCrmClient()
}

export function getCrmClient(): CrmDataClient {
  if (!singleton) singleton = createCrmClient()
  return singleton
}

/** Test helper to inject a client. */
export function setCrmClient(client: CrmDataClient | null) {
  singleton = client
}

export type { CrmDataClient } from './client'
export { MockCrmClient } from './mock-client'
export { SupabaseReadonlyClient } from './supabase-readonly-client'
