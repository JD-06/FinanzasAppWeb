import type { Income, Expense, Debt } from '../supabase/client'
import { calcMonthlyIncome, calcMonthlyExpenses } from './engine'

export interface MonthProjection {
  month: string   // "YYYY-MM"
  income: number
  expenses: number
  debtPayments: number
  cashFlow: number
  cumulativeSavings: number
}

export function buildProjections(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  months: 12 | 24 | 36,
  annualInflation = 0.04,
  annualSalaryIncrease = 0.05
): MonthProjection[] {
  const today = new Date()
  const avgMonthlyIncome = calcMonthlyIncome(incomes, today.getFullYear(), today.getMonth())
  const avgMonthlyExpenses = calcMonthlyExpenses(expenses, today.getFullYear(), today.getMonth())
  const totalDebtPayments = debts.reduce((s, d) => s + d.monthly_payment, 0)

  const projections: MonthProjection[] = []
  let cumulativeSavings = 0

  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
    const yearFraction = i / 12
    const income = avgMonthlyIncome * Math.pow(1 + annualSalaryIncrease, yearFraction)
    const expensesAdj = avgMonthlyExpenses * Math.pow(1 + annualInflation, yearFraction)
    const cashFlow = income - expensesAdj - totalDebtPayments
    cumulativeSavings += Math.max(0, cashFlow)

    projections.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      income: Math.round(income),
      expenses: Math.round(expensesAdj),
      debtPayments: Math.round(totalDebtPayments),
      cashFlow: Math.round(cashFlow),
      cumulativeSavings: Math.round(cumulativeSavings),
    })
  }

  return projections
}
