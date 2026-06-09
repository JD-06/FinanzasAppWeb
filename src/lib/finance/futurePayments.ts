import type { RecurringExpense, RecurringIncome, Frequency } from '../supabase/client'
import type { ListPeriod } from './listFilter'

export interface FuturePaymentItem {
  id: string
  name: string
  amount: number
  frequency: Frequency
  occurrences: Date[]
  total: number
  nextDate: Date
}

export interface FuturePaymentsResult {
  expenses: FuturePaymentItem[]
  incomes: FuturePaymentItem[]
  totalExpenses: number
  totalIncomes: number
  windowStart: Date
  windowEnd: Date
}

function advanceByFrequency(date: Date, frequency: Frequency): Date {
  const d = new Date(date)
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'quincenal': d.setDate(d.getDate() + 15); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

function goBackByFrequency(date: Date, frequency: Frequency): Date {
  const d = new Date(date)
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() - 7); break
    case 'quincenal': d.setDate(d.getDate() - 15); break
    case 'monthly':   d.setMonth(d.getMonth() - 1); break
    case 'yearly':    d.setFullYear(d.getFullYear() - 1); break
  }
  return d
}

function getOccurrencesInRange(
  nextDate: string,
  frequency: Frequency,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  const occurrences: Date[] = []
  let current = new Date(nextDate + 'T00:00:00')

  if (current > windowStart) {
    // next_date is ahead of windowStart — go back to find earlier occurrences in the window
    let guard = 0
    while (guard < 1000) {
      const prev = goBackByFrequency(current, frequency)
      if (prev.getTime() === current.getTime() || prev < windowStart) break
      current = prev
      guard++
    }
  } else {
    // Advance to first occurrence on/after window start
    let guard = 0
    while (current < windowStart && guard < 1000) {
      const next = advanceByFrequency(current, frequency)
      if (next.getTime() === current.getTime()) break
      current = next
      guard++
    }
  }

  // Collect all occurrences within window
  let count = 0
  while (current <= windowEnd && count < 500) {
    if (current >= windowStart) occurrences.push(new Date(current))
    const next = advanceByFrequency(current, frequency)
    if (next.getTime() === current.getTime()) break
    current = next
    count++
  }

  return occurrences
}

export function getPeriodWindow(period: ListPeriod, ref: Date = new Date()): { start: Date; end: Date } {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())

  if (period === 'week') {
    const end = new Date(today)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59)
    return { start: today, end }
  }
  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    end.setHours(23, 59, 59)
    return { start, end }
  }
  if (period === 'year') {
    const end = new Date(today.getFullYear(), 11, 31)
    end.setHours(23, 59, 59)
    return { start: today, end }
  }
  // 'day' or 'all': próximos 30 días
  const end = new Date(today)
  end.setDate(end.getDate() + 30)
  end.setHours(23, 59, 59)
  return { start: today, end }
}

export function computeFuturePayments(
  recurringExpenses: RecurringExpense[],
  recurringIncomes: RecurringIncome[],
  period: ListPeriod,
  ref: Date = new Date()
): FuturePaymentsResult {
  const { start, end } = getPeriodWindow(period, ref)

  const expenses: FuturePaymentItem[] = []
  for (const r of recurringExpenses) {
    const occurrences = getOccurrencesInRange(r.next_charge, r.frequency, start, end)
    if (occurrences.length > 0) {
      expenses.push({
        id: r.id,
        name: r.name,
        amount: r.amount,
        frequency: r.frequency,
        occurrences,
        total: r.amount * occurrences.length,
        nextDate: occurrences[0],
      })
    }
  }

  const incomes: FuturePaymentItem[] = []
  for (const r of recurringIncomes) {
    const occurrences = getOccurrencesInRange(r.next_date, r.frequency, start, end)
    if (occurrences.length > 0) {
      incomes.push({
        id: r.id,
        name: r.name,
        amount: r.amount,
        frequency: r.frequency,
        occurrences,
        total: r.amount * occurrences.length,
        nextDate: occurrences[0],
      })
    }
  }

  expenses.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
  incomes.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())

  return {
    expenses,
    incomes,
    totalExpenses: expenses.reduce((s, e) => s + e.total, 0),
    totalIncomes: incomes.reduce((s, i) => s + i.total, 0),
    windowStart: start,
    windowEnd: end,
  }
}
