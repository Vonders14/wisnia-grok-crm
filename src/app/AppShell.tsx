import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { GlobalSearch } from '@/components/GlobalSearch'
import { ReadOnlyNotice } from '@/components/ComingSoon'
import { getCrmClient } from '@/data'

const NAV = [
  { to: '/opps', label: 'Opps' },
  { to: '/deals', label: 'Deals' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/contacts', label: 'Contacts' },
]

export function AppShell() {
  const loc = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const client = getCrmClient()
  const heat = params.get('heat') || 'all'
  const onOpps = loc.pathname.startsWith('/opps')

  return (
    <div className="app-shell">
      <nav className="nav" aria-label="Primary">
        <div className="nav-brand">
          <div className="mark">Wisnia OS</div>
          <div className="sub">CRM · read-only rebuild</div>
        </div>
        <div className="nav-links">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {n.label}
            </NavLink>
          ))}
        </div>
        {onOpps && (
          <div className="nav-heat">
            <div className="label">Pipeline heat</div>
            <div className="heat-row">
              {(['all', 'hot', 'warm', 'cold'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`heat-chip ${h}${heat === h ? ' active' : ''}`}
                  onClick={() => navigate(`/opps?heat=${h}`)}
                >
                  {h.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="nav-footer">
          Data: <strong>{client.mode}</strong>
          <br />
          ⌘/Ctrl-K search
        </div>
      </nav>
      <div className="main">
        <ReadOnlyNotice />
        <Outlet />
        <GlobalSearch />
      </div>
    </div>
  )
}
