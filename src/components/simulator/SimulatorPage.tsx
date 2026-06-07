import { DebtSimulator } from './DebtSimulator'

export function SimulatorPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🔮 Simulador Financiero</h2>
      <p className="text-muted-foreground">Experimenta con tus finanzas sin alterar tus datos reales.</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <DebtSimulator />
        
        {/* Espacio para futuros simuladores (ej. Viabilidad de renta) */}
        <div className="opacity-50 pointer-events-none">
          <div className="border rounded-lg p-6 bg-muted/50 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
            <span className="text-4xl mb-3">🏠</span>
            <h3 className="font-semibold mb-1">Simulador de Renta</h3>
            <p className="text-sm text-muted-foreground">Próximamente...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
