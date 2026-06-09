import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { useRecurring } from '@/hooks/useRecurring'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import { useIncomes } from '@/hooks/useIncomes'
import { useExpenses } from '@/hooks/useExpenses'
import { useDebts } from '@/hooks/useDebts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { RecurringExpense, RecurringIncome, Frequency } from '@/lib/supabase/client'

// ── helpers ──────────────────────────────────────────────────────────────────

function advance(date: Date, freq: Frequency): Date {
  const d = new Date(date)
  if (freq === 'weekly')    d.setDate(d.getDate() + 7)
  if (freq === 'quincenal') d.setDate(d.getDate() + 15)
  if (freq === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (freq === 'yearly')    d.setFullYear(d.getFullYear() + 1)
  return d
}

function toMonthly(amount: number, freq: Frequency): number {
  if (freq === 'weekly')    return amount * 4.33
  if (freq === 'quincenal') return amount * 2
  if (freq === 'monthly')   return amount
  if (freq === 'yearly')    return amount / 12
  return amount
}

interface DayPoint {
  dateStr: string
  label: string
  balance: number
  inflow: number
  outflow: number
}

function buildProjection(
  startBalance: number,
  recurringExpenses: RecurringExpense[],
  recurringIncomes: RecurringIncome[],
  dailyVar: number,
  days: number,
  today: Date
): DayPoint[] {
  // Build cash-flow map: date → {inflow, outflow}
  const map: Record<string, { inflow: number; outflow: number }> = {}
  const ensure = (k: string) => { if (!map[k]) map[k] = { inflow: 0, outflow: 0 } }

  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)

  for (const r of recurringIncomes) {
    let d = new Date(r.next_date + 'T00:00:00')
    let g = 0; while (d < today && g++ < 800) d = advance(d, r.frequency)
    let c = 0; while (d <= end && c++ < 400) { ensure(d.toISOString().slice(0,10)); map[d.toISOString().slice(0,10)].inflow += r.amount; d = advance(d, r.frequency) }
  }

  for (const r of recurringExpenses) {
    let d = new Date(r.next_charge + 'T00:00:00')
    let g = 0; while (d < today && g++ < 800) d = advance(d, r.frequency)
    let c = 0; while (d <= end && c++ < 400) { ensure(d.toISOString().slice(0,10)); map[d.toISOString().slice(0,10)].outflow += r.amount; d = advance(d, r.frequency) }
  }

  const points: DayPoint[] = []
  let balance = startBalance
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const cf = map[key] ?? { inflow: 0, outflow: 0 }
    balance = balance + cf.inflow - cf.outflow - dailyVar
    points.push({
      dateStr: key,
      label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      balance: Math.round(balance),
      inflow: cf.inflow,
      outflow: cf.outflow,
    })
  }
  return points
}

function findExtreme(points: DayPoint[], mode: 'best' | 'worst'): { start: string; end: string; avg: number } {
  if (points.length === 0) return { start: '', end: '', avg: 0 }
  const w = Math.min(7, points.length)
  let best = mode === 'best' ? -Infinity : Infinity
  let idx = 0
  for (let i = 0; i <= points.length - w; i++) {
    const avg = points.slice(i, i + w).reduce((s, p) => s + p.balance, 0) / w
    if (mode === 'best' ? avg > best : avg < best) { best = avg; idx = i }
  }
  return { start: points[idx].dateStr, end: points[Math.min(idx + w - 1, points.length - 1)].dateStr, avg: Math.round(best) }
}

function avgLastMonths<T extends { date: string }>(items: T[], getAmount: (i: T) => number, months = 3): number {
  const now = new Date()
  const totals: number[] = []
  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const sum = items
      .filter(x => { const xd = new Date(x.date + 'T00:00:00'); return xd.getFullYear() === d.getFullYear() && xd.getMonth() === d.getMonth() })
      .reduce((s, x) => s + getAmount(x), 0)
    if (sum > 0) totals.push(sum)
  }
  return totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0
}

// ── small stat widget ─────────────────────────────────────────────────────────

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${color === 'green' ? 'text-emerald-600' : color === 'red' ? 'text-destructive' : ''}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}

// ── main component ────────────────────────────────────────────────────────────

export function CashFlowSimulator() {
  const { data: recurringExpenses = [] } = useRecurring()
  const { data: recurringIncomes = [] } = useRecurringIncomes()
  const { data: allIncomes = [] } = useIncomes()
  const { data: allExpenses = [] } = useExpenses()
  const { data: debts = [] } = useDebts()

  const [horizon, setHorizon] = useState<7 | 30 | 60 | 90>(30)
  const [varOverride, setVarOverride] = useState('')
  const [checkAmount, setCheckAmount] = useState('')

  const today = useMemo(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  // ── data derivations ──────────────────────────────────────────────────────

  // Current real-money balance
  const saldoEfectivo = useMemo(() => {
    const income = allIncomes
      .filter(i => i.type !== 'Vales de despensa' && i.type !== 'Fondo ahorro empresa')
      .reduce((s, i) => s + i.amount, 0)
    const expense = allExpenses
      .filter(e => e.payment_method !== 'Vales de despensa')
      .reduce((s, e) => s + e.amount, 0)
    return Math.round(income - expense)
  }, [allIncomes, allExpenses])

  // Scheduled monthly amounts
  const monthlyFixed = useMemo(() =>
    Math.round(recurringExpenses.reduce((s, r) => s + toMonthly(r.amount, r.frequency), 0)),
    [recurringExpenses])

  const monthlyScheduledIncome = useMemo(() =>
    Math.round(recurringIncomes.reduce((s, r) => s + toMonthly(r.amount, r.frequency), 0)),
    [recurringIncomes])

  // Historical averages (last 3 months)
  const avgMonthlyVar = useMemo(() =>
    avgLastMonths(
      allExpenses.filter(e => e.payment_method !== 'Vales de despensa'),
      e => e.amount
    ),
    [allExpenses])

  const avgMonthlyHistIncome = useMemo(() =>
    avgLastMonths(
      allIncomes.filter(i => i.type !== 'Vales de despensa' && i.type !== 'Fondo ahorro empresa'),
      i => i.amount
    ),
    [allIncomes])

  const totalDebtMonthly = useMemo(() => debts.reduce((s, d) => s + d.monthly_payment, 0), [debts])

  // Effective values for simulation
  const effectiveIncome = monthlyScheduledIncome > 0 ? monthlyScheduledIncome : avgMonthlyHistIncome
  const effectiveVar = varOverride !== '' ? (Number(varOverride) || 0) : avgMonthlyVar
  const dailyVar = effectiveVar / 30
  const netMonthly = effectiveIncome - monthlyFixed - effectiveVar - totalDebtMonthly

  // ── projection ────────────────────────────────────────────────────────────

  const projection = useMemo(() =>
    buildProjection(saldoEfectivo, recurringExpenses, recurringIncomes, dailyVar, horizon, today),
    [saldoEfectivo, recurringExpenses, recurringIncomes, dailyVar, horizon, today])

  const chartData = useMemo(() => {
    if (horizon <= 30) return projection
    const step = horizon <= 60 ? 2 : 3
    return projection.filter((_, i) => i % step === 0)
  }, [projection, horizon])

  const horizonLabel: Record<7 | 30 | 60 | 90, string> = { 7: 'semana', 30: '30 días', 60: '60 días', 90: '90 días' }

  const minBalance = projection.length ? Math.min(...projection.map(p => p.balance)) : 0
  const maxBalance = projection.length ? Math.max(...projection.map(p => p.balance)) : 0
  const finalBalance = projection.at(-1)?.balance ?? 0

  // ── insights ──────────────────────────────────────────────────────────────

  const bestWeek = useMemo(() => findExtreme(projection, 'best'), [projection])
  const worstWeek = useMemo(() => findExtreme(projection, 'worst'), [projection])

  // Upcoming recurring expenses: name, date, balance before/after
  const upcomingExpenses = useMemo(() => {
    const balMap = new Map(projection.map(p => [p.dateStr, p.balance]))
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + horizon)

    return recurringExpenses
      .flatMap(r => {
        let d = new Date(r.next_charge + 'T00:00:00')
        let g = 0; while (d < today && g++ < 800) d = advance(d, r.frequency)
        const hits: { id: string; name: string; amount: number; dateStr: string; dateLabel: string; balAfter: number }[] = []
        let c = 0
        while (d <= end && c++ < 6) {
          const key = d.toISOString().slice(0, 10)
          hits.push({
            id: `${r.id}-${key}`,
            name: r.name,
            amount: r.amount,
            dateStr: key,
            dateLabel: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }),
            balAfter: balMap.get(key) ?? 0,
          })
          d = advance(d, r.frequency)
        }
        return hits
      })
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(0, 10)
  }, [recurringExpenses, projection, horizon, today])

  // "¿Puedo pagarlo?" analysis
  type PaymentOk   = { canAfford: true;  amount: number; best: DayPoint }
  type PaymentFail = { canAfford: false; amount: number; maxBalance: number }
  const paymentResult = useMemo((): PaymentOk | PaymentFail | null => {
    const amount = Number(checkAmount)
    if (!amount || amount <= 0) return null
    const affordable = projection.filter(p => p.balance >= amount)
    if (affordable.length === 0) return { canAfford: false, amount, maxBalance }
    const best = affordable.reduce((b, p) => (p.balance > b.balance ? p : b))
    return { canAfford: true, amount, best }
  }, [checkAmount, projection, maxBalance])

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Datos base ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de tus registros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Stat label="Saldo actual" value={fmt(saldoEfectivo)} color={saldoEfectivo >= 0 ? 'green' : 'red'} />
            <Stat
              label="Ingresos / mes"
              value={fmt(effectiveIncome)}
              sub={monthlyScheduledIncome > 0 ? 'ingresos programados' : 'promedio 3 meses'}
              color="green"
            />
            <Stat label="Gastos fijos / mes" value={fmt(monthlyFixed)} sub="gastos programados" color="red" />
            <Stat label="Gasto variable / mes" value={fmt(effectiveVar)} sub={varOverride ? 'ajustado' : 'promedio 3 meses'} color="red" />
            <Stat label="Pagos deuda / mes" value={fmt(totalDebtMonthly)} sub={`${debts.length} deuda${debts.length !== 1 ? 's' : ''}`} color="red" />
          </div>

          <div className={`flex flex-wrap items-center gap-2 p-3 rounded-lg text-sm font-medium
            ${netMonthly >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            <span>Flujo neto mensual estimado:</span>
            <span className="font-bold text-base">{fmt(netMonthly)}</span>
            {netMonthly < 0 && <span className="text-xs opacity-80">— estás gastando más de lo que entra</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm shrink-0">Ajustar gasto variable mensual:</Label>
            <Input
              type="number"
              min="0"
              className="w-36 h-8 text-sm"
              placeholder={`${avgMonthlyVar} (calculado)`}
              value={varOverride}
              onChange={e => setVarOverride(e.target.value)}
            />
            {varOverride && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setVarOverride('')}>
                Restablecer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Proyección de saldo ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Saldo proyectado</CardTitle>
            <div className="flex gap-1">
              {([7, 30, 60, 90] as const).map(h => (
                <Button key={h} size="sm" variant={horizon === h ? 'default' : 'outline'} className="h-7 text-xs px-2.5"
                  onClick={() => setHorizon(h)}>
                  {h === 7 ? 'Semana' : `${h}d`}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.12)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={horizon <= 30 ? 4 : horizon <= 60 ? 3 : 2} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v, name) => {
                  if (name === 'balance') return [fmt(Number(v)), 'Saldo']
                  return [fmt(Number(v)), name]
                }}
                labelFormatter={l => `📅 ${l}`}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} name="balance" />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">Mínimo proyectado</p>
              <p className={`font-bold text-sm ${minBalance < 0 ? 'text-destructive' : ''}`}>{fmt(minBalance)}</p>
              {minBalance < 0 && <p className="text-[10px] text-destructive">⚠️ saldo negativo</p>}
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">Máximo proyectado</p>
              <p className="font-bold text-sm text-emerald-600">{fmt(maxBalance)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">Saldo en {horizon} días</p>
              <p className={`font-bold text-sm ${finalBalance < 0 ? 'text-destructive' : finalBalance > saldoEfectivo ? 'text-emerald-600' : ''}`}>
                {fmt(finalBalance)}
              </p>
              <p className="text-[10px] text-muted-foreground">en {horizonLabel[horizon]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Insights + ¿Puedo pagarlo? ────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Momentos clave */}
        <Card>
          <CardHeader><CardTitle className="text-base">Momentos clave</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bestWeek.start && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Mejor semana para compras grandes
                </p>
                <p className="font-semibold text-sm">
                  {new Date(bestWeek.start + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(bestWeek.end + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Saldo promedio esa semana: {fmt(bestWeek.avg)}</p>
              </div>
            )}

            {worstWeek.start && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                  Semana más ajustada — evita gastos imprevistos
                </p>
                <p className="font-semibold text-sm">
                  {new Date(worstWeek.start + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(worstWeek.end + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
                <p className={`text-xs mt-0.5 ${worstWeek.avg < 0 ? 'text-red-600 font-semibold' : 'text-red-500'}`}>
                  {worstWeek.avg < 0 ? '⚠️ ' : ''}Saldo promedio esa semana: {fmt(worstWeek.avg)}
                </p>
              </div>
            )}

            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Dinero libre estimado</p>
              <p>
                Al final del mes:{' '}
                <span className={`font-bold ${netMonthly >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {fmt(netMonthly)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                = {fmt(effectiveIncome)} ingresos − {fmt(monthlyFixed)} fijos − {fmt(effectiveVar)} variable − {fmt(totalDebtMonthly)} deudas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ¿Puedo pagarlo? */}
        <Card>
          <CardHeader><CardTitle className="text-base">¿Puedo pagarlo?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Monto del pago ($)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                placeholder="Ej: 5,000"
                value={checkAmount}
                onChange={e => setCheckAmount(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Ingresa cualquier monto y te digo cuándo conviene pagarlo.
              </p>
            </div>

            {paymentResult && (
              paymentResult.canAfford ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 space-y-2 text-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">Sí puedes pagarlo</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mejor día:</span>
                    <span className="font-medium">
                      {new Date(paymentResult.best.dateStr + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo proyectado ese día:</span>
                    <span className="font-medium">{fmt(paymentResult.best.balance + paymentResult.amount)}</span>
                  </div>
                  <div className="flex justify-between border-t dark:border-emerald-900 pt-2">
                    <span className="text-muted-foreground">Te quedaría después de pagar:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmt(paymentResult.best.balance)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 space-y-2 text-sm">
                  <p className="font-semibold text-red-700 dark:text-red-400">No alcanza en {horizonLabel[horizon]}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tu saldo máximo proyectado:</span>
                    <span className="font-medium">{fmt(paymentResult.maxBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Te falta acumular:</span>
                    <span className="font-medium text-destructive">{fmt(paymentResult.amount - paymentResult.maxBalance)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Intenta con el horizonte de 60 o 90 días.</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Próximos cobros ───────────────────────────────────────────────── */}
      {upcomingExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos cobros — impacto en tu saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {upcomingExpenses.map(item => {
                const balBefore = item.balAfter + item.amount
                const risky = balBefore < item.amount
                const tight = !risky && balBefore < item.amount * 2

                return (
                  <div key={item.id}
                    className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-sm">{risky ? '🔴' : tight ? '🟡' : '🟢'}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.dateLabel}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-destructive text-sm">{fmt(item.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        después: <span className={risky ? 'text-red-500 font-medium' : ''}>{fmt(item.balAfter)}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
              <span>🟢 Cómodo</span>
              <span>🟡 Ajustado</span>
              <span>🔴 Riesgo</span>
            </div>
          </CardContent>
        </Card>
      )}

      {recurringExpenses.length === 0 && recurringIncomes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>Configura tus <strong>Gastos Fijos</strong> e <strong>Ingresos Programados</strong> para obtener una proyección precisa.</p>
        </div>
      )}
    </div>
  )
}
