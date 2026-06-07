import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Income, Expense } from '@/lib/supabase/client'
import type { Period } from '@/lib/finance/engine'

interface Props {
  incomes: Income[]
  expenses: Expense[]
  period: Period
  selectedYear: number
  selectedMonth: number
}

export function PeriodChart({ incomes, expenses, period, selectedYear, selectedMonth }: Props) {
  let data: { label: string; Ingresos: number; Gastos: number }[] = []

  const today = new Date()

  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      data.push({
        label: d.toLocaleDateString('es', { weekday: 'short' }),
        Ingresos: incomes.filter(inc => inc.date === dateStr).reduce((s, x) => s + x.amount, 0),
        Gastos: expenses.filter(exp => exp.date === dateStr).reduce((s, x) => s + x.amount, 0),
      })
    }
  } else if (period === 'month') {
    for (let i = 0; i < 4; i++) {
      data.push({ label: `Semana ${i + 1}`, Ingresos: 0, Gastos: 0 })
    }
    incomes
      .filter(i => {
        const d = new Date(i.date + 'T00:00:00')
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      })
      .forEach(i => {
        const day = new Date(i.date + 'T00:00:00').getDate()
        data[Math.min(Math.floor((day - 1) / 7), 3)].Ingresos += i.amount
      })
    expenses
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00')
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      })
      .forEach(e => {
        const day = new Date(e.date + 'T00:00:00').getDate()
        data[Math.min(Math.floor((day - 1) / 7), 3)].Gastos += e.amount
      })
  } else if (period === 'year') {
    for (let i = 0; i < 12; i++) {
      data.push({
        label: new Date(selectedYear, i, 1).toLocaleString('es', { month: 'short' }),
        Ingresos: 0,
        Gastos: 0,
      })
    }
    incomes
      .filter(i => new Date(i.date + 'T00:00:00').getFullYear() === selectedYear)
      .forEach(i => { data[new Date(i.date + 'T00:00:00').getMonth()].Ingresos += i.amount })
    expenses
      .filter(e => new Date(e.date + 'T00:00:00').getFullYear() === selectedYear)
      .forEach(e => { data[new Date(e.date + 'T00:00:00').getMonth()].Gastos += e.amount })
  } else {
    // All time — por año
    const allIncYears = incomes.map(i => new Date(i.date + 'T00:00:00').getFullYear())
    const allExpYears = expenses.map(e => new Date(e.date + 'T00:00:00').getFullYear())
    let minYear = Math.min(...allIncYears, ...allExpYears, today.getFullYear())
    if (!isFinite(minYear)) minYear = today.getFullYear()
    const maxYear = today.getFullYear()
    for (let y = minYear; y <= maxYear; y++) {
      data.push({ label: String(y), Ingresos: 0, Gastos: 0 })
    }
    incomes.forEach(i => {
      const y = new Date(i.date + 'T00:00:00').getFullYear()
      const idx = y - minYear
      if (data[idx]) data[idx].Ingresos += i.amount
    })
    expenses.forEach(e => {
      const y = new Date(e.date + 'T00:00:00').getFullYear()
      const idx = y - minYear
      if (data[idx]) data[idx].Gastos += e.amount
    })
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString('es-MX')}`} cursor={{ fill: 'transparent' }} />
        <Legend />
        <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
