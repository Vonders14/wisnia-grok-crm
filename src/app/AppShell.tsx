import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GlobalSearch, openGlobalSearch } from '@/components/GlobalSearch'
import { getCrmClient } from '@/data'
import { Icon } from '@/icons/Icon'
import { Toaster } from '@/ui/Toaster'

const RECORDS = [
  { to: '/opps', label: 'Opps', icon: 'pipeline', color: '#266df0' },
  { to: '/deals', label: 'Deals', icon: 'deal', color: '#f59e0b' },
  { to: '/accounts', label: 'Accounts', icon: 'building', color: '#3b82f6' },
  { to: '/contacts', label: 'Contacts', icon: 'user', color: '#8b5cf6' },
] as const

export function AppShell() {
  const loc = useLocation()
  const client = getCrmClient()

  const { data: counts } = useQuery({
    queryKey: ['nav-counts'],
    queryFn: async () => {
      const [opps, deals, accounts, contacts] = await Promise.all([
        client.listOpps({ limit: 1 }),
        client.listDeals({ limit: 1, includeClosed: true }),
        client.prospectPage({ kind: 'accounts', limit: 1 }),
        client.prospectPage({ kind: 'contacts', limit: 1 }),
      ])
      return {
        '/opps': opps.total,
        '/deals': deals.total,
        '/accounts': accounts.total,
        '/contacts': contacts.total,
      } as Record<string, number>
    },
  })

  return (
    <div className="app">
      <aside className="side" aria-label="Primary">
        <div className="ws">
          <div className="ws-badge">W</div>
          <div className="ws-name">Wisnia Capital</div>
          <Icon name="chevron" size="sm" />
        </div>

        <div className="nav">
          <button type="button" className="ni" onClick={() => openGlobalSearch()}>
            <Icon name="search" />
            Search
            <span className="kbd">⌘K</span>
          </button>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="bell" />
            Notifications
            <span className="cnt">3</span>
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="task" />
            Tasks
            <span className="cnt">7</span>
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="mail" />
            Emails
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="phone" />
            Calls
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="chart" />
            Reports
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="send" />
            Sequences
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <Icon name="zap" />
            Workflows
          </div>
        </div>

        <div className="sec">
          Records
          <Icon name="plus" size="sm" />
        </div>
        <div className="nav">
          {RECORDS.map((r) => {
            const active =
              loc.pathname === r.to ||
              loc.pathname.startsWith(r.to + '/') ||
              (r.to === '/accounts' && loc.pathname.startsWith('/companies')) ||
              (r.to === '/contacts' && loc.pathname.startsWith('/people')) ||
              (r.to === '/opps' && loc.pathname.startsWith('/opportunities')) ||
              (r.to === '/deals' && loc.pathname.startsWith('/deals/record'))
            return (
              <NavLink
                key={r.to}
                to={r.to}
                className={`ni nav-link${active ? ' on' : ''}`}
              >
                <span className="oic" style={{ background: r.color }}>
                  <Icon name={r.icon} size="sm" />
                </span>
                {r.label}
                <span className="cnt">{(counts?.[r.to] ?? '—').toLocaleString()}</span>
              </NavLink>
            )
          })}
        </div>

        <div className="sec">
          Lists
          <Icon name="plus" size="sm" />
        </div>
        <div className="nav">
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <span className="dot" style={{ background: '#f59e0b' }} />
            Investor Outreach
            <span className="cnt">18</span>
          </div>
          <div className="ni tip" data-tip="Coming soon (read-only)">
            <span className="dot" style={{ background: '#22c55e' }} />
            Deal Pipeline
            <span className="cnt">16</span>
          </div>
        </div>

        <div className="side-foot">
          <span
            className="av md"
            style={{ background: '#f59e0b', color: '#fff' }}
          >
            DM
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>Devon McKenney</div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              Wisnia Capital
            </div>
          </div>
        </div>
        <div className="ro-pill">Read-only · {client.mode}</div>
        <div className="demo-pill">EXAMPLE DATA</div>
      </aside>

      <div className="main">
        <Outlet />
        <GlobalSearch />
        <Toaster />
      </div>
    </div>
  )
}
