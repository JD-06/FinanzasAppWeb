import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getRecurringIncomes, addRecurringIncome, updateRecurringIncome, deleteRecurringIncome } from '@/lib/supabase/recurringIncomes'
import type { Frequency, IncomeType } from '@/lib/supabase/client'

export function useRecurringIncomes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['recurringIncomes', userId],
    queryFn: () => getRecurringIncomes(userId),
    enabled: !!userId,
  })

  const add = useMutation({
    mutationFn: (payload: {
      name: string
      amount: number
      type: IncomeType
      frequency: Frequency
      next_date: string
    }) => addRecurringIncome({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurringIncomes', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; amount?: number; frequency?: Frequency; next_date?: string }) =>
      updateRecurringIncome(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurringIncomes', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteRecurringIncome,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurringIncomes', userId] }),
  })

  return { ...query, add, update, remove }
}
