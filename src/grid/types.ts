import type { MouseEvent, ReactNode } from 'react'

export interface GridColumn<T> {
  key: string
  label: string
  width?: number
  sticky?: boolean
  sortable?: boolean
  defaultVisible?: boolean
  align?: 'left' | 'center' | 'right'
  accessor: (row: T) => unknown
  cell?: (row: T) => ReactNode
}

export interface DataGridProps<T> {
  rows: T[]
  columns: GridColumn<T>[]
  rowId: (row: T) => string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  selectedIds?: Set<string>
  activeId?: string | null
  onRowClick?: (row: T, e: MouseEvent) => void
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
  density?: number
}
