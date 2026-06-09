import { useMemo, useState } from 'react'
import { useIncomes } from './useIncomes'
import { useExpenses } from './useExpenses'
import { useDebts } from './useDebts'
import { useGoals } from './useGoals'
import { filterByPeriod, getExpenseAmountForPeriod, getMsiAmountPaidToDate, type Period } from '@/lib/finance/engine'

export function useDashboard() {
  const now = new Date()
  const [period, setPeriod] = useState<Period>('month')
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  const incomes = useIncomes()
  const expenses = useExpenses()
  const debts = useDebts()
  const goals = useGoals()

  const { globalStats, periodStats } = useMemo(() => {
    const allIncomes = incomes.data ?? []
    const allExpenses = expenses.data ?? []
    const allDebts = debts.data ?? []
    const allGoals = goals.data ?? []

    // Global Stats — siempre sobre todos los datos
    const totalValesIncomes = allIncomes.filter(i => i.type === 'Vales de despensa').reduce((s, i) => s + i.amount, 0)
    const totalValesExpenses = allExpenses.filter(e => e.payment_method === 'Vales de despensa').reduce((s, e) => s + e.amount, 0)
    const saldoVales = totalValesIncomes - totalValesExpenses

    const saldoFondo = allIncomes.filter(i => i.type === 'Fondo ahorro empresa').reduce((s, i) => s + i.amount, 0)

    const totalRealMoneyIncomes = allIncomes.filter(i => i.type !== 'Vales de despensa' && i.type !== 'Fondo ahorro empresa').reduce((s, i) => s + i.amount, 0)
    const totalRealMoneyExpenses = allExpenses
      .filter(e => e.payment_method !== 'Vales de despensa')
      .reduce((s, e) => s + getMsiAmountPaidToDate(e), 0)
    const saldoEfectivo = totalRealMoneyIncomes - totalRealMoneyExpenses

    const totalDebt = allDebts.reduce((s, d) => s + d.balance, 0)
    const totalSavings = allGoals.reduce((s, g) => s + g.current_amount, 0)
    const netLiquidity = saldoEfectivo + saldoVales + saldoFondo
    const netWorth = (netLiquidity + totalSavings) - totalDebt

    const globalStats = { totalDebt, totalSavings, netLiquidity, netWorth, saldoEfectivo, saldoVales, saldoFondo }

    // Period Stats — filtradas por año/mes seleccionado
    const periodIncomes = filterByPeriod(allIncomes, period, selectedYear, selectedMonth)

    const income = periodIncomes.reduce((s, i) => s + i.amount, 0)
    let expense = 0, realExpenses = 0, valesExpenses = 0
    for (const e of allExpenses) {
      const amt = getExpenseAmountForPeriod(e, period, selectedYear, selectedMonth)
      if (amt === 0) continue
      expense += amt
      if (e.payment_method === 'Vales de despensa') valesExpenses += amt
      else realExpenses += amt
    }
    const freeCashFlow = income - expense

    const periodStats = { income, expense, realExpenses, valesExpenses, freeCashFlow }

    return { globalStats, periodStats }
  }, [incomes.data, expenses.data, debts.data, goals.data, period, selectedYear, selectedMonth])

  const isLoading = incomes.isLoading || expenses.isLoading || debts.isLoading || goals.isLoading

  // Años disponibles en los datos
  const availableYears = useMemo(() => {
    const all = [
      ...(incomes.data ?? []).map(i => new Date(i.date + 'T00:00:00').getFullYear()),
      ...(expenses.data ?? []).map(e => new Date(e.date + 'T00:00:00').getFullYear()),
    ]
    const years = Array.from(new Set(all)).sort()
    if (!years.includes(now.getFullYear())) years.push(now.getFullYear())
    return years
  }, [incomes.data, expenses.data])

  return {
    period, setPeriod,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    availableYears,
    globalStats,
    periodStats,
    incomes: incomes.data ?? [],
    expenses: expenses.data ?? [],
    debts: debts.data ?? [],
    goals: goals.data ?? [],
    isLoading,
  }
}
