import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from '@/icons/Icon'

const SOON = 'Coming soon (read-only)'

export function Btn({
  children,
  variant = 'default',
  size,
  icon,
  soon,
  className,
  title,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'pri' | 'ghost' | 'danger' | 'icon' | 'sm' | 'active'
  size?: 'sm' | 'icon'
  icon?: string
  soon?: boolean
  children?: ReactNode
}) {
  const classes = [
    'btn',
    variant === 'pri' && 'pri',
    variant === 'ghost' && 'ghost',
    variant === 'danger' && 'danger',
    variant === 'icon' && 'icon',
    variant === 'active' && 'active',
    (size === 'sm' || variant === 'sm') && 'sm',
    soon && 'tip',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || soon}
      title={soon ? SOON : title}
      data-tip={soon ? SOON : undefined}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />}
      {children}
    </button>
  )
}

export function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="st">
      <span className="dot" style={{ background: color }} />
      {label}
    </span>
  )
}

export function TagChip({
  label,
  color = '#8b5cf6',
}: {
  label: string
  color?: string
}) {
  return (
    <span
      className="chip"
      style={{
        background: color + '18',
        color,
        borderColor: color + '33',
      }}
    >
      {label}
    </span>
  )
}

export function RelChip({
  kind,
  label,
}: {
  kind: 'person' | 'company'
  label: string
}) {
  return (
    <span className={`chip rel${kind === 'person' ? ' p' : ''}`}>
      {kind === 'person' ? (
        <span
          className="av"
          style={{
            width: 16,
            height: 16,
            fontSize: 8,
            background: '#6366f1',
            color: '#fff',
          }}
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <span
          className="co"
          style={{ width: 16, height: 16, fontSize: 9, background: '#3b82f6' }}
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </span>
  )
}

export function FilterChip({
  label,
  onClear,
}: {
  label: string
  onClear?: () => void
}) {
  return (
    <span className="fchip">
      <b>{label}</b>
      {onClear && (
        <span className="x" onClick={onClear} role="button" tabIndex={0}>
          <Icon name="x" size="sm" />
        </span>
      )}
    </span>
  )
}
