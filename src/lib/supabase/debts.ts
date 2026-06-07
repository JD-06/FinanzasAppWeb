import { supabase } from './client'
import type { Debt } from './client'

export async function getDebts(userId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addDebt(payload: Omit<Debt, 'id' | 'created_at'>): Promise<Debt> {
  const { data, error } = await supabase.from('debts').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateDebt(id: string, payload: Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>): Promise<Debt> {
  const { data, error } = await supabase.from('debts').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}
