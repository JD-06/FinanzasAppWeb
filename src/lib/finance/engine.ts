import type { Income, Expense, Debt, Frequency } from '../supabase/client'

// Pagos que caben en un trimestre (3 meses) por frecuencia
const PERIODS_PER_QUARTER: Record<Frequency, number> = {
  monthly:  3,
  quincenal: 6,
  weekly:   13,
  yearly:   0.25,
}

/**
 * Bono trimestral por pago.
 * El bono TOTAL por trimestre = base × 6%.
 * Se divide entre los pagos que hay en ese trimestre según la frecuencia:
 *   mensual → base×2%, quincenal → base×1%, semanal → base×~0.46%
 */
export function calcBonoPorPago(base: number, frequency: Frequency): number {
  return (base * 0.06) / PERIODS_PER_QUARTER[frequency]
}

export type Period = 'week' | 'month' | 'year' | 'all'

function isDateInPeriod(d: Date, period: Period, refYear: number, refMonth: number, now: Date): boolean {
  if (period === 'all') return true
  if (period === 'year') return d.getFullYear() === refYear
  if (period === 'month') return d.getFullYear() === refYear && d.getMonth() === refMonth
  if (period === 'week') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff)
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7)
    return d >= startOfWeek && d < endOfWeek
  }
  return true
}

// Returns the portion of an MSI expense's amount that falls within the given period.
// Non-MSI expenses return the full amount if purchased in that period, else 0.
// MSI expenses spread installments across months and count those in the period.
export function getExpenseAmountForPeriod(
  e: Expense,
  period: Period,
  refYear: number,
  refMonth: number
): number {
  if (period === 'all') return e.amount
  const now = new Date()
  const purchaseDate = new Date(e.date + 'T00:00:00')
  if (!e.is_msi || e.msi_months <= 1) {
    return isDateInPeriod(purchaseDate, period, refYear, refMonth, now) ? e.amount : 0
  }
  const installment = e.amount / e.msi_months
  let count = 0
  for (let i = 0; i < e.msi_months; i++) {
    const d = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + i, purchaseDate.getDate())
    if (isDateInPeriod(d, period, refYear, refMonth, now)) count++
  }
  return installment * count
}

// Splits an expense into its individual occurrences with their effective date and amount.
// Non-MSI expenses return a single occurrence on the purchase date for the full amount.
// MSI expenses return one occurrence per installment, each on its monthly due date.
export function getExpenseOccurrences(e: Expense): { date: Date; amount: number }[] {
  const purchaseDate = new Date(e.date + 'T00:00:00')
  if (!e.is_msi || e.msi_months <= 1) {
    return [{ date: purchaseDate, amount: e.amount }]
  }
  const installment = e.amount / e.msi_months
  const occurrences: { date: Date; amount: number }[] = []
  for (let i = 0; i < e.msi_months; i++) {
    const d = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + i, purchaseDate.getDate())
    occurrences.push({ date: d, amount: installment })
  }
  return occurrences
}

// For global balance: only count installments already charged (due date <= today).
export function getMsiAmountPaidToDate(e: Expense): number {
  if (!e.is_msi || e.msi_months <= 1) return e.amount
  const now = new Date()
  const purchaseDate = new Date(e.date + 'T00:00:00')
  const installment = e.amount / e.msi_months
  let count = 0
  for (let i = 0; i < e.msi_months; i++) {
    const d = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + i, purchaseDate.getDate())
    if (d <= now) count++
  }
  return installment * count
}

export function filterByPeriod<T extends { date: string }>(
  items: T[],
  period: Period,
  selectedYear?: number,
  selectedMonth?: number
): T[] {
  if (period === 'all') return items

  const now = new Date()
  const refYear = selectedYear ?? now.getFullYear()
  const refMonth = selectedMonth ?? now.getMonth()

  return items.filter(item => {
    const d = new Date(item.date + 'T00:00:00')
    if (period === 'year') {
      return d.getFullYear() === refYear
    }
    if (period === 'month') {
      return d.getFullYear() === refYear && d.getMonth() === refMonth
    }
    if (period === 'week') {
      // Semana actual — el año seleccionado no aplica aquí
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const startOfWeek = new Date(today.setDate(diff))
      return d >= startOfWeek
    }
    return true
  })
}

// Returns 0-based month index (0 = January)
function sameMonth(date: string, year: number, month: number): boolean {
  const d = new Date(date + 'T00:00:00')
  return d.getFullYear() === year && d.getMonth() === month
}

export function calcMonthlyIncome(incomes: Income[], year: number, month: number): number {
  return incomes
    .filter(i => sameMonth(i.date, year, month))
    .reduce((sum, i) => sum + i.amount, 0)
}

export function calcMonthlyExpenses(expenses: Expense[], year: number, month: number): number {
  return expenses
    .filter(e => sameMonth(e.date, year, month))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function calcFreeCashFlow(
  monthlyIncome: number,
  monthlyExpenses: number,
  totalDebtPayments: number
): number {
  return monthlyIncome - monthlyExpenses - totalDebtPayments
}

export interface DebtPayoffResult {
  months: number
  totalInterest: number
  payoffDate: Date
}

export function calcDebtPayoff(
  balance: number,
  monthlyPayment: number,
  monthlyRate: number
): DebtPayoffResult {
  if (monthlyRate === 0) {
    const months = Math.ceil(balance / monthlyPayment)
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    return { months, totalInterest: 0, payoffDate }
  }

  const interest = balance * monthlyRate
  if (monthlyPayment <= interest) {
    return { months: Infinity, totalInterest: Infinity, payoffDate: new Date(8640000000000000) }
  }

  let remaining = balance
  let months = 0
  let totalInterest = 0

  while (remaining > 0.01 && months < 600) {
    const monthInterest = remaining * monthlyRate
    totalInterest += monthInterest
    remaining = remaining + monthInterest - monthlyPayment
    months++
  }

  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)
  return { months, totalInterest, payoffDate }
}

export function calcGoalMonthlySaving(
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
  today: string = new Date().toISOString().slice(0, 10)
): number {
  const target = new Date(targetDate + 'T00:00:00')
  const now = new Date(today + 'T00:00:00')
  const monthsLeft =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  if (monthsLeft <= 0) return targetAmount - currentAmount
  return (targetAmount - currentAmount) / monthsLeft
}

export function calcGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 100
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100))
}

export function calcTotalDebtPayments(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.monthly_payment, 0)
}

export function calcNetWorth(
  _totalIncome: number,
  _totalExpenses: number,
  totalDebts: number,
  totalSavings: number
): number {
  return totalSavings - totalDebts
}
