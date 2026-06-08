import { useMemo } from 'react'
import { useRecurring } from '@/hooks/useRecurring'
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { computeFuturePayments } from '@/lib/finance/futurePayments'
import type { ListPeriod } from '@/lib/finance/listFilter'

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Mensual', weekly: 'Semanal', quincenal: 'Quincenal', yearly: 'Anual',
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function periodLabel(period: ListPeriod): string {
  if (period === 'week')  return 'Esta Semana'
  if (period === 'month') return 'Este Mes'
  if (period === 'year')  return 'Este Año'
  return 'Próximos 30 días'
}

interface Props {
  period: ListPeriod
}

export function FuturePaymentsCard({ period }: Props) {
  const { data: recurringExpenses = [] } = useRecurring()
  const { data: recurringIncomes = [] } = useRecurringIncomes()

  const result = useMemo(
    () => computeFuturePayments(recurringExpenses, recurringIncomes, period),
    [recurringExpenses, recurringIncomes, period]
  )

  const netFlow = result.totalIncomes - result.totalExpenses
  const label = periodLabel(period)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pagos Futuros — {label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Ingresos futuros</p>
            <p className="font-bold text-emerald-600">{fmt(result.totalIncomes)}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Gastos futuros</p>
            <p className="font-bold text-destructive">{fmt(result.totalExpenses)}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Flujo neto</p>
            <p className={`font-bold ${netFlow >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(netFlow)}</p>
          </div>
        </div>

        {/* Lista de gastos */}
        {result.expenses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Gastos programados</p>
            <div className="space-y-1.5">
              {result.expenses.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {FREQ_LABELS[item.frequency] ?? item.frequency}
                      {item.occurrences.length > 1
                        ? ` · ${item.occurrences.length} pagos · próximo ${fmtDate(item.nextDate)}`
                        : ` · ${fmtDate(item.nextDate)}`}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-semibold text-destructive">{fmt(item.total)}</span>
                    {item.occurrences.length > 1 && (
                      <p className="text-[10px] text-muted-foreground">{fmt(item.amount)} c/u</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de ingresos */}
        {result.incomes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ingresos programados</p>
            <div className="space-y-1.5">
              {result.incomes.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {FREQ_LABELS[item.frequency] ?? item.frequency}
                      {item.occurrences.length > 1
                        ? ` · ${item.occurrences.length} pagos · próximo ${fmtDate(item.nextDate)}`
                        : ` · ${fmtDate(item.nextDate)}`}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-semibold text-emerald-600">{fmt(item.total)}</span>
                    {item.occurrences.length > 1 && (
                      <p className="text-[10px] text-muted-foreground">{fmt(item.amount)} c/u</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.expenses.length === 0 && result.incomes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Sin pagos programados para {label.toLowerCase()}.
          </p>
        )}

      </CardContent>
    </Card>
  )
}
