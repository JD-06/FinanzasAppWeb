import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { IncomesPage } from '@/components/incomes/IncomesPage'
import { ExpensesPage } from '@/components/expenses/ExpensesPage'
import { DebtsPage } from '@/components/debts/DebtsPage'
import { GoalsPage } from '@/components/goals/GoalsPage'
import { SimulatorPage } from '@/components/simulator/SimulatorPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

export function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!user) return <BrowserRouter><LoginPage /></BrowserRouter>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="ingresos" element={<IncomesPage />} />
          <Route path="gastos" element={<ExpensesPage />} />
          <Route path="deudas" element={<DebtsPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
