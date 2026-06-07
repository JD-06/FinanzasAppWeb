import { describe, it, expect } from 'vitest'
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcFreeCashFlow,
  calcDebtPayoff,
  calcGoalMonthlySaving,
  calcGoalProgress,
} from './engine'

describe('calcMonthlyIncome', () => {
  it('sums income amounts for a given month', () => {
    const incomes = [
      { amount: 10000, date: '2026-06-01', type: 'nomina' },
      { amount: 5000, date: '2026-06-15', type: 'bono' },
      { amount: 3000, date: '2026-05-30', type: 'nomina' },
    ] as any
    expect(calcMonthlyIncome(incomes, 2026, 5)).toBe(10000 + 5000)
  })
})

describe('calcMonthlyExpenses', () => {
  it('sums expenses for a given month', () => {
    const expenses = [
      { amount: 500, date: '2026-06-03' },
      { amount: 200, date: '2026-06-10' },
      { amount: 100, date: '2026-07-01' },
    ] as any
    expect(calcMonthlyExpenses(expenses, 2026, 5)).toBe(700)
  })
})

describe('calcFreeCashFlow', () => {
  it('returns income minus expenses minus total debt payments', () => {
    expect(calcFreeCashFlow(20000, 8000, 4000)).toBe(8000)
  })
})

describe('calcDebtPayoff', () => {
  it('returns months to payoff with 0% interest', () => {
    const result = calcDebtPayoff(12000, 2000, 0)
    expect(result.months).toBe(6)
    expect(result.totalInterest).toBe(0)
  })

  it('calculates payoff months with interest', () => {
    const result = calcDebtPayoff(10000, 500, 0.02) // 2% monthly
    expect(result.months).toBeGreaterThan(20)
    expect(result.totalInterest).toBeGreaterThan(0)
  })

  it('returns Infinity when payment does not cover interest', () => {
    const result = calcDebtPayoff(10000, 100, 0.05)
    expect(result.months).toBe(Infinity)
  })
})

describe('calcGoalMonthlySaving', () => {
  it('divides remaining amount by months left', () => {
    const result = calcGoalMonthlySaving(60000, 12000, '2027-06-01', '2026-06-01')
    expect(result).toBeCloseTo(4000)
  })
})

describe('calcGoalProgress', () => {
  it('returns percentage 0-100', () => {
    expect(calcGoalProgress(30000, 60000)).toBe(50)
    expect(calcGoalProgress(60000, 60000)).toBe(100)
    expect(calcGoalProgress(0, 60000)).toBe(0)
  })
})
