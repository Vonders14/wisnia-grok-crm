import type { ReactNode } from 'react'
import { Btn } from '@/ui/Button'

/** @deprecated Prefer <Btn soon> — kept for call sites during restyle. */
export function ComingSoonBadge() {
  return null
}

export function ComingSoonButton({
  children,
  title = 'Coming soon (read-only)',
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <Btn soon title={title}>
      {children}
    </Btn>
  )
}

/** Subtle pill only — no full-width banner. */
export function ReadOnlyNotice({ compact }: { compact?: boolean }) {
  if (compact) {
    return <span className="ro-pill">Read-only</span>
  }
  return null
}
