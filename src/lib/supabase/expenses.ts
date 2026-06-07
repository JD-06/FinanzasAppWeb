import { supabase } from './client'
import type { Expense } from './client'

export async function getExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(id, name, icon, color)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addExpense(payload: {
  user_id: string
  category_id: string
  amount: number
  date: string
  payment_method: string
  status: 'pagado' | 'pendiente'
  is_msi: boolean
  msi_months: number
  notes?: string
}): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').insert(payload).select('*, categories(id, name, icon, color)').single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
