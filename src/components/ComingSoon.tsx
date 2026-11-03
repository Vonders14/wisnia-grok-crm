import type { ReactNode } from 'react'

/** Marks write actions that exist in the original but are disabled in this read-only build. */
export function ComingSoonBadge() {
  return <span className="badge-soon">Coming soon</span>
}

export function ComingSoonButton({
  children,
  title = 'Read-only build — writes are disabled until Devon approves a secure write path.',
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <button type="button" className="btn btn-coming" disabled title={title}>
      {children}
      <ComingSoonBadge />
    </button>
  )
}

export function ReadOnlyNotice({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p style={{ color: 'var(--waiting)', fontSize: 12, margin: '8px 0' }}>
        Read-only — edits, uploads, email send, and sequence push are stubbed.
      </p>
    )
  }
  return (
    <div className="readonly-banner" role="status">
      Read-only preview on mock data. Cell edits, mark dead, notes, tasks, sequence push, email
      send, Apollo save, Run Prompt, create opps, and data-room upload are disabled. No Supabase
      writes are possible from this app.
    </div>
  )
}
