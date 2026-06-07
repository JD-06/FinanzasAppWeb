import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getExpenses, addExpense, deleteExpense } from '@/lib/supabase/expenses'
import { getCategories } from '@/lib/supabase/categories'

export function useExpenses() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => getExpenses(userId),
    enabled: !!userId,
  })

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  })

  const add = useMutation({
    mutationFn: (payload: {
      category_id: string
      amount: number
      date: string
      payment_method: string
      status: 'pagado' | 'pendiente'
      is_msi: boolean
      msi_months: number
      notes?: string
    }) => addExpense({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', userId] }),
  })

  return { ...query, categories: categories.data ?? [], add, remove }
}
