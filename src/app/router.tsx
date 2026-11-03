import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { OppsPage } from '@/features/opps/OppsPage'
import { DealsPage } from '@/features/deals/DealsPage'
import { AccountsPage, ContactsPage } from '@/features/prospects/ProspectPage'
import {
  CompanyRecord,
  DealRecord,
  OpportunityRecord,
  PersonRecord,
} from '@/features/records/RecordPages'

/** Legacy hash routes → path routes. */
export function HashRedirect() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (!hash) return null
  const m = hash.match(/^(companies|people|deals|opportunities)\/(.+)$/)
  if (m) {
    window.location.replace(`/${m[1]}/${m[2]}`)
  }
  return null
}

export function AppRouter() {
  return (
    <>
      <HashRedirect />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/opps" replace />} />
          <Route path="opps" element={<OppsPage />} />
          <Route path="opps/:oppId" element={<OppsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="deals/:dealId" element={<DealsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="companies/:id" element={<CompanyRecord />} />
          <Route path="people/:id" element={<PersonRecord />} />
          <Route path="deals/record/:id" element={<DealRecord />} />
          <Route path="opportunities/:id" element={<OpportunityRecord />} />
          <Route path="*" element={<Navigate to="/opps" replace />} />
        </Route>
      </Routes>
    </>
  )
}
