import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',            label: 'Dashboard',   icon: '📊' },
  { to: '/ingresos',   label: 'Ingresos',     icon: '📈' },
  { to: '/gastos',     label: 'Gastos',       icon: '📉' },
  { to: '/deudas',     label: 'Deudas',       icon: '📚' },
  { to: '/metas',      label: 'Metas',        icon: '🎯' },
  { to: '/simulador',  label: 'Simulador',    icon: '🔮' },
  { to: '/configuracion', label: 'Config',   icon: '⚙️' },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-card border-r flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">💰 Mis Finanzas</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t space-y-1">
        <ThemeToggle />
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
    >
      <span>{isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
    </button>
  )
}
