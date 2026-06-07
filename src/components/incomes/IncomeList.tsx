import { useState, useMemo } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Income, IncomeType } from '@/lib/supabase/client'
import {
  type ListPeriod, LIST_PERIOD_LABELS,
  filterByListPeriod, navigatePeriod, periodRangeLabel, isRefInFuture,
} from '@/lib/finance/listFilter'

const TYPE_LABEL: Record<string, string> = {
  'Sueldo Base': 'Sueldo Base',
  'Vales de despensa': 'Vales',
  'Fondo ahorro empresa': 'Fondo Ahorro',
  'Premio asistencia': 'Asistencia',
  'Bono trimestral': 'Bono',
  'Prima vacacional': 'Prima Vac.',
  freelance: 'Freelance',
  otro: 'Otro',
}

const ALL_TYPES: IncomeType[] = [
  'Sueldo Base', 'Vales de despensa', 'Fondo ahorro empresa',
  'Premio asistencia', 'Bono trimestral', 'Prima vacacional',
  'freelance', 'otro',
]

// Tipos que se recalculan proporcionalmente cuando cambia el Sueldo Base
const PROPORTIONAL_TYPES: IncomeType[] = [
  'Vales de despensa',
  'Fondo ahorro empresa',
  'Bono trimestral',
]

interface EditState {
  income: Income
  amount: string
  date: string
  type: IncomeType
  notes: string
  siblings: Income[]
  checkedSiblings: Set<string>
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function IncomeList() {
  const { data: incomes = [], remove, update } = useIncomes()
  const [typeFilter, setTypeFilter] = useState('all')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [listPeriod, setListPeriod] = useState<ListPeriod>('month')
  const [refDate, setRefDate] = useState(() => new Date())

  const filtered = useMemo(() => {
    const byPeriod = filterByListPeriod(incomes, listPeriod, refDate)
    if (typeFilter === 'all') return byPeriod
    return byPeriod.filter(i => i.type === typeFilter)
  }, [incomes, typeFilter, listPeriod, refDate])

  function openEdit(income: Income) {
    const siblings = income.type === 'Sueldo Base'
      ? incomes.filter(i =>
          i.date === income.date &&
          i.id !== income.id &&
          PROPORTIONAL_TYPES.includes(i.type as IncomeType)
        )
      : []

    setEditing({
      income,
      amount: String(income.amount),
      date: income.date,
      type: income.type,
      notes: income.notes ?? '',
      siblings,
      checkedSiblings: new Set(siblings.map(s => s.id)),
    })
  }

  function toggleSibling(id: string) {
    setEditing(s => {
      if (!s) return s
      const next = new Set(s.checkedSiblings)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...s, checkedSiblings: next }
    })
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return

    const newBase = Number(editing.amount)
    const oldBase = editing.income.amount
    const ratio = oldBase > 0 ? newBase / oldBase : 1

    // Actualizar el registro principal
    await update.mutateAsync({
      id: editing.income.id,
      amount: newBase,
      date: editing.date,
      type: editing.type,
      notes: editing.notes || null,
    })

    // Actualizar subingresos seleccionados proporcionalmente
    for (const sibling of editing.siblings) {
      if (editing.checkedSiblings.has(sibling.id)) {
        await update.mutateAsync({
          id: sibling.id,
          amount: round2(sibling.amount * ratio),
          date: editing.date,
        })
      }
    }

    setEditing(null)
  }

  // Calcula el nuevo monto de un subingreso según el ratio actual
  function previewAmount(sibling: Income): number {
    if (!editing) return sibling.amount
    const newBase = Number(editing.amount) || 0
    const oldBase = editing.income.amount
    const ratio = oldBase > 0 ? newBase / oldBase : 1
    return round2(sibling.amount * ratio)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Botones de periodo */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(LIST_PERIOD_LABELS) as ListPeriod[]).map(p => (
            <Button
              key={p}
              variant={listPeriod === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setListPeriod(p)}
            >
              {LIST_PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>

        {/* Navegador de periodo */}
        {listPeriod !== 'all' && (
          <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
            <Button
              variant="ghost" size="sm" className="h-8 px-2 rounded-none"
              onClick={() => setRefDate(d => navigatePeriod(d, listPeriod, -1))}
            >‹</Button>
            <span className="px-2 text-xs font-medium text-center min-w-[110px]">
              {periodRangeLabel(listPeriod, refDate)}
            </span>
            <Button
              variant="ghost" size="sm" className="h-8 px-2 rounded-none"
              disabled={isRefInFuture(listPeriod, refDate)}
              onClick={() => setRefDate(d => navigatePeriod(d, listPeriod, 1))}
            >›</Button>
          </div>
        )}
      </div>

      {/* Filtro por tipo */}
      <div className="flex justify-end">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo de Ingreso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los ingresos</SelectItem>
            {ALL_TYPES.map(t => (
              <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vista móvil — tarjetas */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No hay ingresos para este filtro.</p>
        ) : (
          filtered.map((i: Income) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 bg-card gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className="text-[11px]">{TYPE_LABEL[i.type] ?? i.type}</Badge>
                  <span className="text-xs text-muted-foreground">{i.date}</span>
                </div>
                <p className="font-semibold text-green-600 dark:text-green-500">
                  + ${i.amount.toLocaleString('es-MX')}
                </p>
                {i.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{i.notes}</p>}
              </div>
              <div className="flex items-center shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => openEdit(i)}>✏️</Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => remove.mutate(i.id)}>✕</Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista desktop — tabla */}
      <div className="hidden md:block rounded-md border overflow-x-auto bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay ingresos para este filtro.
                </td>
              </tr>
            ) : (
              filtered.map((i: Income) => (
                <tr key={i.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">{i.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{TYPE_LABEL[i.type] ?? i.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{i.notes || '---'}</td>
                  <td className="px-4 py-3 font-medium text-green-600 dark:text-green-500">
                    + ${i.amount.toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(i)} className="text-muted-foreground hover:text-foreground" title="Editar">✏️</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove.mutate(i.id)} className="text-destructive hover:bg-destructive/10" title="Eliminar">✕</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar ingreso</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Monto ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.amount}
                    onChange={e => setEditing(s => s && ({ ...s, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={editing.date}
                    onChange={e => setEditing(s => s && ({ ...s, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={editing.type}
                  onValueChange={v => setEditing(s => s && ({ ...s, type: v as IncomeType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Notas</Label>
                <Input
                  value={editing.notes}
                  onChange={e => setEditing(s => s && ({ ...s, notes: e.target.value }))}
                  placeholder="Opcional..."
                />
              </div>

              {/* Subingresos proporcionales — solo aparece cuando editas Sueldo Base y hay registros vinculados */}
              {editing.siblings.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    También actualizar en esta fecha
                  </p>
                  {editing.siblings.map(sibling => {
                    const newAmt = previewAmount(sibling)
                    const changed = newAmt !== sibling.amount
                    return (
                      <div key={sibling.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`sib-${sibling.id}`}
                            checked={editing.checkedSiblings.has(sibling.id)}
                            onCheckedChange={() => toggleSibling(sibling.id)}
                          />
                          <Label htmlFor={`sib-${sibling.id}`} className="cursor-pointer text-sm font-normal">
                            {TYPE_LABEL[sibling.type] ?? sibling.type}
                          </Label>
                        </div>
                        <div className="text-sm text-right">
                          <span className="text-muted-foreground line-through mr-1">
                            ${sibling.amount.toLocaleString('es-MX')}
                          </span>
                          <span className={changed ? 'font-semibold text-emerald-600' : 'text-muted-foreground'}>
                            ${newAmt.toLocaleString('es-MX')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
