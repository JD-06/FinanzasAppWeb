import { useMemo } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import { StatCard } from './StatCard'
import { PeriodChart } from './PeriodChart'
import { ReportCard } from './ReportCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcGoalProgress, filterByPeriod } from '@/lib/finance/engine'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function Dashboard() {
  const {
    period, setPeriod,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    availableYears,
    globalStats, periodStats,
    incomes, expenses, goals,
    isLoading,
  } = useDashboard()

  const currentIncomes = useMemo(
    () => filterByPeriod(incomes, period, selectedYear, selectedMonth),
    [incomes, period, selectedYear, selectedMonth]
  )

  const incomeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    currentIncomes.forEach(i => {
      breakdown[i.type] = (breakdown[i.type] || 0) + i.amount
    })
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1])
  }, [currentIncomes])

  const savingsTarget = periodStats.income * 0.20
  const savingsActual = periodStats.freeCashFlow
  const savingsProgress = savingsTarget > 0
    ? Math.min(100, Math.max(0, (savingsActual / savingsTarget) * 100))
    : 0

  if (isLoading) return <p className="text-muted-foreground">Calculando...</p>

  const periodLabels = { week: 'Esta Semana', month: 'Mes', year: 'Año', all: 'Todo' }

  const canPrevYear = availableYears.length === 0 || selectedYear > availableYears[0]
  const canNextYear = selectedYear < new Date().getFullYear()

  const canPrevMonth = selectedMonth > 0
  const canNextMonth = selectedMonth < 11

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cuentas y Saldos (Global)</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💎" label="Patrimonio Neto"  value={fmt(globalStats.netWorth)}     color={globalStats.netWorth >= 0 ? 'green' : 'red'} />
        <StatCard icon="🏦" label="Dinero Real"      value={fmt(globalStats.saldoEfectivo)} color={globalStats.saldoEfectivo >= 0 ? 'green' : 'red'} />
        <StatCard icon="💳" label="Saldo Vales"      value={fmt(globalStats.saldoVales)}   color="green" />
        <StatCard icon="🏢" label="Fondo Ahorro"     value={fmt(globalStats.saldoFondo)}   color="green" />
      </div>

      {/* ── Controles de periodo y año ── */}
      <div className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">Flujo por Periodo</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de periodo */}
          {(['week', 'month', 'year', 'all'] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}

          {/* Navegador de año */}
          {(period === 'year' || period === 'month') && (
            <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none" disabled={!canPrevYear} onClick={() => setSelectedYear(y => y - 1)}>‹</Button>
              <span className="px-2 text-sm font-semibold tabular-nums">{selectedYear}</span>
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none" disabled={!canNextYear} onClick={() => setSelectedYear(y => y + 1)}>›</Button>
            </div>
          )}

          {/* Navegador de mes */}
          {period === 'month' && (
            <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none" disabled={!canPrevMonth} onClick={() => setSelectedMonth(m => m - 1)}>‹</Button>
              <span className="px-2 text-sm font-semibold w-8 text-center">{MONTHS[selectedMonth]}</span>
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none" disabled={!canNextMonth} onClick={() => setSelectedMonth(m => m + 1)}>›</Button>
            </div>
          )}
        </div>
      </div>

      {/* Label del periodo activo */}
      <p className="text-sm text-muted-foreground -mt-2">
        {period === 'year'  && `Enero – Diciembre ${selectedYear}`}
        {period === 'month' && `${MONTHS[selectedMonth]} ${selectedYear}`}
        {period === 'week'  && 'Últimos 7 días'}
        {period === 'all'   && 'Todos los registros'}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon="📈" label={`Ingresos (${periodLabels[period]})`}   value={fmt(periodStats.income)}       color="green" />
        <StatCard icon="💰" label={`Flujo Libre (${periodLabels[period]})`} value={fmt(periodStats.freeCashFlow)} color={periodStats.freeCashFlow >= 0 ? 'green' : 'red'} />
        <StatCard icon="📉" label="Total Gastos"      value={fmt(periodStats.expense)}      color="red" />
        <StatCard icon="💵" label="Gastos Dinero Real" value={fmt(periodStats.realExpenses)}  color="red" />
        <StatCard icon="🎟️" label="Gastos Vales"      value={fmt(periodStats.valesExpenses)} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
            <CardContent>
              <PeriodChart
                incomes={incomes}
                expenses={expenses}
                period={period}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Desglose de Ingresos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {incomeBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ingresos este periodo.</p>
              ) : (
                incomeBreakdown.map(([type, amount]) => {
                  const pct = periodStats.income > 0 ? (amount / periodStats.income) * 100 : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-xs truncate max-w-[150px]" title={type}>{type}</span>
                        <span className="text-emerald-600 font-medium">{fmt(amount)}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Meta de Ahorro (20%)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Progreso</span>
                  <span className="text-muted-foreground">{savingsProgress.toFixed(1)}%</span>
                </div>
                <Progress value={savingsProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Ahorrado: {fmt(savingsActual > 0 ? savingsActual : 0)}</span>
                  <span>Meta: {fmt(savingsTarget)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {goals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Mis metas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {goals.map(g => {
              const pct = calcGoalProgress(g.current_amount, g.target_amount)
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{fmt(g.current_amount)}</span>
                    <span>{fmt(g.target_amount)}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <ReportCard />
    </div>
  )
}
