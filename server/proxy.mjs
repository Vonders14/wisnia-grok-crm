/**
 * Read-only Supabase proxy.
 *
 * Holds SUPABASE_SERVICE_ROLE_KEY (or a future read-only key) on the server.
 * Exposes only GET (and one POST for keyword sweep RPC that is read-only).
 * Rejects any path that looks like a write. Does NOT create DB objects.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server/proxy.mjs
 */
import http from 'node:http'
import { URL } from 'node:url'

const PORT = Number(process.env.PROXY_PORT || 8787)
const ORIGIN = process.env.PROXY_ALLOWED_ORIGIN || 'http://localhost:5173'
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const ALLOWED_RPC = new Set(['crm_prospect_page', 'crm_keyword_sweep_exact', 'crm_campaigns'])
const ALLOWED_TABLES = new Set([
  'd365_opportunities',
  'deals',
  'master',
  'contacts',
  'missive_emails',
  'tasks',
  'calls',
  'deal_docs',
  'crm_saved_views',
  'campaign_leads',
  'v_wisai_opportunities',
  'scraped_text_store',
])

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey')
}

function json(res, status, body) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function sbFetch(path, init = {}) {
  if (!SB_URL || !SB_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  }
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const err = new Error(`Supabase ${res.status}`)
    err.status = res.status
    err.body = data
    throw err
  }
  const contentRange = res.headers.get('content-range')
  return { data, contentRange }
}

function parseTotal(contentRange) {
  if (!contentRange) return null
  const m = contentRange.match(/\/(\d+|\*)/)
  if (!m || m[1] === '*') return null
  return Number(m[1])
}

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : null
}

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)
    const { pathname, searchParams } = url

    // Hard deny anything that smells like a write verb through PostgREST
    if (req.method && !['GET', 'POST', 'OPTIONS'].includes(req.method)) {
      return json(res, 405, { error: 'read-only proxy: method not allowed' })
    }

    if (pathname === '/health') {
      return json(res, 200, {
        ok: true,
        mode: 'read-only',
        configured: !!(SB_URL && SB_KEY),
      })
    }

    if (!SB_URL || !SB_KEY) {
      return json(res, 503, {
        error:
          'Proxy not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Prefer anon+RLS when approved.',
      })
    }

    if (pathname === '/api/opps' && req.method === 'GET') {
      const limit = Number(searchParams.get('limit') || 50)
      const offset = Number(searchParams.get('offset') || 0)
      const parts = [
        'is_dead=not.is.true',
        'select=*',
        `order=${searchParams.get('sort') || 'updated_at'}.${searchParams.get('dir') || 'desc'}`,
        `limit=${limit}`,
        `offset=${offset}`,
      ]
      if (searchParams.get('deal')) parts.push(`deal_name=eq.${encodeURIComponent(searchParams.get('deal'))}`)
      const interest = (searchParams.get('interest') || '').split(',').filter(Boolean)
      if (interest.length) parts.push(`deal_interest=in.(${interest.map(encodeURIComponent).join(',')})`)
      const { data, contentRange } = await sbFetch(`/d365_opportunities?${parts.join('&')}`)
      return json(res, 200, { rows: data, total: parseTotal(contentRange) ?? data.length })
    }

    if (pathname.startsWith('/api/opps/') && req.method === 'GET') {
      const parts = pathname.split('/').filter(Boolean) // api opps :id [emails|tasks|calls]
      const id = decodeURIComponent(parts[2] || '')
      const sub = parts[3]
      if (!sub) {
        const { data } = await sbFetch(
          `/d365_opportunities?d365_opportunity_id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
        )
        return json(res, 200, data?.[0] ?? null)
      }
      if (sub === 'emails') {
        const { data } = await sbFetch(
          `/missive_emails?email_class=eq.conversation&d365_opportunity_id=eq.${encodeURIComponent(id)}&select=*&order=received_at.asc&limit=200`,
        )
        return json(res, 200, data)
      }
      if (sub === 'tasks') {
        const { data } = await sbFetch(
          `/tasks?d365_opportunity_id=eq.${encodeURIComponent(id)}&snoozed_until=is.null&select=*&limit=200`,
        )
        return json(res, 200, data)
      }
      if (sub === 'calls') {
        const { data } = await sbFetch(
          `/calls?d365_opportunity_id=eq.${encodeURIComponent(id)}&select=*&limit=100`,
        )
        return json(res, 200, data)
      }
    }

    if (pathname === '/api/deals' && req.method === 'GET') {
      const { data, contentRange } = await sbFetch(
        `/deals?select=*&order=last_activity_date.desc&limit=${searchParams.get('limit') || 200}`,
      )
      return json(res, 200, { rows: data, total: parseTotal(contentRange) ?? data.length })
    }

    if (pathname.startsWith('/api/deals/') && req.method === 'GET') {
      const parts = pathname.split('/').filter(Boolean)
      const id = decodeURIComponent(parts[2] || '')
      const sub = parts[3]
      if (!sub) {
        const { data } = await sbFetch(`/deals?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
        return json(res, 200, data?.[0] ?? null)
      }
      if (sub === 'docs') {
        const { data } = await sbFetch(`/deal_docs?deal_id=eq.${encodeURIComponent(id)}&select=*`)
        return json(res, 200, data)
      }
      if (sub === 'tasks') {
        const { data } = await sbFetch(
          `/tasks?deal_id=eq.${encodeURIComponent(id)}&snoozed_until=is.null&select=*`,
        )
        return json(res, 200, data)
      }
      if (sub === 'timeline') {
        return json(res, 200, { tasks: [], emails: [], calls: [] })
      }
    }

    if (pathname === '/api/prospect' && req.method === 'GET') {
      // Read-only RPC
      const body = {
        p_kind: searchParams.get('kind'),
        p_deal: searchParams.get('deal') || null,
        p_mode: searchParams.get('mode') || null,
        p_search: searchParams.get('search') || '',
        p_sort: searchParams.get('sort') || 'updated_at',
        p_dir: searchParams.get('dir') || 'desc',
        p_limit: Number(searchParams.get('limit') || 50),
        p_offset: Number(searchParams.get('offset') || 0),
        p_filters: JSON.parse(searchParams.get('filters') || '[]'),
      }
      const resRpc = await fetch(`${SB_URL}/rest/v1/rpc/crm_prospect_page`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await resRpc.json()
      if (!resRpc.ok) return json(res, resRpc.status, data)
      if (Array.isArray(data)) return json(res, 200, { rows: data, total: data.length })
      return json(res, 200, { rows: data.rows || [], total: data.total ?? 0 })
    }

    if (pathname === '/api/keyword-sweep' && req.method === 'POST') {
      const payload = await readBody(req)
      const resRpc = await fetch(`${SB_URL}/rest/v1/rpc/crm_keyword_sweep_exact`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await resRpc.json()
      return json(res, resRpc.status, data)
    }

    if (pathname === '/api/campaigns') {
      const resRpc = await fetch(`${SB_URL}/rest/v1/rpc/crm_campaigns`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      })
      const data = await resRpc.json()
      return json(res, resRpc.status, data)
    }

    if (pathname === '/api/saved-views') {
      const tab = searchParams.get('tab') || ''
      const { data } = await sbFetch(
        `/crm_saved_views?tab=eq.${encodeURIComponent(tab)}&select=*`,
      )
      return json(res, 200, data)
    }

    if (pathname === '/api/search') {
      return json(res, 200, {
        accounts: [],
        contacts: [],
        deals: [],
        opps: [],
        emails: [],
        note: 'Configure multi-select search in a later milestone; use table endpoints.',
      })
    }

    if (pathname === '/api/deal-prices') {
      const { data } = await sbFetch(
        `/deals?select=deal_name,asking_price&asking_price=not.is.null&limit=200`,
      )
      const out = {}
      for (const d of data || []) if (d.deal_name) out[d.deal_name] = d.asking_price
      return json(res, 200, out)
    }

    if (pathname.startsWith('/api/accounts/')) {
      const id = decodeURIComponent(pathname.split('/')[3] || '')
      const { data } = await sbFetch(
        `/master?d365_account_id=ilike.${encodeURIComponent(id)}&select=*&limit=1`,
      )
      return json(res, 200, data?.[0] ?? null)
    }

    if (pathname.startsWith('/api/contacts/')) {
      const id = decodeURIComponent(pathname.split('/')[3] || '')
      const { data } = await sbFetch(
        `/contacts?d365_contact_id=ilike.${encodeURIComponent(id)}&select=*&limit=1`,
      )
      return json(res, 200, data?.[0] ?? null)
    }

    // Guard: never proxy arbitrary writes
    if (pathname.includes('/rpc/') && !ALLOWED_RPC.has(pathname.split('/').pop())) {
      return json(res, 403, { error: 'RPC not on read-only allowlist' })
    }
    for (const t of ALLOWED_TABLES) {
      // noop — documented allowlist for future generic GET
      void t
    }

    return json(res, 404, { error: 'not found', path: pathname })
  } catch (err) {
    return json(res, err.status || 500, { error: err.message, detail: err.body })
  }
})

server.listen(PORT, () => {
  console.log(`Wisnia read-only proxy on :${PORT} (origin ${ORIGIN})`)
  console.log(`Configured: ${!!(SB_URL && SB_KEY)}`)
})
