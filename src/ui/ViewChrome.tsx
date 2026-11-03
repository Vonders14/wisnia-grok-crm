import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Btn, FilterChip } from './Button'
import { Icon } from '@/icons/Icon'

export function TopBar({
  icon,
  iconColor = '#6366f1',
  title,
  right,
}: {
  icon?: string
  iconColor?: string
  title: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="top">
      <div className="crumb">
        {icon && (
          <span className="vic" style={{ background: iconColor }}>
            <Icon name={icon} size="sm" />
          </span>
        )}
        {title}
      </div>
      <div className="right">
        {right}
        <Btn soon icon="share">
          Share
        </Btn>
        <Btn soon icon="sparkle">
          Ask AI
        </Btn>
      </div>
    </div>
  )
}

export function ViewBar({
  viewLabel,
  viewIcon = 'table',
  viewColor = '#22c55e',
  count,
  chips,
  onClearChip,
  sortLabel,
  onSortPick,
  sortOptions,
  filterSlot,
  primaryLabel = 'New record',
  extra,
  layoutToggle,
}: {
  viewLabel: string
  viewIcon?: string
  viewColor?: string
  count?: number
  chips?: { id: string; label: string }[]
  onClearChip?: (id: string) => void
  sortLabel?: string
  onSortPick?: (key: string) => void
  sortOptions?: { key: string; label: string }[]
  filterSlot?: ReactNode
  primaryLabel?: string
  extra?: ReactNode
  layoutToggle?: ReactNode
}) {
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <>
      <div className="bar">
        <button type="button" className="btn">
          <span className="vic" style={{ background: viewColor }}>
            <Icon name={viewIcon} size="sm" />
          </span>
          {viewLabel}
          <Icon name="chevron" size="sm" />
        </button>
        <Btn icon="sliders" soon>
          View settings
        </Btn>
        {layoutToggle}
        <div className="right">
          {typeof count === 'number' && (
            <span className="muted" style={{ fontSize: 12.5 }}>
              {count.toLocaleString()} records
            </span>
          )}
          <Btn soon icon="upload">
            Import / Export
          </Btn>
          <Btn variant="pri" soon icon="plus">
            {primaryLabel}
          </Btn>
        </div>
      </div>
      <div className="bar2">
        <div className="popover-anchor" ref={sortRef}>
          <Btn
            icon="sort"
            className={sortLabel ? 'active' : undefined}
            onClick={() => setSortOpen((v) => !v)}
          >
            {sortLabel ? `Sorted by ${sortLabel}` : 'Sort'}
          </Btn>
          {sortOpen && sortOptions && (
            <div className="popover-panel pop" style={{ top: 34, left: 0 }}>
              {sortOptions.map((o) => (
                <div
                  key={o.key}
                  className="mi"
                  onClick={() => {
                    onSortPick?.(o.key)
                    setSortOpen(false)
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="popover-anchor" ref={filterRef}>
          <Btn icon="filter" onClick={() => setFilterOpen((v) => !v)}>
            Filter
          </Btn>
          {filterOpen && filterSlot && (
            <div className="popover-panel pop" style={{ top: 34, left: 0, minWidth: 260 }}>
              {filterSlot}
            </div>
          )}
        </div>
        {(chips || []).map((c) => (
          <FilterChip key={c.id} label={c.label} onClear={() => onClearChip?.(c.id)} />
        ))}
        {extra}
        <div className="right" />
      </div>
    </>
  )
}
