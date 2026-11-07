import { format, parseISO, isValid } from 'date-fns'

/** Convert ISO string to value for <input type="datetime-local"> */
export function toLocalInput(iso?: string): string {
  if (!iso) return ''
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

/** Convert datetime-local value to ISO */
export function fromLocalInput(value: string): string {
  if (!value) return new Date().toISOString()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return new Date().toISOString()
  return d.toISOString()
}

export function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, 'yyyy-MM-dd')
}
