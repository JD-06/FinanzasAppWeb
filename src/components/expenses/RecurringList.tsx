import { useState } from 'react'
import { useRecurring } from '@/hooks/useRecurring'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { RecurringExpense, Frequency } from '@/lib/supabase/client'

const FREQ_LABELS: Record<Frequency, string> = {
  monthly: 'Mes', weekly: 'Semana', yearly: 'Año', quincenal: 'Quincena',
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (frequency === 'weekly')         d.setDate(d.getDate() + 7)
  else if (frequency === 'quincenal') d.setDate(d.getDate() + 14)
  else if (frequency === 'monthly')   d.setMonth(d.getMonth() + 1)
  else                                d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function RecurringList() {
  const { data: recurring = [], remove, update } = useRecurring()
  const { add: addExpense, categories } = useExpenses()
  const [payDialog, setPayDialog] = useState<RecurringExpense | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')

  function openPay(r: RecurringExpense) {
    setPayDialog(r)
    setAmount(String(r.amount))
    setCategoryId(r.category_id ?? '')
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!payDialog || !categoryId) return

    const today = new Date().toISOString().slice(0, 10)

    await addExpense.mutateAsync({
      category_id: categoryId,
      amount: Number(amount),
      date: today,
      payment_method: 'Efectivo',
      status: 'pagado',
      is_msi: false,
      msi_months: 0,
      notes: payDialog.name,
    })

    // Advance next_charge to next cycle
    const today2 = today
    let next = payDialog.next_charge
    while (next <= today2) next = advanceDate(next, payDialog.frequency)

    await update.mutateAsync({ id: payDialog.id, next_charge: next })
    setPayDialog(null)
  }

  if (recurring.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Sin suscripciones registradas.</p>
  }

  return (
    <>
      <ul className="space-y-3">
        {recurring.map(r => {
          const days = daysUntil(r.next_charge)
          const isOverdue = days < 0
          const isDueToday = days === 0
          const isDueSoon = days > 0 && days <= 3

          return (
            <li key={r.id} className="flex items-center justify-between rounded-lg border p-4 bg-card hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">{r.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">Por {FREQ_LABELS[r.frequency] ?? r.frequency}</Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px]">
                      {Math.abs(days)}d atrasado
                    </Badge>
                  )}
                  {isDueToday && (
                    <Badge className="text-[10px] bg-orange-500 hover:bg-orange-500">Vence hoy</Badge>
                  )}
                  {isDueSoon && (
                    <Badge variant="secondary" className="text-[10px]">En {days}d</Badge>
                  )}
                  {!isOverdue && !isDueToday && (
                    <p className="text-xs text-muted-foreground">
                      Próximo cobro: <span className="font-medium text-foreground">{r.next_charge}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <p className="font-bold text-destructive">${r.amount.toLocaleString('es-MX')}</p>
                {(isOverdue || isDueToday) && (
                  <Button variant="outline" size="sm" className="text-xs h-7 border-orange-400 text-orange-600 hover:bg-orange-50"
                    onClick={() => openPay(r)}>
                    Pagar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(r.id)}
                  className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0">✕</Button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* ── Dialog de pago manual ─────────────────────────────────────── */}
      <Dialog open={!!payDialog} onOpenChange={open => { if (!open) setPayDialog(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago — {payDialog?.name}</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-1">
                <Label>Monto ($)</Label>
                <Input type="number" min="0" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona una categoría..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
                <Button type="submit" disabled={!categoryId || addExpense.isPending || update.isPending}>
                  {addExpense.isPending ? 'Guardando...' : 'Confirmar pago'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
