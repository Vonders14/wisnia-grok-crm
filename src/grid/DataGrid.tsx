import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { DataGridProps, GridColumn } from './types'

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
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const c of columns) init[c.key] = c.defaultVisible !== false
    return init
  })
  const [pickerOpen, setPickerOpen] = useState(false)

  const shown = useMemo(
    () => columns.filter((c) => visible[c.key] !== false),
    [columns, visible],
  )

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => density,
    overscan: 12,
  })

  const totalWidth = shown.reduce((s, c) => s + (c.width ?? 140), 0)

  return (
    <div className="cg-root">
      <div className="cg-toolbar">
        <button type="button" className="btn" onClick={() => setPickerOpen((v) => !v)}>
          Columns
        </button>
        <span style={{ color: 'var(--cg-text-mute)' }}>
          {rows.length.toLocaleString()} rows in view
        </span>
        {pickerOpen && (
          <div className="col-picker">
            {columns.map((c) => (
              <label key={c.key}>
                <input
                  type="checkbox"
                  checked={visible[c.key] !== false}
                  onChange={() =>
                    setVisible((v) => ({ ...v, [c.key]: !(v[c.key] !== false) }))
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="cg-header-wrap">
        <div className="cg-header-gutter" onClick={onToggleSelectAll} title="Select page">
          <input
            type="checkbox"
            readOnly
            checked={!!rows.length && rows.every((r) => selectedIds?.has(rowId(r)))}
          />
        </div>
        <div className="cg-header-scroll">
          <div className="cg-header" style={{ width: totalWidth }}>
            {shown.map((c) => (
              <HeaderCell
                key={c.key}
                col={c}
                sorted={sortKey === c.key}
                dir={sortDir}
                onSort={onSort}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="cg-body" ref={parentRef}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: totalWidth + 44,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const row = rows[vi.index]
            const id = rowId(row)
            const selected = selectedIds?.has(id)
            const active = activeId === id
            return (
              <div
                key={id}
                className={`cg-row${selected ? ' selected' : ''}${active ? ' active' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                }}
                onClick={(e) => onRowClick?.(row, e)}
              >
                <div
                  className="cg-gutter"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect?.(id)
                  }}
                >
                  <input type="checkbox" readOnly checked={!!selected} />
                </div>
                {shown.map((c) => (
                  <div
                    key={c.key}
                    className={`cg-td${c.sticky ? ' sticky' : ''}`}
                    style={{
                      width: c.width ?? 140,
                      justifyContent:
                        c.align === 'center'
                          ? 'center'
                          : c.align === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                    }}
                    title={String(c.accessor(row) ?? '')}
                  >
                    {c.cell ? c.cell(row) : <span className="itxt">{fmt(c.accessor(row))}</span>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HeaderCell<T>({
  col,
  sorted,
  dir,
  onSort,
}: {
  col: GridColumn<T>
  sorted: boolean
  dir?: 'asc' | 'desc'
  onSort?: (key: string) => void
}) {
  return (
    <div
      className={`cg-th${col.sticky ? ' sticky' : ''}${sorted ? ' sorted' : ''}`}
      style={{ width: col.width ?? 140 }}
      onClick={() => col.sortable !== false && onSort?.(col.key)}
    >
      <span className="itxt">
        {col.label}
        {sorted ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
      </span>
    </div>
  )
}

function fmt(v: unknown): string {
  if (v == null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}
