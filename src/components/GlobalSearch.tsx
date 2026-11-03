import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const client = getCrmClient()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => client.globalSearch(q),
    enabled: open && q.trim().length >= 2,
  })

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <h2>Search</h2>
          <div className="spacer" style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Esc
          </button>
        </div>
        <div className="modal-body">
          <input
            autoFocus
            type="search"
            placeholder="Accounts, contacts, deals, opps, emails…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%', height: 36, padding: '0 10px', marginBottom: 12 }}
          />
          {!data && q.trim().length >= 2 && <div className="empty">Searching…</div>}
          {data && (
            <>
              <ResultGroup
                title="Accounts"
                items={data.accounts.map((a) => ({
                  id: a.d365_account_id,
                  label: a.name || a.d365_account_id,
                  href: `/companies/${a.d365_account_id}`,
                }))}
                onPick={(href) => {
                  setOpen(false)
                  navigate(href)
                }}
              />
              <ResultGroup
                title="Contacts"
                items={data.contacts.map((c) => ({
                  id: c.d365_contact_id,
                  label: `${c.full_name || c.email} · ${c.account_name || ''}`,
                  href: `/people/${c.d365_contact_id}`,
                }))}
                onPick={(href) => {
                  setOpen(false)
                  navigate(href)
                }}
              />
              <ResultGroup
                title="Deals"
                items={data.deals.map((d) => ({
                  id: d.id,
                  label: d.deal_name,
                  href: `/deals/${d.id}`,
                }))}
                onPick={(href) => {
                  setOpen(false)
                  navigate(href)
                }}
              />
              <ResultGroup
                title="Opps"
                items={data.opps.map((o) => ({
                  id: o.d365_opportunity_id,
                  label: o.topic || o.d365_opportunity_id,
                  href: `/opps/${o.d365_opportunity_id}`,
                }))}
                onPick={(href) => {
                  setOpen(false)
                  navigate(href)
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultGroup({
  title,
  items,
  onPick,
}: {
  title: string
  items: { id: string; label: string; href: string }[]
  onPick: (href: string) => void
}) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="search-hit group" style={{ cursor: 'default' }}>
        {title}
      </div>
      {items.map((it) => (
        <div key={it.id} className="search-hit" onClick={() => onPick(it.href)}>
          {it.label}
        </div>
      ))}
    </div>
  )
}
