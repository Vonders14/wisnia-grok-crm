import type { ReactNode } from 'react'

export function FilterRail({
  children,
  onReset,
}: {
  children: ReactNode
  onReset?: () => void
}) {
  return (
    <aside className="rail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Filters</h3>
        {onReset && (
          <button type="button" className="btn" style={{ height: 28 }} onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      {children}
    </aside>
  )
}

export function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export function RailChecks({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      {options.map((opt) => (
        <label key={opt} className="rail-check">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  )
}
