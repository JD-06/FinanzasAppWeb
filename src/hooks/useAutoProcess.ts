import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useRecurringIncomes } from './useRecurringIncomes'
import { useRecurring } from './useRecurring'
import { addIncomes } from '@/lib/supabase/incomes'
import { addExpense } from '@/lib/supabase/expenses'
import { updateRecurringIncome } from '@/lib/supabase/recurringIncomes'
import { updateRecurring } from '@/lib/supabase/recurring'
import type { Frequency } from '@/lib/supabase/client'

function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (frequency === 'weekly')    d.setDate(d.getDate() + 7)
  else if (frequency === 'quincenal') d.setDate(d.getDate() + 14)
  else if (frequency === 'monthly')   d.setMonth(d.getMonth() + 1)
  else                                d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function buildDueDates(from: string, frequency: Frequency): string[] {
  const today = new Date().toISOString().slice(0, 10)
  const dates: string[] = []
  let current = from
  while (current <= today) {
    dates.push(current)
    current = advanceDate(current, frequency)
  }
  return dates
}

function nextFutureDate(from: string, frequency: Frequency): string {
  const today = new Date().toISOString().slice(0, 10)
  let d = from
  while (d <= today) d = advanceDate(d, frequency)
  return d
}

export function useAutoProcess() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const processed = useRef(false)

  const riQuery = useRecurringIncomes()
  const reQuery = useRecurring()

  const ready = !!user && riQuery.isSuccess && reQuery.isSuccess

  useEffect(() => {
    if (!ready || processed.current) return
    processed.current = true

    const today = new Date().toISOString().slice(0, 10)
    const recurringIncomes = riQuery.data ?? []
    const recurringExpenses = reQuery.data ?? []

    async function run() {
      // ── Ingresos programados vencidos ────────────────────────────────────
      for (const ri of recurringIncomes) {
        if (ri.next_date > today) continue
        const dates = buildDueDates(ri.next_date, ri.frequency)
        if (dates.length === 0) continue

        await addIncomes(dates.map(date => ({
          user_id: user!.id,
          amount: ri.amount,
          date,
          type: ri.type,
          notes: ri.name,
        })))

        await updateRecurringIncome(ri.id, { next_date: nextFutureDate(ri.next_date, ri.frequency) })
      }

      // ── Gastos fijos vencidos (solo si tienen category_id guardado) ──────
      for (const re of recurringExpenses) {
        if (re.next_charge > today) continue
        if (!re.category_id) continue

        const dates = buildDueDates(re.next_charge, re.frequency)
        if (dates.length === 0) continue

        for (const date of dates) {
          await addExpense({
            user_id: user!.id,
            category_id: re.category_id,
            amount: re.amount,
            date,
            payment_method: 'Efectivo',
            status: 'pendiente',
            is_msi: false,
            msi_months: 0,
            notes: re.name,
          })
        }

        await updateRecurring(re.id, { next_charge: nextFutureDate(re.next_charge, re.frequency) })
      }

      qc.invalidateQueries({ queryKey: ['incomes', user!.id] })
      qc.invalidateQueries({ queryKey: ['expenses', user!.id] })
      qc.invalidateQueries({ queryKey: ['recurringIncomes', user!.id] })
      qc.invalidateQueries({ queryKey: ['recurring', user!.id] })
    }

    run().catch(console.error)
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps
}
