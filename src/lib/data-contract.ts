/**
 * Typed port of wisnia-data-contract.js.
 * website is always the D365 form http://www.{bare-host}.
 */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function blank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

export function domain(value: unknown): string {
  let text = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!text) return ''
  const angleEmail = text.match(/<([^<>@\s]+@[^<>@\s]+)>/)
  if (angleEmail) text = angleEmail[1]
  if (text.includes('@') && !text.includes('://')) text = text.split('@').pop() ?? ''
  text = text
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./, '')
    .split(/[/?#\s]/)[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(text) ? text : ''
}

export function website(value: unknown): string | null {
  if (blank(value)) return null
  const host = domain(value)
  return host ? `http://www.${host}` : String(value).trim()
}

export function href(value: unknown): string {
  if (blank(value)) return ''
  const text = String(value).trim()
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    return url.toString()
  } catch {
    return ''
  }
}

export function email(value: unknown): string | null {
  return blank(value) ? null : String(value).trim().toLowerCase()
}

export function uuid(value: unknown): string | null {
  if (blank(value)) return null
  const text = String(value).trim()
  const bare = text.replace(/^\{|\}$/g, '')
  return UUID.test(bare) ? bare.toLowerCase() : text
}

export function isoDate(value: unknown): string | null {
  if (blank(value)) return null
  const text = value instanceof Date ? '' : String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00.000Z`
  const usDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (usDate) {
    const year = Number(usDate[3]) < 100 ? 2000 + Number(usDate[3]) : Number(usDate[3])
    return new Date(Date.UTC(year, Number(usDate[1]) - 1, Number(usDate[2]))).toISOString()
  }
  const parsed = value instanceof Date ? value : new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function bool(value: unknown): boolean | null {
  if (blank(value)) return null
  if (typeof value === 'boolean') return value
  if (value === 1 || value === 0) return value === 1
  const text = String(value).trim().toLowerCase()
  if (['true', 'yes', 'y', '1', '✓'].includes(text)) return true
  if (['false', 'no', 'n', '0'].includes(text)) return false
  return null
}

export function number(value: unknown): number | null {
  if (blank(value)) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).trim().replace(/[$,%\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export type FieldKind =
  | 'website'
  | 'domain'
  | 'email'
  | 'uuid'
  | 'date'
  | 'bool'
  | 'number'
  | 'phone'
  | 'enum'
  | 'text'

export function fieldKind(key: string, type?: string, value?: unknown): FieldKind {
  const name = String(key || '').toLowerCase()
  const hint = String(type || '').toLowerCase()
  if (hint === 'domain' || name === 'domain' || name.endsWith('_domain')) return 'domain'
  if (
    hint === 'email' ||
    hint === 'email-address' ||
    /(^|_)(email|email_address|contact_email|from_email|to_email|reply_to)(_|$)/.test(name)
  )
    return 'email'
  if (hint === 'uuid' || UUID.test(String(value ?? '').trim().replace(/^\{|\}$/g, ''))) return 'uuid'
  if (hint === 'date' || hint === 'timestamp' || /(_at|_date|_on)$/.test(name)) return 'date'
  if (hint === 'bool' || hint === 'boolean' || hint === 'checkbox') return 'bool'
  if (hint === 'num' || hint === 'number' || hint === 'currency' || hint === 'rating') return 'number'
  if (hint === 'phone' || hint === 'phone-number' || name.includes('phone')) return 'phone'
  if (name === 'website' || name === 'account_website') return 'website'
  if (hint === 'enum' || hint === 'select' || hint === 'status') return 'enum'
  return 'text'
}

export function contractValue(key: string, input: unknown, type?: string): unknown {
  switch (fieldKind(key, type, input)) {
    case 'website':
      return website(input)
    case 'domain':
      return domain(input) || null
    case 'email':
      return email(input)
    case 'uuid':
      return uuid(input)
    case 'date':
      return isoDate(input)
    case 'bool':
      return bool(input)
    case 'number':
      return number(input)
    case 'enum':
      return blank(input) ? null : String(input)
    case 'phone': {
      if (blank(input)) return null
      const trimmed = String(input).trim()
      return trimmed.startsWith("'") ? trimmed.slice(1) : trimmed
    }
    default:
      if (blank(input)) return null
      return typeof input === 'string' ? input.trim() : input
  }
}
