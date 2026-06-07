import { useState } from 'react'
import { useDebts } from '@/hooks/useDebts'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DebtForm() {
  const { add } = useDebts()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [monthly, setMonthly] = useState('')
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({
      user_id: user!.id,
      name,
      balance: Number(balance),
      monthly_payment: Number(monthly),
      interest_rate: Number(rate) / 100,
      start_date: startDate,
    })
    setName(''); setBalance(''); setMonthly(''); setRate('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Nombre de la deuda</Label>
        <Input placeholder="Tarjeta Banamex..." value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Saldo actual ($)</Label>
          <Input type="number" min="0" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Pago mensual ($)</Label>
          <Input type="number" min="0" step="0.01" value={monthly} onChange={e => setMonthly(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tasa anual (%)</Label>
          <Input type="number" min="0" step="0.1" placeholder="24.5" value={rate} onChange={e => setRate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Fecha inicio</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        {add.isPending ? 'Guardando...' : '+ Agregar deuda'}
      </Button>
    </form>
  )
}
