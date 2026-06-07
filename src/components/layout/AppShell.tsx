import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useAutoProcess } from '@/hooks/useAutoProcess'

export function AppShell() {
  useAutoProcess()
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </div>
      </main>

      {/* Barra inferior — solo móvil */}
      <BottomNav />
    </div>
  )
}
