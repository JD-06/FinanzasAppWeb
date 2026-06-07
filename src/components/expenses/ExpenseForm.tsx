import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Vales de despensa']

export function ExpenseForm() {
  const { add, categories } = useExpenses()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [status, setStatus] = useState<'pagado' | 'pendiente'>('pagado')
  const [isMsi, setIsMsi] = useState(false)
  const [msiMonths, setMsiMonths] = useState(3)
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await add.mutateAsync({ 
      amount: Number(amount), 
      date, 
      category_id: categoryId, 
      payment_method: paymentMethod, 
      status,
      is_msi: isMsi,
      msi_months: isMsi ? Number(msiMonths) : 0,
      notes: notes || undefined 
    })
    setAmount('')
    setNotes('')
    setIsMsi(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
          <Label>Método de pago</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pagado">Ya Pagado</SelectItem>
              <SelectItem value="pendiente">Próximo a Pagar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 py-2">
        <Switch id="msi" checked={isMsi} onCheckedChange={setIsMsi} />
        <Label htmlFor="msi" className="cursor-pointer">Compra a Meses (MSI)</Label>
      </div>

      {isMsi && (
        <div className="space-y-1 pb-2">
          <Label>Cantidad de Meses</Label>
          <Input type="number" min="2" max="48" value={msiMonths} onChange={e => setMsiMonths(Number(e.target.value))} required={isMsi} />
        </div>
      )}

      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Input placeholder="Supermercado Walmart..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending || !categoryId}>
        {add.isPending ? 'Guardando...' : '+ Registrar gasto'}
      </Button>
    </form>
  )
}
