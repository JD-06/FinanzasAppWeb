import type { Debt } from '../supabase/client'
import { calcDebtPayoff } from './engine'

export interface SimulatorInput {
  debt: Debt
  extraPayment: number
}

export interface SimulatorResult {
  baseMonths: number
  newMonths: number
  monthsSaved: number
  interestSaved: number
  newPayoffDate: Date
}

export function simulateExtraPayment(input: SimulatorInput): SimulatorResult {
  const { debt, extraPayment } = input
  const monthlyRate = debt.interest_rate / 12

  const base = calcDebtPayoff(debt.balance, debt.monthly_payment, monthlyRate)
  const newPayment = debt.monthly_payment + extraPayment
  const accelerated = calcDebtPayoff(debt.balance, newPayment, monthlyRate)

  return {
    baseMonths: base.months,
    newMonths: accelerated.months,
    monthsSaved: base.months === Infinity ? 0 : base.months - accelerated.months,
    interestSaved:
      base.totalInterest === Infinity ? 0 : base.totalInterest - accelerated.totalInterest,
    newPayoffDate: accelerated.payoffDate,
  }
}

export interface RentViabilityInput {
  freeCashFlow: number
  rentAmount: number
}

export interface RentViabilityResult {
  viable: boolean
  gap: number
  readyDate: Date | null
}

export function simulateRentViability(input: RentViabilityInput): RentViabilityResult {
  const { freeCashFlow, rentAmount } = input
  const gap = rentAmount - freeCashFlow

  if (freeCashFlow >= rentAmount) {
    return { viable: true, gap: 0, readyDate: new Date() }
  }

  // Estimate months assuming 5% monthly income growth
  let months = 0
  let currentFlow = freeCashFlow
  while (currentFlow < rentAmount && months < 120) {
    currentFlow *= 1.005
    months++
  }

  const readyDate = new Date()
  readyDate.setMonth(readyDate.getMonth() + months)

  return { viable: false, gap, readyDate: months < 120 ? readyDate : null }
}
