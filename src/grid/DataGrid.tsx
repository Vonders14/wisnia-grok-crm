import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { DataGridProps } from './types'
import { Icon } from '@/icons/Icon'

export function DataGrid<T>({
  rows,
  columns,
  rowId,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  activeId,
  onRowClick,
  onToggleSelect,
  onToggleSelectAll,
  density = 36,
}: DataGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const shown = useMemo(
    () => columns.filter((c) => c.defaultVisible !== false),
    [columns],
  )

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => density,
    overscan: 14,
  })

  const totalWidth =
    36 + shown.reduce((s, c) => s + (c.width ?? 140), 0) + 80
  const allSelected = !!rows.length && rows.every((r) => selectedIds?.has(rowId(r)))
  const someSelected = rows.some((r) => selectedIds?.has(rowId(r)))

  return (
    <div className="content" ref={parentRef} data-testid="data-grid">
      <div style={{ height: virtualizer.getTotalSize() + 68, width: totalWidth, position: 'relative' }}>
        <table className="tbl" style={{ width: totalWidth }}>
          <thead>
            <tr>
              <th className="ck">
                <input
                  className={`cb${someSelected && !allSelected ? ' mixed' : ''}`}
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleSelectAll?.()}
                  aria-label="Select all"
                />
              </th>
              {shown.map((c, idx) => (
                <th
                  key={c.key}
                  className={idx === 0 ? 'nm' : undefined}
                  style={{ width: c.width ?? 140, minWidth: c.width ?? 140 }}
                  onClick={() => c.sortable !== false && onSort?.(c.key)}
                >
                  <div className="th">
                    <Icon name="list" size="sm" />
                    {c.label}
                    {sortKey === c.key && (
                      <span className="sarr">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="add fill">+</th>
            </tr>
          </thead>
        </table>

        <div style={{ position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const row = rows[vi.index]
            const id = rowId(row)
            const selected = selectedIds?.has(id)
            const active = activeId === id
            return (
              <div
                key={id}
                className={`tbl-row${selected ? ' sel' : ''}${active ? ' active-row' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                  display: 'flex',
                  borderBottom: '1px solid var(--b)',
                  background: selected ? 'var(--selrow)' : '#fff',
                  cursor: 'pointer',
                }}
                onClick={(e) => onRowClick?.(row, e)}
                onMouseEnter={(e) => {
                  if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#fafafb'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = selected
                    ? 'var(--selrow)'
                    : '#fff'
                }}
              >
                <div
                  className="ck"
                  style={{
                    width: 36,
                    flex: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'sticky',
                    left: 0,
                    background: 'inherit',
                    zIndex: 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect?.(id)
                  }}
                >
                  <input className="cb" type="checkbox" readOnly checked={!!selected} />
                </div>
                {shown.map((c, idx) => (
                  <div
                    key={c.key}
                    style={{
                      width: c.width ?? 140,
                      minWidth: c.width ?? 140,
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 10px',
                      borderRight: '1px solid var(--b)',
                      overflow: 'hidden',
                      justifyContent:
                        c.align === 'right'
                          ? 'flex-end'
                          : c.align === 'center'
                            ? 'center'
                            : 'flex-start',
                      position: idx === 0 ? 'sticky' : undefined,
                      left: idx === 0 ? 36 : undefined,
                      background: idx === 0 ? 'inherit' : undefined,
                      zIndex: idx === 0 ? 2 : undefined,
                      boxShadow: idx === 0 ? '1px 0 0 var(--b)' : undefined,
                    }}
                    title={String(c.accessor(row) ?? '')}
                  >
                    {c.cell ? c.cell(row) : <span>{fmt(c.accessor(row))}</span>}
                  </div>
                ))}
                <div style={{ flex: 1 }} />
              </div>
            )
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            top: virtualizer.getTotalSize() + 34,
            left: 0,
            width: totalWidth,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid var(--b)',
            color: 'var(--t3)',
            fontSize: 12.5,
            background: '#fff',
          }}
        >
          <div style={{ width: 36 }} />
          <div style={{ padding: '0 10px' }}>{rows.length.toLocaleString()} count</div>
        </div>
      </div>
    </div>
  )
}

function fmt(v: unknown): string {
  if (v == null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}
