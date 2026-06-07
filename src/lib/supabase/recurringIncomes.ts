import { supabase } from './client'
import type { RecurringIncome, Frequency, IncomeType } from './client'

export async function getRecurringIncomes(userId: string): Promise<RecurringIncome[]> {
  const { data, error } = await supabase
    .from('recurring_incomes')
    .select('*')
    .eq('user_id', userId)
    .order('next_date', { ascending: true })
  if (error) throw error
  return data
}

export async function addRecurringIncome(payload: {
  user_id: string
  name: string
  amount: number
  type: IncomeType
  frequency: Frequency
  next_date: string
}): Promise<RecurringIncome> {
  const { data, error } = await supabase.from('recurring_incomes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateRecurringIncome(
  id: string,
  payload: { name?: string; amount?: number; frequency?: Frequency; next_date?: string }
): Promise<RecurringIncome> {
  const { data, error } = await supabase.from('recurring_incomes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_incomes').delete().eq('id', id)
  if (error) throw error
}
