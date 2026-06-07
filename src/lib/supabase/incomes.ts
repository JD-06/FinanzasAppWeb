import { supabase } from './client'
import type { Income, IncomeType } from './client'

export async function getIncomes(userId: string): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addIncome(payload: {
  user_id: string
  amount: number
  date: string
  type: IncomeType
  notes?: string
}): Promise<Income> {
  const { data, error } = await supabase.from('incomes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateIncome(
  id: string,
  payload: { amount?: number; date?: string; type?: IncomeType; notes?: string | null }
): Promise<Income> {
  const { data, error } = await supabase.from('incomes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function addIncomes(
  payloads: Array<{ user_id: string; amount: number; date: string; type: IncomeType; notes?: string }>
): Promise<Income[]> {
  if (payloads.length === 0) return []
  const { data, error } = await supabase.from('incomes').insert(payloads).select()
  if (error) throw error
  return data
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw error
}
