import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrmClient } from '@/data'
import { Avatar, CompanyTile, Icon } from '@/icons/Icon'

let openFn: (() => void) | null = null
export function openGlobalSearch() {
  openFn?.()
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const client = getCrmClient()

  useEffect(() => {
    openFn = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      openFn = null
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => client.globalSearch(q),
    enabled: open && q.trim().length >= 1,
  })

  const items = [
    ...(data?.contacts || []).map((c) => ({
      id: c.d365_contact_id,
      kind: 'Person' as const,
      label: c.full_name || c.email || c.d365_contact_id,
      hint: c.account_name || 'Person',
      href: `/people/${c.d365_contact_id}`,
    })),
    ...(data?.accounts || []).map((a) => ({
      id: a.d365_account_id,
      kind: 'Company' as const,
      label: a.name || a.d365_account_id,
      hint: a.domain || 'Company',
      href: `/companies/${a.d365_account_id}`,
    })),
    ...(data?.deals || []).map((d) => ({
      id: d.id,
      kind: 'Deal' as const,
      label: d.deal_name,
      hint: d.status || 'Deal',
      href: `/deals/${d.id}`,
    })),
    ...(data?.opps || []).map((o) => ({
      id: o.d365_opportunity_id,
      kind: 'Opp' as const,
      label: o.topic || o.d365_opportunity_id,
      hint: o.deal_name || 'Opp',
      href: `/opps/${o.d365_opportunity_id}`,
    })),
  ]

  useEffect(() => setActive(0), [q, open])

  if (!open) return null

  function pick(href: string) {
    setOpen(false)
    setQ('')
    navigate(href)
  }

  return (
    <div
      className="ovl"
      data-testid="cmdk"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActive((i) => Math.min(i + 1, items.length - 1))
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActive((i) => Math.max(i - 1, 0))
        }
        if (e.key === 'Enter' && items[active]) pick(items[active].href)
      }}
    >
      <div className="cmdk" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="inp">
          <Icon name="search" />
          <input
            autoFocus
            value={q}
            placeholder="Search people, companies, deals…"
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="res">
          <div className="mlabel">Records</div>
          {!items.length && q.trim() && (
            <div className="mi" style={{ color: 'var(--t3)' }}>
              No matches
            </div>
          )}
          {items.map((it, i) => (
            <div
              key={it.kind + it.id}
              className={`mi${i === active ? ' act' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(it.href)}
            >
              {it.kind === 'Person' ? (
                <Avatar name={it.label} />
              ) : it.kind === 'Company' ? (
                <CompanyTile name={it.label} />
              ) : (
                <span className="oic" style={{ background: '#f59e0b' }}>
                  <Icon name="deal" size="sm" />
                </span>
              )}
              <span style={{ fontWeight: 500 }}>{it.label}</span>
              <span className="hint">
                {it.kind} · {it.hint}
              </span>
            </div>
          ))}
        </div>
        <div className="foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
