import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getDebts, addDebt, updateDebt, deleteDebt } from '@/lib/supabase/debts'
import type { Debt } from '@/lib/supabase/client'

export function useDebts() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['debts', userId],
    queryFn: () => getDebts(userId),
    enabled: !!userId,
  })

  const add = useMutation({
    mutationFn: (payload: Omit<Debt, 'id' | 'created_at'>) => addDebt(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>) =>
      updateDebt(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts', userId] }),
  })

  return { ...query, add, update, remove }
}
