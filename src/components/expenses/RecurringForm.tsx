import { useState } from 'react'
import { useRecurring } from '@/hooks/useRecurring'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Frequency } from '@/lib/supabase/client'

export function RecurringForm() {
  const { add: addRecurring } = useRecurring()
  const { add: addExpense, categories } = useExpenses()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const today = new Date().toISOString().slice(0, 10)
    let finalNextCharge = date
    
    // Auto add expense if date <= today
    if (date <= today) {
      await addExpense.mutateAsync({
        amount: Number(amount),
        date: date,
        category_id: categoryId,
        payment_method: 'Efectivo',
        status: 'pagado',
        is_msi: false,
        msi_months: 0,
        notes: `Suscripción: ${name}`
      })
      
      // Advance to next cycle
      const d = new Date(date)
      if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
      if (frequency === 'weekly') d.setDate(d.getDate() + 7)
      if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1)
      finalNextCharge = d.toISOString().slice(0, 10)
    }

    // Add recurring expense with correct next date (includes category_id so auto-process can use it)
    await addRecurring.mutateAsync({ name, amount: Number(amount), frequency, next_charge: finalNextCharge, category_id: categoryId })

    setName('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Servicio (Ej. Internet, Netflix)</Label>
        <Input placeholder="Nombre del servicio" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Monto</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Frecuencia</Label>
          <Select value={frequency} onValueChange={(val: any) => setFrequency(val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Próxima fecha de cobro (Corte)</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={addRecurring.isPending || !categoryId}>
        {addRecurring.isPending ? 'Guardando...' : '+ Añadir Gasto Fijo'}
      </Button>
    </form>
  )
}
