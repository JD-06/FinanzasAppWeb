import { useState } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import type { IncomeType, Frequency } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const TYPES: { value: IncomeType; label: string }[] = [
  { value: 'freelance', label: 'Freelance / Proyecto' },
  { value: 'otro',      label: 'Otro Ingreso Vario' },
]

export function GenericIncomeForm() {
  const { add: addIncome } = useIncomes()
  const { add: addRecurring } = useRecurringIncomes()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<IncomeType>('freelance')
  const [notes, setNotes] = useState('')
  
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency>('monthly')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    await addIncome.mutateAsync({ amount: Number(amount), date, type, notes: notes || undefined })

    if (isRecurring) {
      const d = new Date(date)
      if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
      if (frequency === 'weekly') d.setDate(d.getDate() + 7)
      if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1)
      const nextDate = d.toISOString().slice(0, 10)

      await addRecurring.mutateAsync({
        name: notes || 'Ingreso recurrente',
        amount: Number(amount),
        type,
        frequency,
        next_date: nextDate
      })
    }

    setAmount('')
    setNotes('')
    setIsRecurring(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Tipo de Ingreso</Label>
        <Select value={type} onValueChange={v => setType(v as IncomeType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Descripción</Label>
        <Input placeholder="Venta de bici, cliente nuevo..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Switch id="recurring_income_gen" checked={isRecurring} onCheckedChange={setIsRecurring} />
        <Label htmlFor="recurring_income_gen" className="cursor-pointer text-sm">Convertir en ingreso frecuente</Label>
      </div>

      {isRecurring && (
        <div className="space-y-1 pb-2">
          <Label>Frecuencia de este ingreso</Label>
          <Select value={frequency} onValueChange={(val: any) => setFrequency(val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={addIncome.isPending || addRecurring.isPending}>
        {addIncome.isPending || addRecurring.isPending ? 'Guardando...' : '+ Registrar ingreso'}
      </Button>
    </form>
  )
}
