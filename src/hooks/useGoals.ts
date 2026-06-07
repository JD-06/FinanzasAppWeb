import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/supabase/goals'
import type { Goal } from '@/lib/supabase/client'

export function useGoals() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => getGoals(userId),
    enabled: !!userId,
  })

  const add = useMutation({
    mutationFn: (payload: Omit<Goal, 'id' | 'created_at'>) => addGoal(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) =>
      updateGoal(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })

  return { ...query, add, update, remove }
}
