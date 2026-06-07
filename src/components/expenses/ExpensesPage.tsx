import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { RecurringForm } from './RecurringForm'
import { RecurringList } from './RecurringList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📉 Gastos</h2>
      </div>

      <Tabs defaultValue="unicos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unicos">Gastos Únicos / MSI</TabsTrigger>
          <TabsTrigger value="fijos">Suscripciones y Gastos Fijos</TabsTrigger>
        </TabsList>

        <TabsContent value="unicos" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader><CardTitle className="text-base">Registrar Gasto</CardTitle></CardHeader>
                <CardContent><ExpenseForm /></CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Historial de Gastos</CardTitle></CardHeader>
                <CardContent><ExpenseList /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fijos" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader><CardTitle className="text-base">Añadir Suscripción</CardTitle></CardHeader>
                <CardContent><RecurringForm /></CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Suscripciones Activas</CardTitle></CardHeader>
                <CardContent><RecurringList /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
