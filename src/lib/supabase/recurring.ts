import { supabase } from './client'
import type { RecurringExpense, Frequency } from './client'

export async function getRecurring(userId: string): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('next_charge', { ascending: true })
  if (error) throw error
  return data
}

export async function addRecurring(payload: {
  user_id: string
  name: string
  amount: number
  frequency: Frequency
  next_charge: string
  category_id?: string
}): Promise<RecurringExpense> {
  const { data, error } = await supabase.from('recurring_expenses').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateRecurring(
  id: string,
  payload: { name?: string; amount?: number; frequency?: Frequency; next_charge?: string }
): Promise<RecurringExpense> {
  const { data, error } = await supabase.from('recurring_expenses').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRecurring(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
  if (error) throw error
}
