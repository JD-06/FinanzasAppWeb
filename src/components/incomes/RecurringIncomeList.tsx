import { useState, useEffect } from 'react'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { RecurringIncome, Frequency } from '@/lib/supabase/client'
import { calcBonoPorPago } from '@/lib/finance/engine'

const FREQ_LABELS: Record<Frequency, string> = {
  weekly: 'Semanal', quincenal: 'Quincenal', monthly: 'Mensual', yearly: 'Anual',
}

// ── Estado para edición simple (ingresos no-nómina) ─────────────────────────
interface SimpleEdit {
  income: RecurringIncome
  name: string
  amount: string
  frequency: Frequency
  next_date: string
}

// ── Estado para edición de nómina con desglose ──────────────────────────────
interface PayrollEdit {
  income: RecurringIncome
  name: string
  frequency: Frequency
  next_date: string
  base: string
  hasVales: boolean;      valesVal: string
  hasFondo: boolean;      fondoVal: string
  hasPrima: boolean;      primaVal: string
  hasAsistencia: boolean; asistenciaVal: string
  hasBono: boolean;       bonoVal: string
}

function estimateBase(total: number): number {
  // Reverse: total ≈ base * (1 + 0.05 + 0.035 + 0.06) + 500
  const est = Math.round((total - 500) / 1.145)
  return est > 0 ? est : total
}

export function RecurringIncomeList() {
  const { data: recurring = [], update, remove } = useRecurringIncomes()
  const [simpleEdit, setSimpleEdit] = useState<SimpleEdit | null>(null)
  const [payrollEdit, setPayrollEdit] = useState<PayrollEdit | null>(null)

  // ── Auto-recalcular prestaciones cuando cambia el sueldo base o la frecuencia
  const payrollBase = Number(payrollEdit?.base) || 0
  const payrollFrequency = payrollEdit?.frequency ?? 'monthly'
  useEffect(() => {
    if (!payrollEdit || payrollBase <= 0) return
    setPayrollEdit(s => s && ({
      ...s,
      valesVal: (payrollBase * 0.05).toFixed(2),
      fondoVal: (payrollBase * 0.035).toFixed(2),
      primaVal: (payrollBase * 0.50).toFixed(2),
      bonoVal:  calcBonoPorPago(payrollBase, s!.frequency).toFixed(2),
    }))
  }, [payrollBase, payrollFrequency])

  function openEdit(r: RecurringIncome) {
    if (r.type === 'Sueldo Base') {
      const base = estimateBase(r.amount)
      setPayrollEdit({
        income: r,
        name: r.name,
        frequency: r.frequency,
        next_date: r.next_date,
        base: String(base),
        hasVales: true,      valesVal: (base * 0.05).toFixed(2),
        hasFondo: true,      fondoVal: (base * 0.035).toFixed(2),
        hasPrima: false,     primaVal: (base * 0.50).toFixed(2),
        hasAsistencia: true, asistenciaVal: '500',
        hasBono: true,       bonoVal: calcBonoPorPago(base, r.frequency).toFixed(2),
      })
    } else {
      setSimpleEdit({
        income: r,
        name: r.name,
        amount: String(r.amount),
        frequency: r.frequency,
        next_date: r.next_date,
      })
    }
  }

  // ── Guardar edición simple ────────────────────────────────────────────────
  async function handleSaveSimple(e: React.FormEvent) {
    e.preventDefault()
    if (!simpleEdit) return
    await update.mutateAsync({
      id: simpleEdit.income.id,
      name: simpleEdit.name,
      amount: Number(simpleEdit.amount),
      frequency: simpleEdit.frequency,
      next_date: simpleEdit.next_date,
    })
    setSimpleEdit(null)
  }

  // ── Guardar edición de nómina ─────────────────────────────────────────────
  async function handleSavePayroll(e: React.FormEvent) {
    e.preventDefault()
    if (!payrollEdit) return

    const pe = payrollEdit
    const base    = Number(pe.base) || 0
    const vales   = pe.hasVales    ? (Number(pe.valesVal)    || 0) : 0
    const fondo   = pe.hasFondo    ? (Number(pe.fondoVal)    || 0) : 0
    const prima   = pe.hasPrima    ? (Number(pe.primaVal)    || 0) : 0
    const asist   = pe.hasAsistencia ? (Number(pe.asistenciaVal) || 0) : 0
    const bono    = pe.hasBono     ? (Number(pe.bonoVal)     || 0) : 0
    const total   = base + vales + fondo + prima + asist + bono

    await update.mutateAsync({
      id: pe.income.id,
      name: pe.name,
      amount: total,
      frequency: pe.frequency,
      next_date: pe.next_date,
    })
    setPayrollEdit(null)
  }

  if (recurring.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Sin ingresos programados.</p>
  }

  return (
    <>
      <ul className="space-y-3">
        {recurring.map(r => (
          <li key={r.id} className="flex items-center justify-between rounded-lg border p-4 bg-card hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-bold text-base">{r.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{FREQ_LABELS[r.frequency] ?? r.frequency}</Badge>
                <p className="text-xs text-muted-foreground">
                  Próximo: <span className="font-medium text-foreground">{r.next_date}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-emerald-500">${r.amount.toLocaleString('es-MX')}</p>
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="text-muted-foreground hover:text-foreground" title="Editar">✏️</Button>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(r.id)} className="text-destructive hover:bg-destructive/10" title="Eliminar">✕</Button>
            </div>
          </li>
        ))}
      </ul>

      {/* ── Dialog edición simple ─────────────────────────────────────────── */}
      <Dialog open={!!simpleEdit} onOpenChange={open => { if (!open) setSimpleEdit(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar ingreso programado</DialogTitle></DialogHeader>
          {simpleEdit && (
            <form onSubmit={handleSaveSimple} className="space-y-4">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={simpleEdit.name} onChange={e => setSimpleEdit(s => s && ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Monto ($)</Label>
                <Input type="number" min="0" step="0.01" value={simpleEdit.amount}
                  onChange={e => setSimpleEdit(s => s && ({ ...s, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Frecuencia</Label>
                <Select value={simpleEdit.frequency} onValueChange={v => setSimpleEdit(s => s && ({ ...s, frequency: v as Frequency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(FREQ_LABELS) as [Frequency, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Próxima fecha de pago</Label>
                <Input type="date" value={simpleEdit.next_date}
                  onChange={e => setSimpleEdit(s => s && ({ ...s, next_date: e.target.value }))} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSimpleEdit(null)}>Cancelar</Button>
                <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando...' : 'Guardar'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog edición nómina con desglose ───────────────────────────── */}
      <Dialog open={!!payrollEdit} onOpenChange={open => { if (!open) setPayrollEdit(null) }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Nómina Programada</DialogTitle></DialogHeader>
          {payrollEdit && (() => {
            const pe = payrollEdit
            const base  = Number(pe.base) || 0
            const vales = pe.hasVales    ? (Number(pe.valesVal)    || 0) : 0
            const fondo = pe.hasFondo    ? (Number(pe.fondoVal)    || 0) : 0
            const prima = pe.hasPrima    ? (Number(pe.primaVal)    || 0) : 0
            const asist = pe.hasAsistencia ? (Number(pe.asistenciaVal) || 0) : 0
            const bono  = pe.hasBono     ? (Number(pe.bonoVal)     || 0) : 0
            const total = base + vales + fondo + prima + asist + bono

            return (
              <form onSubmit={handleSavePayroll} className="space-y-4">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={pe.name} onChange={e => setPayrollEdit(s => s && ({ ...s, name: e.target.value }))} required />
                </div>

                <div className="space-y-1">
                  <Label>Sueldo Base Neto ($)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00"
                    value={pe.base}
                    onChange={e => setPayrollEdit(s => s && ({ ...s, base: e.target.value }))}
                    required
                  />
                </div>

                {/* Desglose de prestaciones */}
                <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prestaciones y Extras</p>

                  {[
                    { key: 'Vales',      has: pe.hasVales,    val: pe.valesVal,    setHas: (v: boolean) => setPayrollEdit(s => s && ({ ...s, hasVales: v })),    setVal: (v: string) => setPayrollEdit(s => s && ({ ...s, valesVal: v })) },
                    { key: 'Fondo Ahorro', has: pe.hasFondo,  val: pe.fondoVal,    setHas: (v: boolean) => setPayrollEdit(s => s && ({ ...s, hasFondo: v })),    setVal: (v: string) => setPayrollEdit(s => s && ({ ...s, fondoVal: v })) },
                    { key: 'Prima Vac.', has: pe.hasPrima,    val: pe.primaVal,    setHas: (v: boolean) => setPayrollEdit(s => s && ({ ...s, hasPrima: v })),    setVal: (v: string) => setPayrollEdit(s => s && ({ ...s, primaVal: v })) },
                    { key: 'Asistencia', has: pe.hasAsistencia, val: pe.asistenciaVal, setHas: (v: boolean) => setPayrollEdit(s => s && ({ ...s, hasAsistencia: v })), setVal: (v: string) => setPayrollEdit(s => s && ({ ...s, asistenciaVal: v })) },
                    { key: 'Bono',       has: pe.hasBono,     val: pe.bonoVal,     setHas: (v: boolean) => setPayrollEdit(s => s && ({ ...s, hasBono: v })),     setVal: (v: string) => setPayrollEdit(s => s && ({ ...s, bonoVal: v })) },
                  ].map(({ key, has, val, setHas, setVal }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={has} onCheckedChange={setHas} />
                        <Label className="cursor-pointer">{key}</Label>
                      </div>
                      {has && (
                        <Input type="number" step="0.01" className="w-28 h-8 text-right"
                          value={val} onChange={e => setVal(e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Total calculado */}
                <div className="bg-primary/10 p-3 rounded-lg border flex justify-between items-center">
                  <span className="font-medium text-sm">Nuevo total por pago:</span>
                  <span className="font-bold text-lg text-emerald-600">
                    ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Frecuencia</Label>
                    <Select value={pe.frequency} onValueChange={v => setPayrollEdit(s => s && ({ ...s, frequency: v as Frequency }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(FREQ_LABELS) as [Frequency, string][]).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Próxima fecha</Label>
                    <Input type="date" value={pe.next_date}
                      onChange={e => setPayrollEdit(s => s && ({ ...s, next_date: e.target.value }))} required />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPayrollEdit(null)}>Cancelar</Button>
                  <Button type="submit" disabled={update.isPending || total <= 0}>
                    {update.isPending ? 'Guardando...' : 'Guardar nómina'}
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
