import { useState, useMemo } from 'react'
import { useIncomes } from '@/hooks/useIncomes'
import { useExpenses } from '@/hooks/useExpenses'
import { useDebts } from '@/hooks/useDebts'
import { useGoals } from '@/hooks/useGoals'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import { useRecurring } from '@/hooks/useRecurring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type ListPeriod, LIST_PERIOD_LABELS,
  filterByListPeriod, navigatePeriod, periodRangeLabel, isRefInFuture,
} from '@/lib/finance/listFilter'
import { downloadCsv, printReport } from '@/lib/finance/report'

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function ReportCard() {
  const { data: incomes = [] } = useIncomes()
  const { data: expenses = [] } = useExpenses()
  const { data: debts = [] } = useDebts()
  const { data: goals = [] } = useGoals()
  const { data: recurringIncomes = [] } = useRecurringIncomes()
  const { data: recurringExpenses = [] } = useRecurring()

  const [period, setPeriod] = useState<ListPeriod>('month')
  const [refDate, setRefDate] = useState(() => new Date())

  const filteredIncomes  = useMemo(() => filterByListPeriod(incomes,  period, refDate), [incomes,  period, refDate])
  const filteredExpenses = useMemo(() => filterByListPeriod(expenses, period, refDate), [expenses, period, refDate])

  const totalIncome  = filteredIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  const reportData = {
    incomes:  filteredIncomes,
    expenses: filteredExpenses,
    debts,
    goals,
    recurringIncomes,
    recurringExpenses,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportar Informe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Selector de periodo + navegador ──────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(LIST_PERIOD_LABELS) as ListPeriod[]).map(p => (
              <Button key={p} size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}>
                {LIST_PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>

          {period !== 'all' && (
            <div className="flex items-center gap-1 border rounded-lg overflow-hidden shrink-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none"
                onClick={() => setRefDate(d => navigatePeriod(d, period, -1))}>‹</Button>
              <span className="px-2 text-xs font-medium text-center min-w-[120px]">
                {periodRangeLabel(period, refDate)}
              </span>
              <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none"
                disabled={isRefInFuture(period, refDate)}
                onClick={() => setRefDate(d => navigatePeriod(d, period, 1))}>›</Button>
            </div>
          )}
        </div>

        {/* ── Vista previa del periodo seleccionado ────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Ingresos</p>
            <p className="font-bold text-emerald-600">${fmt(totalIncome)}</p>
            <p className="text-[11px] text-muted-foreground">{filteredIncomes.length} registros</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Gastos</p>
            <p className="font-bold text-destructive">${fmt(totalExpense)}</p>
            <p className="text-[11px] text-muted-foreground">{filteredExpenses.length} registros</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Deudas</p>
            <p className="font-bold">{debts.length} deudas</p>
            <p className="text-[11px] text-muted-foreground">siempre completo</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Metas</p>
            <p className="font-bold">{goals.length} metas</p>
            <p className="text-[11px] text-muted-foreground">siempre completo</p>
          </div>
        </div>

        {/* ── Botones de descarga ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => downloadCsv(reportData)}>
            ⬇ Descargar CSV
          </Button>
          <Button variant="outline" onClick={() => printReport(reportData)}>
            🖨 Guardar PDF
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          El filtro aplica solo a ingresos y gastos. Deudas, metas y programados se incluyen siempre completos.
        </p>
      </CardContent>
    </Card>
  )
}
