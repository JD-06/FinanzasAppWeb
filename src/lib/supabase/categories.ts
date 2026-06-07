import { supabase } from './client'
import type { Category } from './client'

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}
