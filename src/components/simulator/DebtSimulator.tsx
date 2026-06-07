import { useState } from 'react'
import { useDebts } from '@/hooks/useDebts'
import { simulateExtraPayment } from '@/lib/finance/simulator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DebtSimulator() {
  const { data: debts = [] } = useDebts()
  const [selectedDebtId, setSelectedDebtId] = useState('')
  const [extraPayment, setExtraPayment] = useState('')

  const selectedDebt = debts.find(d => d.id === selectedDebtId)
  const extraNum = Number(extraPayment) || 0

  let sim: any = null
  if (selectedDebt) {
    sim = simulateExtraPayment({ debt: selectedDebt, extraPayment: extraNum })
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Simulador de Deuda Acelerada</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Selecciona una deuda</Label>
          <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {debts.map(d => <SelectItem key={d.id} value={d.id}>{d.name} (${d.balance.toLocaleString('es-MX')})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {selectedDebt && (
          <div className="space-y-1">
            <Label>Pago extra mensual ($)</Label>
            <Input type="number" min="0" step="100" value={extraPayment} onChange={e => setExtraPayment(e.target.value)} placeholder="Ej: 500" />
          </div>
        )}

        {sim && sim.baseMonths !== Infinity && (
          <div className="bg-muted p-4 rounded-lg space-y-2 mt-4 text-sm">
            <p className="font-semibold text-base mb-2 text-primary">Resultados del simulador</p>
            <div className="flex justify-between"><span>Tiempo actual:</span> <span className="font-medium">{sim.baseMonths} meses</span></div>
            <div className="flex justify-between"><span>Nuevo tiempo:</span> <span className="font-medium text-green-600">{sim.newMonths} meses</span></div>
            <div className="flex justify-between"><span>Meses ahorrados:</span> <span className="font-medium text-blue-600">{sim.monthsSaved} meses</span></div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span>Intereses ahorrados:</span> 
              <span className="font-bold text-green-600">${Math.round(sim.interestSaved).toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between">
              <span>Nueva fecha de liquidación:</span> 
              <span className="font-medium">{sim.newPayoffDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        )}
        
        {sim && sim.baseMonths === Infinity && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            Tu pago actual no cubre los intereses. ¡Necesitas incrementar tu pago urgentemente!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
