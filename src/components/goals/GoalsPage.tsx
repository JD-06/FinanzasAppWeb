import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalForm } from './GoalForm'
import { GoalCard } from './GoalCard'

export function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎯 Metas Financieras</h2>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">Crear meta</CardTitle></CardHeader>
          <CardContent><GoalForm /></CardContent>
        </Card>
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
          {!isLoading && goals.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Sin metas registradas.</p>}
          {goals.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      </div>
    </div>
  )
}
