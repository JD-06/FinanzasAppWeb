import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',               label: 'Inicio',   icon: '📊' },
  { to: '/ingresos',      label: 'Ingresos', icon: '📈' },
  { to: '/gastos',        label: 'Gastos',   icon: '📉' },
  { to: '/deudas',        label: 'Deudas',   icon: '📚' },
  { to: '/metas',         label: 'Metas',    icon: '🎯' },
  { to: '/simulador',     label: 'Sim.',     icon: '🔮' },
  { to: '/configuracion', label: 'Config',   icon: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
      <div className="grid grid-cols-7 h-16">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              )
            }
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
