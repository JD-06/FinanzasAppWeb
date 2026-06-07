import { useState } from 'react'
import type { Goal } from '@/lib/supabase/client'
import { calcGoalProgress, calcGoalMonthlySaving } from '@/lib/finance/engine'
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

interface Props { goal: Goal }

export function GoalCard({ goal }: Props) {
  const { update, remove } = useGoals()
  const [addAmount, setAddAmount] = useState('')
  const pct = calcGoalProgress(goal.current_amount, goal.target_amount)

  const reqMonthly = goal.target_date
    ? calcGoalMonthlySaving(goal.target_amount, goal.current_amount, goal.target_date)
    : null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addAmount) return
    const val = Number(addAmount)
    await update.mutateAsync({ id: goal.id, current_amount: goal.current_amount + val })
    setAddAmount('')
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{goal.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => remove.mutate(goal.id)}>✕</Button>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${goal.current_amount.toLocaleString('es-MX')}</span>
          <span>${goal.target_amount.toLocaleString('es-MX')}</span>
        </div>
        {reqMonthly !== null && reqMonthly > 0 && (
          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            Faltan ${Math.round(reqMonthly).toLocaleString('es-MX')} al mes para llegar en {new Date(goal.target_date! + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
          </p>
        )}
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input type="number" step="0.01" min="0" placeholder="Abonar..." value={addAmount} onChange={e => setAddAmount(e.target.value)} className="h-8 text-sm" required />
          <Button type="submit" size="sm" className="h-8" disabled={update.isPending}>Abonar</Button>
        </form>
      </CardContent>
    </Card>
  )
}
