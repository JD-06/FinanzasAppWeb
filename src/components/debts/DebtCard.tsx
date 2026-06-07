import type { Debt } from '@/lib/supabase/client'
import { calcDebtPayoff } from '@/lib/finance/engine'
import { useDebts } from '@/hooks/useDebts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props { debt: Debt }

export function DebtCard({ debt }: Props) {
  const { remove } = useDebts()
  const monthlyRate = debt.interest_rate / 12
  const payoff = calcDebtPayoff(debt.balance, debt.monthly_payment, monthlyRate)

  const payoffLabel = payoff.months === Infinity
    ? 'Pago insuficiente'
    : `${payoff.months} meses (${payoff.payoffDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })})`

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{debt.name}</h3>
          <Button variant="ghost" size="sm" onClick={() => remove.mutate(debt.id)}>✕</Button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Saldo</span>
          <span className="font-medium text-right">${debt.balance.toLocaleString('es-MX')}</span>
          <span className="text-muted-foreground">Pago mensual</span>
          <span className="font-medium text-right">${debt.monthly_payment.toLocaleString('es-MX')}</span>
          <span className="text-muted-foreground">Tasa anual</span>
          <span className="font-medium text-right">{(debt.interest_rate * 100).toFixed(1)}%</span>
          <span className="text-muted-foreground">Liquidación</span>
          <span className="font-medium text-right text-xs">{payoffLabel}</span>
          {payoff.totalInterest > 0 && payoff.totalInterest !== Infinity && (
            <>
              <span className="text-muted-foreground">Intereses totales</span>
              <span className="font-medium text-right text-red-500">${Math.round(payoff.totalInterest).toLocaleString('es-MX')}</span>
            </>
          )}
        </div>
        {payoff.months === Infinity && (
          <Badge variant="destructive" className="text-xs">El pago mensual no cubre los intereses</Badge>
        )}
      </CardContent>
    </Card>
  )
}
