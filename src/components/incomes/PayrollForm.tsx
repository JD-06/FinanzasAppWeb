import { useState, useEffect, useMemo } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import type { Frequency, IncomeType } from '@/lib/supabase/client'
import { calcBonoPorPago } from '@/lib/finance/engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

const FREQ_LABELS: Record<Frequency, string> = {
  weekly: 'Semanal (cada 7 días)',
  quincenal: 'Quincenal (cada 14 días)',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const FREQ_DAYS: Record<Frequency, number | null> = {
  weekly: 7,
  quincenal: 14,
  monthly: null,
  yearly: null,
}

function buildPaymentDates(startDate: string, frequency: Frequency): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let current = new Date(startDate + 'T00:00:00')

  while (current <= today) {
    dates.push(current.toISOString().slice(0, 10))
    const days = FREQ_DAYS[frequency]
    if (days !== null) {
      current.setDate(current.getDate() + days)
    } else if (frequency === 'monthly') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setFullYear(current.getFullYear() + 1)
    }
  }

  return dates
}

export function PayrollForm() {
  const { addBatch } = useIncomes()
  const { add: addRecurring } = useRecurringIncomes()

  const [baseAmount, setBaseAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [notes, setNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  const [hasVales, setHasVales] = useState(true)
  const [hasFondo, setHasFondo] = useState(true)
  const [hasPrima, setHasPrima] = useState(false)
  const [hasAsistencia, setHasAsistencia] = useState(true)
  const [hasBono, setHasBono] = useState(false)

  const [valesVal, setValesVal] = useState('')
  const [fondoVal, setFondoVal] = useState('')
  const [primaVal, setPrimaVal] = useState('')
  const [asistenciaVal, setAsistenciaVal] = useState('500')
  const [bonoVal, setBonoVal] = useState('')

  const base = Number(baseAmount) || 0

  useEffect(() => {
    if (base > 0) {
      setValesVal((base * 0.05).toFixed(2))
      setFondoVal((base * 0.035).toFixed(2))
      setPrimaVal((base * 0.50).toFixed(2))
      setBonoVal(calcBonoPorPago(base, frequency).toFixed(2))
    }
  }, [base, frequency])

  const valesNum = hasVales ? (Number(valesVal) || 0) : 0
  const fondoNum = hasFondo ? (Number(fondoVal) || 0) : 0
  const primaNum = hasPrima ? (Number(primaVal) || 0) : 0
  const asistenciaNum = hasAsistencia ? (Number(asistenciaVal) || 0) : 0
  const bonoNum = hasBono ? (Number(bonoVal) || 0) : 0
  const total = base + valesNum + fondoNum + primaNum + asistenciaNum + bonoNum

  // Fechas retroactivas: desde la fecha elegida hasta hoy
  const paymentDates = useMemo(() => buildPaymentDates(date, frequency), [date, frequency])
  const isRetroactive = paymentDates.length > 1

  function buildPayloadsForDate(d: string): Array<{ amount: number; date: string; type: IncomeType; notes?: string }> {
    const rows: Array<{ amount: number; date: string; type: IncomeType; notes?: string }> = []
    if (base > 0)        rows.push({ amount: base,         date: d, type: 'Sueldo Base',         notes: notes || 'Sueldo Base' })
    if (valesNum > 0)    rows.push({ amount: valesNum,     date: d, type: 'Vales de despensa',    notes: 'Vales de Despensa (5%)' })
    if (fondoNum > 0)    rows.push({ amount: fondoNum,     date: d, type: 'Fondo ahorro empresa', notes: 'Fondo de Ahorro (3.5%)' })
    if (primaNum > 0)    rows.push({ amount: primaNum,     date: d, type: 'Prima vacacional',     notes: 'Prima Vacacional (50%)' })
    if (asistenciaNum > 0) rows.push({ amount: asistenciaNum, date: d, type: 'Premio asistencia', notes: 'Premio de Asistencia' })
    if (bonoNum > 0)     rows.push({ amount: bonoNum,      date: d, type: 'Bono trimestral',      notes: 'Bono Trimestral Mensualizado (6%)' })
    return rows
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (total <= 0) return

    const allPayloads = paymentDates.flatMap(d => buildPayloadsForDate(d))
    await addBatch.mutateAsync(allPayloads)

    if (isRecurring) {
      const lastDate = paymentDates[paymentDates.length - 1]
      const next = new Date(lastDate + 'T00:00:00')
      const days = FREQ_DAYS[frequency]
      if (days !== null) next.setDate(next.getDate() + days)
      else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1)
      else next.setFullYear(next.getFullYear() + 1)

      await addRecurring.mutateAsync({
        name: notes || 'Nómina',
        amount: total,
        type: 'Sueldo Base',
        frequency,
        next_date: next.toISOString().slice(0, 10),
      })
    }

    setBaseAmount('')
    setNotes('')
    setIsRecurring(false)
  }

  const isPending = addBatch.isPending || addRecurring.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Sueldo Base Neto ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={baseAmount}
          onChange={e => setBaseAmount(e.target.value)}
          required
        />
      </div>

      <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
        <p className="text-sm font-semibold text-muted-foreground mb-2">PRESTACIONES Y EXTRAS</p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="vales" checked={hasVales} onCheckedChange={setHasVales} />
            <Label htmlFor="vales" className="cursor-pointer">Vales de Despensa</Label>
          </div>
          {hasVales && <Input type="number" step="0.01" className="w-24 h-8 text-right" value={valesVal} onChange={e => setValesVal(e.target.value)} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="fondo" checked={hasFondo} onCheckedChange={setHasFondo} />
            <Label htmlFor="fondo" className="cursor-pointer">Fondo de Ahorro</Label>
          </div>
          {hasFondo && <Input type="number" step="0.01" className="w-24 h-8 text-right" value={fondoVal} onChange={e => setFondoVal(e.target.value)} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="prima" checked={hasPrima} onCheckedChange={setHasPrima} />
            <Label htmlFor="prima" className="cursor-pointer">Prima Vacacional</Label>
          </div>
          {hasPrima && <Input type="number" step="0.01" className="w-24 h-8 text-right" value={primaVal} onChange={e => setPrimaVal(e.target.value)} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="asis" checked={hasAsistencia} onCheckedChange={setHasAsistencia} />
            <Label htmlFor="asis" className="cursor-pointer">Premio Asistencia</Label>
          </div>
          {hasAsistencia && <Input type="number" step="0.01" className="w-24 h-8 text-right" value={asistenciaVal} onChange={e => setAsistenciaVal(e.target.value)} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="bono" checked={hasBono} onCheckedChange={setHasBono} />
            <Label htmlFor="bono" className="cursor-pointer">Bono Trimestral</Label>
          </div>
          {hasBono && <Input type="number" step="0.01" className="w-24 h-8 text-right" value={bonoVal} onChange={e => setBonoVal(e.target.value)} />}
        </div>
      </div>

      {/* Frecuencia — siempre visible */}
      <div className="space-y-1">
        <Label>Frecuencia de pago</Label>
        <Select value={frequency} onValueChange={v => setFrequency(v as Frequency)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(FREQ_LABELS) as [Frequency, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Fecha del primer pago (o pago actual)</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>

      {/* Preview retroactivo */}
      {isRetroactive && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 space-y-2">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Se generarán <strong>{paymentDates.length} pagos</strong> retroactivos
          </p>
          <div className="flex flex-wrap gap-1">
            {paymentDates.map(d => (
              <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Total a registrar: <strong>${(total * paymentDates.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
      )}

      <div className="bg-primary/10 p-3 rounded-lg border flex justify-between items-center">
        <span className="font-medium text-sm">Total por pago:</span>
        <span className="font-bold text-lg text-emerald-600">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      </div>

      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Input placeholder="Empresa XYZ..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center space-x-2 py-1">
        <Switch id="recurring_payroll" checked={isRecurring} onCheckedChange={setIsRecurring} />
        <Label htmlFor="recurring_payroll" className="cursor-pointer text-sm">Programar como ingreso frecuente</Label>
      </div>

      <Button type="submit" className="w-full" disabled={isPending || total <= 0}>
        {isPending
          ? 'Guardando...'
          : isRetroactive
            ? `Guardar ${paymentDates.length} pagos`
            : 'Guardar Nómina'}
      </Button>
    </form>
  )
}
