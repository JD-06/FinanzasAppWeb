import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getRecurring, addRecurring, updateRecurring, deleteRecurring } from '@/lib/supabase/recurring'
import type { Frequency } from '@/lib/supabase/client'

export function useRecurring() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['recurring', userId],
    queryFn: () => getRecurring(userId),
    enabled: !!userId,
  })

  const add = useMutation({
    mutationFn: (payload: {
      name: string
      amount: number
      frequency: Frequency
      next_charge: string
      category_id?: string
    }) => addRecurring({ ...payload, user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', userId] }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; amount?: number; frequency?: Frequency; next_charge?: string }) =>
      updateRecurring(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', userId] }),
  })

  const remove = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', userId] }),
  })

  return { ...query, add, update, remove }
}
