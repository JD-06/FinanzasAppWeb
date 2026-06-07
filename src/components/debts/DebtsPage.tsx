import { useDebts } from '@/hooks/useDebts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DebtForm } from './DebtForm'
import { DebtCard } from './DebtCard'

export function DebtsPage() {
  const { data: debts = [], isLoading } = useDebts()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📚 Deudas</h2>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">Agregar deuda</CardTitle></CardHeader>
          <CardContent><DebtForm /></CardContent>
        </Card>
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {!isLoading && debts.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin deudas registradas.</p>}
          {debts.map(d => <DebtCard key={d.id} debt={d} />)}
        </div>
      </div>
    </div>
  )
}
