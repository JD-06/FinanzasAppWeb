import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GenericIncomeForm } from './GenericIncomeForm'
import { PayrollForm } from './PayrollForm'
import { IncomeList } from './IncomeList'
import { RecurringIncomeList } from './RecurringIncomeList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function IncomesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📈 Ingresos</h2>
      </div>

      <Tabs defaultValue="unicos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unicos">Ingresos Únicos / Registrar</TabsTrigger>
          <TabsTrigger value="frecuentes">Ingresos Programados</TabsTrigger>
        </TabsList>

        <TabsContent value="unicos" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Registrar Ingreso</CardTitle></CardHeader>
                <CardContent>
                  <Tabs defaultValue="nomina" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="nomina">Nómina</TabsTrigger>
                      <TabsTrigger value="varios">Varios</TabsTrigger>
                    </TabsList>
                    <TabsContent value="nomina">
                      <PayrollForm />
                    </TabsContent>
                    <TabsContent value="varios">
                      <GenericIncomeForm />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Historial de Ingresos</CardTitle></CardHeader>
                <CardContent><IncomeList /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="frecuentes" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader><CardTitle className="text-base">¿Cómo funciona?</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Para añadir un ingreso programado, ve a la pestaña "Ingresos Únicos", llena el formulario (ya sea Nómina o Varios) y activa el switch <strong>"Programar como ingreso frecuente"</strong>. 
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Esto añadirá tu ingreso de hoy, y guardará la programación para que puedas visualizarla aquí.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Ingresos Frecuentes Activos</CardTitle></CardHeader>
                <CardContent><RecurringIncomeList /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
