import { supabase } from './client'
import type { Goal } from './client'

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addGoal(payload: Omit<Goal, 'id' | 'created_at'>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateGoal(id: string, payload: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}
