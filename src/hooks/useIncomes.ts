import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getIncomes, addIncome, addIncomes, updateIncome, deleteIncome } from '@/lib/supabase/incomes'
import type { IncomeType } from '@/lib/supabase/client'

export function useIncomes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => getIncomes(userId),
    enabled: !!userId,
  })

  const add = useMutation({
    mutationFn: (payload: { amount: number; date: string; type: IncomeType; notes?: string }) =>
      addIncome({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  const addBatch = useMutation({
    mutationFn: (payloads: Array<{ amount: number; date: string; type: IncomeType; notes?: string }>) =>
      addIncomes(payloads.map(p => ({ ...p, user_id: userId }))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; amount?: number; date?: string; type?: IncomeType; notes?: string | null }) =>
      updateIncome(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes', userId] }),
  })

  return { ...query, add, addBatch, update, remove }
}
