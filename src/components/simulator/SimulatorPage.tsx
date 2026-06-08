import { DebtSimulator } from './DebtSimulator'
import { CashFlowSimulator } from './CashFlowSimulator'

export function SimulatorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Simulador Financiero</h2>
        <p className="text-muted-foreground text-sm mt-1">Proyecciones basadas en tus datos reales. Sin alterar tus registros.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Flujo de Caja</h3>
        <p className="text-sm text-muted-foreground">
          Proyección día a día usando tus ingresos y gastos programados más el promedio de gasto variable histórico.
          Indica cuándo es mejor pagar algo o qué semanas estarás más ajustado.
        </p>
        <CashFlowSimulator />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Deuda Acelerada</h3>
        <p className="text-sm text-muted-foreground">
          Simula cuánto tiempo y dinero en intereses ahorrarías si haces pagos extras a una deuda.
        </p>
        <DebtSimulator />
      </section>
    </div>
  )
}
