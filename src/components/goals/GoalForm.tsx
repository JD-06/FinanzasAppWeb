import { useState } from 'react'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GoalForm() {
  const { add } = useGoals()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({
      user_id: user!.id,
      name,
      target_amount: Number(targetAmount),
      current_amount: 0,
      target_date: targetDate || null,
    })
    setName(''); setTargetAmount(''); setTargetDate('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Nombre de la meta</Label>
        <Input placeholder="Enganche de casa..." value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto objetivo ($)</Label>
          <Input type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha objetivo (opcional)</Label>
          <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        {add.isPending ? 'Guardando...' : '+ Crear meta'}
      </Button>
    </form>
  )
}
