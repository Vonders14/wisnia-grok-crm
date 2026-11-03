import { Btn } from './Button'
import { Icon } from '@/icons/Icon'

export function BulkBar({
  count,
  onClear,
  onExport,
}: {
  count: number
  onClear: () => void
  onExport?: () => void
}) {
  if (count <= 0) return null
  return (
    <div className="bulk" data-testid="bulk-bar">
      <div className="n">
        <span className="x" onClick={onClear} role="button" aria-label="Clear selection">
          <Icon name="x" size="sm" />
        </span>
        {count} selected
      </div>
      <Btn soon icon="list">
        Add to list
      </Btn>
      <Btn soon icon="users">
        Max per domain
      </Btn>
      <Btn icon="download" onClick={onExport} disabled={!onExport}>
        Export CSV
      </Btn>
      <Btn soon icon="send">
        Add to sequence
      </Btn>
      <Btn soon icon="sparkle" className="ai">
        Ask AI
      </Btn>
      <Btn soon icon="x" variant="danger">
        Delete
      </Btn>
    </div>
  )
}
