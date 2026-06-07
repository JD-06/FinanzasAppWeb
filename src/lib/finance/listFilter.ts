export type ListPeriod = 'day' | 'week' | 'month' | 'year' | 'all'

export const LIST_PERIOD_LABELS: Record<ListPeriod, string> = {
  day: 'Día', week: 'Semana', month: 'Mes', year: 'Año', all: 'Todo',
}

function getWeekStart(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  return start
}

export function filterByListPeriod<T extends { date: string }>(
  items: T[],
  period: ListPeriod,
  ref: Date
): T[] {
  if (period === 'all') return items
  return items.filter(item => {
    const d = new Date(item.date + 'T00:00:00')
    if (period === 'year')  return d.getFullYear() === ref.getFullYear()
    if (period === 'month') return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
    if (period === 'day')   return item.date === ref.toISOString().slice(0, 10)
    if (period === 'week') {
      const start = getWeekStart(ref)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return d >= start && d < end
    }
    return true
  })
}

export function navigatePeriod(ref: Date, period: ListPeriod, dir: 1 | -1): Date {
  const d = new Date(ref)
  if (period === 'year')       d.setFullYear(d.getFullYear() + dir)
  else if (period === 'month') d.setMonth(d.getMonth() + dir)
  else if (period === 'week')  d.setDate(d.getDate() + dir * 7)
  else if (period === 'day')   d.setDate(d.getDate() + dir)
  return d
}

export function periodRangeLabel(period: ListPeriod, ref: Date): string {
  if (period === 'all') return 'Todo el historial'
  if (period === 'year') return String(ref.getFullYear())
  if (period === 'month') return ref.toLocaleString('es-MX', { month: 'long', year: 'numeric' })
  if (period === 'day')
    return ref.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (period === 'week') {
    const start = getWeekStart(ref)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  return ''
}

export function isRefInFuture(period: ListPeriod, ref: Date): boolean {
  const now = new Date()
  if (period === 'day')   return ref.toISOString().slice(0, 10) >= now.toISOString().slice(0, 10)
  if (period === 'week')  return getWeekStart(ref) >= getWeekStart(now)
  if (period === 'month') return ref.getFullYear() > now.getFullYear() || (ref.getFullYear() === now.getFullYear() && ref.getMonth() >= now.getMonth())
  if (period === 'year')  return ref.getFullYear() >= now.getFullYear()
  return false
}
